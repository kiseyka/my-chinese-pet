// src/utils/panda/thoughts.ts
//
// ФРАЗА ДНЯ (облачко «…»). Панда сама не заговаривает: раз в день, когда ей есть что
// сказать, над головой появляется облачко и висит, пока пользователь не тапнет по
// панде. Тап — сцена разговора /panda-talk: сначала фраза дня, после «Понятно» —
// меню игр (utils/panda/play). Облачко — только фраза, загадок в нём нет: в загадки
// играют по желанию, из меню.
//
// Фраза дня — короткая фраза на китайском из слов, которые пользователь уже изучает
// (content/panda/thoughtPhrases.ts): факт, разговорное выражение с пояснением или
// вопрос-знакомство («какой цвет тебе нравится?»). Ответ на вопрос запоминается и
// открывает фразы с requires («ты любишь зелёный — мой цветок тоже»). Прочитанная
// фраза уходит в «Фразы дня» в профиле и до конца дня открывается из меню игр.
//
// Правила:
//   - одна фраза в день (появляется при первом заходе на экран панды за день,
//     если есть подходящая фраза);
//   - непрочитанная фраза живёт до конца дня, потом тихо пропадает (не считается
//     рассказанной и вернётся позже);
//   - фраза только к месту (when: время суток, время года — utils/panda/phraseTime);
//     если облачко ждало, а время фразы прошло («доброе утро» днём), оно пропадает;
//   - рассказанная фраза больше не предлагается; показанная, но не дочитанная — не
//     раньше чем через RECENT_PHRASES_LIMIT других (если есть из чего выбрать).

import { pandaPhrases, type PandaPhrase } from "@/content/panda/thoughtPhrases";
import { rememberPhrase, usePandaStore } from "@/store/pandaStore";
import { useWordProgressStore } from "@/store/wordProgressStore";
import { dayKey } from "@/utils/activity";
import { shuffle } from "@/utils/shuffle";
import { getPhraseWords } from "./phraseSegments";
import { fitsNow } from "./phraseTime";

export type PandaThought = { kind: "phrase"; phraseId: string; createdAt: number };

/**
 * Для проверки на телефоне: true — фраза дня появляется при каждом входе на экран
 * панды (если старую закрыли), без дневного лимита. Перед слиянием — false.
 */
const TEST_MODE = false as boolean;

type ProgressMap = ReturnType<
  typeof useWordProgressStore.getState
>["flashcardWords"];

/** У слова есть хотя бы одна точка (перевода или письма). */
function isStarted(progress: ProgressMap, wordId: string): boolean {
  const item = progress[wordId];
  return !!item && (item.reading.streak > 0 || item.writing.streak > 0);
}

/** Фразы, все слова которых пользователь уже изучает и которые ещё не рассказаны. */
export function getAvailablePhrases(now = Date.now()): PandaPhrase[] {
  const progress = useWordProgressStore.getState().flashcardWords;
  const { seenPhraseIds, answers } = usePandaStore.getState();
  const seen = new Set(seenPhraseIds);
  return pandaPhrases.filter((phrase) => {
    if (seen.has(phrase.id)) return false;
    if (!fitsNow(phrase, now)) return false;
    // «Панда помнит»: фраза только после нужного ответа на её вопрос
    if (
      phrase.requires &&
      answers[phrase.requires.phraseId] !== phrase.requires.replyId
    ) {
      return false;
    }
    const words = getPhraseWords(phrase);
    return !!words && words.every((w) => isStarted(progress, w.vocabularyId));
  });
}

/** Случайная фраза; недавно показанные — только если других нет. */
function pickPhrase(phrases: PandaPhrase[]): PandaPhrase | undefined {
  const recent = new Set(usePandaStore.getState().recentPhraseIds);
  const fresh = phrases.filter((phrase) => !recent.has(phrase.id));
  return shuffle(fresh.length > 0 ? fresh : phrases)[0];
}

/** Мысль, которую уже нельзя показать: старый вид (загадка), фразы нет или не к месту. */
function isStale(thought: PandaThought, now: number): boolean {
  if (thought.kind !== "phrase") return true;
  const phrase = pandaPhrases.find((p) => p.id === thought.phraseId);
  return !phrase || !fitsNow(phrase, now) || dayKey(thought.createdAt) !== dayKey(now);
}

/**
 * Если пора — выбирает фразу дня и показывает облачко. Вызывается при входе на экран
 * панды. Ничего не делает, если фраза уже висит или сегодня уже была.
 */
export function createThoughtIfDue(now = Date.now()) {
  const panda = usePandaStore.getState();
  const day = dayKey(now);

  if (panda.thought && isStale(panda.thought, now)) {
    usePandaStore.setState({ thought: null });
  } else if (panda.thought) {
    return;
  }

  const hadToday =
    panda.thoughtsToday.day === day && panda.thoughtsToday.kinds.length > 0;
  if (!TEST_MODE && hadToday) return;

  const phrase = pickPhrase(getAvailablePhrases(now));
  if (phrase) {
    panda.showThought({ kind: "phrase", phraseId: phrase.id, createdAt: now }, day);
  }
}

/** Фраза дня прочитана. */
export function resolveThought() {
  usePandaStore.getState().resolveThought();
}

/** Фраза, прочитанная сегодня (её можно открыть ещё раз из меню игр). */
export function getTodayPhraseId(now = Date.now()): string | undefined {
  const day = dayKey(now);
  const today = usePandaStore
    .getState()
    .collectedPhrases.filter((item) => dayKey(item.at) === day);
  return today[today.length - 1]?.phraseId;
}

// ── Проверка на телефоне ─────────────────────────────────────────────────────

export type TestThought = "phrase" | "question";

/** Пауза между «убрать старое облачко» и «показать новое», чтобы Rive доиграл. */
const TEST_SWAP_DELAY_MS = 500;

/**
 * Только для проверки (кнопки на экране панды в режиме разработки): сразу показывает
 * облачко с фразой (или вопросом), без правил и лимитов, и не трогает дневной счёт.
 * Сначала фразы, которые прошли бы по правилам, иначе любая.
 * Уже висящее облачко сначала убирается — чтобы Rive заново проиграл появление.
 */
export function showTestThought(type: TestThought) {
  const fits = (p: PandaPhrase) => type === "phrase" || !!p.replies;
  const available = getAvailablePhrases().filter(fits);
  const phrase = pickPhrase(
    available.length > 0 ? available : pandaPhrases.filter(fits),
  );
  if (!phrase) return;

  usePandaStore.setState((state) => ({
    recentPhraseIds: rememberPhrase(state.recentPhraseIds, phrase.id),
  }));
  const thought: PandaThought = {
    kind: "phrase",
    phraseId: phrase.id,
    createdAt: Date.now(),
  };

  if (!usePandaStore.getState().thought) {
    usePandaStore.setState({ thought });
    return;
  }
  usePandaStore.setState({ thought: null });
  setTimeout(() => usePandaStore.setState({ thought }), TEST_SWAP_DELAY_MS);
}

/**
 * Только для проверки: убрать облачко, сбросить дневной лимит фразы, лимит игр по
 * тапу (15 за 3 часа) и список недавно загаданных слов.
 */
export function resetTestThoughts() {
  usePandaStore.setState({
    thought: null,
    lastThoughtAt: 0,
    thoughtsToday: { day: "", kinds: [] },
    playTimes: [],
    recentRiddleWordIds: [],
    recentPhraseIds: [],
  });
}
