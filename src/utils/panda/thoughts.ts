// src/utils/panda/thoughts.ts
//
// МЫСЛИ ПАНДЫ. Панда сама не заговаривает: когда ей есть что сказать, над головой
// появляется облачко «…» и висит, пока пользователь не тапнет по панде. Тап — реплика
// (тап по облачку и есть «да, давай»). Смахнул реплику — облачко остаётся.
// Непрочитанная мысль живёт до конца дня, потом тихо пропадает (фраза не считается
// рассказанной и вернётся позже).
//
// Виды мыслей:
//   phrase — короткая фраза на китайском из слов, которые пользователь уже изучает
//            (content/panda/thoughtPhrases.ts). Разобрал — фраза в коллекции профиля.
//            У вопросов — варианты ответа; ответ запоминается и открывает фразы
//            с requires («ты любишь зелёный — мой цветок тоже»);
//   riddle — загадка по слову из «Повторения», если сегодня ещё не было тренировки:
//            pick  — по переводу выбрать иероглиф из трёх;
//            write — написать слово по памяти (если его уже писали).
//            Точек не даёт, ошибка ничего не отнимает.
//   (позже: коробка с подарком за вехи пути, праздники.)
//
// Правила, чтобы не надоедало (createThoughtIfDue, на входе на экран панды):
//   - одна мысль за раз, новая не появляется поверх старой;
//   - не больше одной мысли каждого вида в день (то есть не больше MAX_PER_DAY);
//   - между мыслями пауза MIN_GAP_MS — облачко не встречает после каждой тренировки;
//   - мысль вчерашнего дня, которую так и не открыли, пропадает;
//   - фразы не повторяются: рассказанная фраза больше не предлагается;
//   - слово загадки не повторяется среди последних нескольких.

import type { Word } from "@/content/flashcards/types";
import { pandaPhrases, type PandaPhrase } from "@/content/panda/thoughtPhrases";
import { allWords, findWord } from "@/content/words/vocabulary";
import { useActivityStore } from "@/store/activityStore";
import { usePandaStore } from "@/store/pandaStore";
import { useWordProgressStore } from "@/store/wordProgressStore";
import { dayKey } from "@/utils/activity";
import { shuffle } from "@/utils/shuffle";
import { getWritableWords } from "@/utils/writing/words";
import { getPhraseWords } from "./phraseSegments";

export type ThoughtKind = "phrase" | "riddle";
export type RiddleForm = "pick" | "write";

export type PandaThought =
  | { kind: "phrase"; phraseId: string; createdAt: number }
  | { kind: "riddle"; form: RiddleForm; wordId: string; createdAt: number };

/** Пауза между мыслями. */
export const MIN_GAP_MS = 2 * 60 * 60 * 1000;
/** Видов мыслей сейчас два, каждый не чаще раза в день. */
export const MAX_PER_DAY = 2;
/**
 * Для проверки на телефоне: true — без паузы, дневных лимитов, «Не сейчас» и условия
 * «сегодня не было тренировки». Новая мысль появляется при каждом входе на экран панды
 * (если старую закрыли). Перед слиянием — вернуть false.
 */
const TEST_MODE = true as boolean;

/** С какой вероятностью загадка просит написать слово (если его уже писали). */
const WRITE_RIDDLE_CHANCE = 0.5;

type ProgressMap = ReturnType<
  typeof useWordProgressStore.getState
>["flashcardWords"];

/** У слова есть хотя бы одна точка (перевода или письма). */
function isStarted(progress: ProgressMap, wordId: string): boolean {
  const item = progress[wordId];
  return !!item && (item.reading.streak > 0 || item.writing.streak > 0);
}

/** Фразы, все слова которых пользователь уже изучает и которые ещё не рассказаны. */
export function getAvailablePhrases(): PandaPhrase[] {
  const progress = useWordProgressStore.getState().flashcardWords;
  const { seenPhraseIds, answers } = usePandaStore.getState();
  const seen = new Set(seenPhraseIds);

  return pandaPhrases.filter((phrase) => {
    if (seen.has(phrase.id)) return false;
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

/** Слова «Повторения», по которым можно загадать загадку (новые первыми). */
function getRiddleWords(): Word[] {
  const { review } = useWordProgressStore.getState();
  const recent = new Set(usePandaStore.getState().recentRiddleWordIds);

  // Иероглифы «char:…» пропускаем: у них нет своего перевода, загадать нечего
  const words = Object.keys(review)
    .map((id) => findWord(id))
    .filter((word): word is Word => !!word);

  const fresh = words.filter((word) => !recent.has(word.vocabularyId));
  return shuffle(fresh.length > 0 ? fresh : words);
}

function canWrite(word: Word): boolean {
  if (getWritableWords([word]).length === 0) return false;
  const progress = useWordProgressStore.getState().flashcardWords;
  return (progress[word.vocabularyId]?.writing.streak ?? 0) > 0;
}

function buildPhraseThought(now: number): PandaThought | null {
  const [phrase] = shuffle(getAvailablePhrases());
  return phrase ? { kind: "phrase", phraseId: phrase.id, createdAt: now } : null;
}

function buildRiddleThought(now: number): PandaThought | null {
  // Загадка — повод вспомнить слова, когда сегодня ещё не занимались
  if (!TEST_MODE && useActivityStore.getState().days[dayKey(now)]) return null;

  const [word] = getRiddleWords();
  if (!word) return null;

  const form: RiddleForm =
    canWrite(word) && Math.random() < WRITE_RIDDLE_CHANCE ? "write" : "pick";

  return { kind: "riddle", form, wordId: word.vocabularyId, createdAt: now };
}

const BUILDERS: Record<ThoughtKind, (now: number) => PandaThought | null> = {
  phrase: buildPhraseThought,
  riddle: buildRiddleThought,
};

/**
 * Если пора — придумывает мысль и показывает облачко. Вызывается при входе на экран
 * панды. Ничего не делает, если мысль уже есть или правила не разрешают.
 */
export function createThoughtIfDue(now = Date.now()) {
  const panda = usePandaStore.getState();
  const day = dayKey(now);

  // Вчерашняя мысль, которую так и не открыли, тихо пропадает
  if (panda.thought && dayKey(panda.thought.createdAt) !== day) {
    usePandaStore.setState({ thought: null });
  } else if (panda.thought) {
    return;
  }

  if (!TEST_MODE && now - panda.lastThoughtAt < MIN_GAP_MS) return;

  const usedToday =
    panda.thoughtsToday.day === day ? panda.thoughtsToday.kinds : [];
  if (!TEST_MODE && usedToday.length >= MAX_PER_DAY) return;

  const kinds = shuffle(Object.keys(BUILDERS) as ThoughtKind[]).filter(
    (kind) =>
      TEST_MODE || (!usedToday.includes(kind) && panda.snoozed[kind] !== day),
  );

  for (const kind of kinds) {
    const thought = BUILDERS[kind](now);
    if (thought) {
      panda.showThought(thought, day);
      return;
    }
  }
}

/** Мысль закрыта ответом. */
export function resolveThought(result: "done") {
  usePandaStore.getState().resolveThought(result, dayKey());
}
// ── Проверка на телефоне ─────────────────────────────────────────────────────

export type TestThought = "phrase" | "question" | "pick" | "write";

/** Пауза между «убрать старое облачко» и «показать новое», чтобы Rive доиграл. */
const TEST_SWAP_DELAY_MS = 500;

function pickTestThought(type: TestThought, now: number): PandaThought | null {
  if (type === "phrase" || type === "question") {
    // Сначала фразы, которые прошли бы по правилам, иначе любая.
    // «Вопрос» — только фразы с вариантами ответа
    const fits = (p: PandaPhrase) => type === "phrase" || !!p.replies;
    const available = getAvailablePhrases().filter(fits);
    const [phrase] = shuffle(
      available.length > 0 ? available : pandaPhrases.filter(fits),
    );
    return phrase ? { kind: "phrase", phraseId: phrase.id, createdAt: now } : null;
  }

  const progress = useWordProgressStore.getState().flashcardWords;
  const fits = (word: Word) =>
    type === "pick" || getWritableWords([word]).length > 0;

  // Сначала «Повторение», потом начатые слова, потом любые
  const candidates = [
    getRiddleWords(),
    shuffle(allWords.filter((w) => isStarted(progress, w.vocabularyId))),
    shuffle(allWords),
  ];
  for (const list of candidates) {
    const word = list.find(fits);
    if (word) {
      return { kind: "riddle", form: type, wordId: word.vocabularyId, createdAt: now };
    }
  }
  return null;
}

/**
 * Только для проверки (кнопки на экране панды в режиме разработки): сразу показывает
 * облачко с мыслью нужного вида, без правил и лимитов, и не трогает дневной счёт.
 * Уже висящее облачко сначала убирается — чтобы Rive заново проиграл появление.
 */
export function showTestThought(type: TestThought) {
  const thought = pickTestThought(type, Date.now());
  if (!thought) return;

  if (!usePandaStore.getState().thought) {
    usePandaStore.setState({ thought });
    return;
  }
  usePandaStore.setState({ thought: null });
  setTimeout(() => usePandaStore.setState({ thought }), TEST_SWAP_DELAY_MS);
}

/** Только для проверки: убрать облачко и сбросить паузу, лимиты и «Не сейчас». */
export function resetTestThoughts() {
  usePandaStore.setState({
    thought: null,
    lastThoughtAt: 0,
    thoughtsToday: { day: "", kinds: [] },
    snoozed: {},
  });
}
