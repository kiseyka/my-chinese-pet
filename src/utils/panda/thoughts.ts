// src/utils/panda/thoughts.ts
//
// ФРАЗА ДНЯ (облачко «…»). Панда сама не заговаривает: раз в день, когда ей есть что
// сказать, над головой появляется облачко и висит, пока пользователь не тапнет по
// панде. Тап — сцена разговора /panda-talk: сначала фраза дня, после «Понятно» —
// меню игр (utils/panda/play). Облачко — только фраза, загадок в нём нет: в загадки
// играют по желанию, из меню.
//
// Фраза дня — короткая фраза на китайском по уровню пользователя (utils/panda/phraseLevel:
// фразы HSK 1 и 2 открыты сразу, HSK 3 — с HSK 2, HSK 4 — с HSK 3)
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
//
// Фраза о комнате (kind: "room", roomPhrases): в комнате появился новый предмет или
// поменялся старый — при следующем заходе на экран панды облачко с фразой о комнате.
// Важнее фразы дня (реакция сразу), но в дневной лимит не входит, в коллекцию не
// попадает и может повторяться. Если в этот момент уже висит облачко — реакции нет.

import {
  findPandaPhrase,
  pandaPhrases,
  roomPhrases,
  type PandaPhrase,
} from "@/content/panda/thoughtPhrases";
import { rememberPhrase, usePandaStore } from "@/store/pandaStore";
import { useRoomStore } from "@/store/roomStore";
import { dayKey } from "@/utils/activity";
import { shuffle } from "@/utils/shuffle";
import { getUserHskLevel, isPhraseUnlocked } from "./phraseLevel";
import { fitsNow } from "./phraseTime";

/** phrase — фраза дня; room — фраза о комнате (после смены предмета). */
export type PandaThought = {
  kind: "phrase" | "room";
  phraseId: string;
  createdAt: number;
};

/**
 * Для проверки на телефоне: true — фраза дня появляется при каждом входе на экран
 * панды (если старую закрыли), без дневного лимита. Перед слиянием — false.
 */
const TEST_MODE = false as boolean;

/** Фразы, открытые по уровню HSK и ещё не рассказанные. */
export function getAvailablePhrases(now = Date.now()): PandaPhrase[] {
  const level = getUserHskLevel();
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
    return isPhraseUnlocked(phrase, level);
  });
}

/** Первой панда представляется («Привет! Я Жужа!»), если эта фраза уже доступна. */
const FIRST_PHRASE_ID = "hello-name";

/** Случайная фраза; недавно показанные — только если других нет. */
function pickPhrase(phrases: PandaPhrase[]): PandaPhrase | undefined {
  const first = phrases.find((phrase) => phrase.id === FIRST_PHRASE_ID);
  if (first) return first;
  const recent = new Set(usePandaStore.getState().recentPhraseIds);
  const fresh = phrases.filter((phrase) => !recent.has(phrase.id));
  return shuffle(fresh.length > 0 ? fresh : phrases)[0];
}

/** Комната как строка: поменялась строка — поменялся какой-то предмет. */
function roomSnapshot(): string {
  const { cabinetType, posterType, wallType, floorType, carpetType } =
    useRoomStore.getState();
  return [cabinetType, posterType, wallType, floorType, carpetType].join("|");
}

/** Фраза о комнате: по уровню, не та же, что в прошлый раз (если есть другая). */
function pickRoomPhrase(now: number): PandaPhrase | undefined {
  const last = usePandaStore.getState().recentPhraseIds[0];
  const level = getUserHskLevel();
  const fits = roomPhrases.filter(
    (p) => fitsNow(p, now) && isPhraseUnlocked(p, level),
  );
  const fresh = fits.filter((p) => p.id !== last);
  return shuffle(fresh.length > 0 ? fresh : fits)[0];
}

/** Мысль, которую уже нельзя показать: старый вид (загадка), фразы нет или не к месту. */
function isStale(thought: PandaThought, now: number): boolean {
  if (thought.kind !== "phrase" && thought.kind !== "room") return true;
  const phrase = findPandaPhrase(thought.phraseId);
  return !phrase || !fitsNow(phrase, now) || dayKey(thought.createdAt) !== dayKey(now);
}

/**
 * Если пора — показывает облачко: фразу о комнате (если поменялся предмет) или фразу
 * дня. Вызывается при входе на экран панды. Ничего не делает, если облачко уже висит.
 */
export function createThoughtIfDue(now = Date.now()) {
  const panda = usePandaStore.getState();
  const day = dayKey(now);

  // Комната: сравниваем с тем, что панда видела в прошлый раз. В первый раз только
  // запоминаем (иначе панда отреагировала бы на комнату по умолчанию)
  const room = roomSnapshot();
  const roomChanged = panda.roomSeen !== null && panda.roomSeen !== room;
  if (panda.roomSeen !== room) usePandaStore.setState({ roomSeen: room });

  if (panda.thought && isStale(panda.thought, now)) {
    usePandaStore.setState({ thought: null });
  } else if (panda.thought) {
    return;
  }

  if (roomChanged) {
    const roomPhrase = pickRoomPhrase(now);
    if (roomPhrase) {
      panda.showThought(
        { kind: "room", phraseId: roomPhrase.id, createdAt: now },
        day,
      );
      return;
    }
  }

  const hadToday =
    panda.thoughtsToday.day === day &&
    panda.thoughtsToday.kinds.includes("phrase");
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

export type TestThought = "phrase" | "question" | "room";

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
  const phrase =
    type === "room"
      ? (pickRoomPhrase(Date.now()) ?? shuffle(roomPhrases)[0])
      : pickPhrase(available.length > 0 ? available : pandaPhrases.filter(fits));
  if (!phrase) return;

  usePandaStore.setState((state) => ({
    recentPhraseIds: rememberPhrase(state.recentPhraseIds, phrase.id),
  }));
  const thought: PandaThought = {
    kind: type === "room" ? "room" : "phrase",
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
