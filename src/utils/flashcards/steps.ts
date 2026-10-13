// src/utils/flashcards/steps.ts
//
// Ступени карточек: слова раздела HSK в порядке изучения, по STEP_SIZE слов.
// Порядок и деление — те же функции, что в «Написании» (utils/writing/steps.ts),
// но слова берутся из всей базы: в чтении есть и длинные слова (图书馆, 很高兴认识你),
// которых нет в письме. Поэтому ступени могут слегка отличаться от письменных.
//
// Слово считается освоенным при 3 точках чтения (или отметке «знаю» в словаре).

import type { Word } from "@/content/flashcards/types";
import { getWordFrequency } from "@/content/words/hsk";
import { allWords } from "@/content/words/vocabulary";
import { getWordLevel } from "@/store/wordProgressStore";
import {
  chunkSteps,
  orderLevelWords,
  STEP_SIZE,
} from "@/utils/writing/steps";
import {
  getWordHskLevel,
  NO_HSK_LEVEL,
  type ProgressMap,
  type WritingLevel,
} from "@/utils/writing/words";

export type ReadingLevel = WritingLevel;

export { STEP_SIZE };

/** Меньше слов карточкам не хватает на 4 варианта ответа. */
const MIN_STEP_WORDS = 4;

function frequencyOf(word: Word): number {
  return getWordFrequency(word.vocabularyId) ?? Number.MAX_SAFE_INTEGER;
}

let levelsCache: ReadingLevel[] | null = null;

/** Разделы с словами: HSK по возрастанию, «Другие слова» в конце. */
export function getReadingLevels(): ReadingLevel[] {
  if (levelsCache) return levelsCache;

  const levels = new Set(allWords.map(getWordHskLevel));
  levelsCache = Array.from(levels).sort(
    (a, b) =>
      (a === NO_HSK_LEVEL ? Infinity : a) - (b === NO_HSK_LEVEL ? Infinity : b),
  );
  return levelsCache;
}

const stepsCache = new Map<ReadingLevel, Word[][]>();

/** Ступени раздела. Считаются один раз. */
export function getReadingSteps(level: ReadingLevel): Word[][] {
  const cached = stepsCache.get(level);
  if (cached) return cached;

  // Иероглифы предыдущих разделов считаются знакомыми
  const knownChars = new Set<string>();
  for (const word of allWords) {
    const wordLevel = getWordHskLevel(word);
    const isEarlier =
      wordLevel !== NO_HSK_LEVEL &&
      (level === NO_HSK_LEVEL || wordLevel < level);
    if (isEarlier) {
      for (const char of Array.from(word.hanzi)) knownChars.add(char);
    }
  }

  const levelWords = allWords.filter((word) => getWordHskLevel(word) === level);
  const steps = chunkSteps(
    orderLevelWords(levelWords, knownChars, frequencyOf),
    STEP_SIZE,
  );

  // Короткий хвост (меньше 4 слов) не потренировать карточками — присоединяем к предыдущей
  const last = steps[steps.length - 1];
  if (steps.length > 1 && last.length < MIN_STEP_WORDS) {
    steps.pop();
    steps[steps.length - 1] = [...steps[steps.length - 1], ...last];
  }

  stepsCache.set(level, steps);
  return steps;
}

/** Точки чтения слова (0–3). */
export function getReadingDots(
  word: Word,
  progress: ProgressMap,
  knownIds: ReadonlySet<string>,
): 0 | 1 | 2 | 3 {
  return getWordLevel(
    progress[word.vocabularyId],
    knownIds.has(word.vocabularyId),
    ["reading"],
  );
}

// ── id тренировки ступени ────────────────────────────────────────────────────
// Экран тренировки принимает один параметр setId: это id своего набора
// или «step:1:3» — раздел HSK 1, ступень с индексом 3.

const STEP_ID_PREFIX = "step:";

export function stepTrainingId(level: ReadingLevel, index: number): string {
  return `${STEP_ID_PREFIX}${level}:${index}`;
}

export function parseStepTrainingId(
  id: string,
): { level: ReadingLevel; index: number } | null {
  if (!id.startsWith(STEP_ID_PREFIX)) return null;

  const [level, index] = id.slice(STEP_ID_PREFIX.length).split(":").map(Number);
  if (!Number.isInteger(level) || !Number.isInteger(index)) return null;
  return { level, index };
}

export function describeReadingLevel(level: ReadingLevel): string {
  return level === NO_HSK_LEVEL ? "Другие слова" : `HSK ${level}`;
}

/** Слова и название тренировки ступени по её id. null — такой ступени нет. */
export function findStepTraining(
  id: string,
): { title: string; words: Word[] } | null {
  const parsed = parseStepTrainingId(id);
  if (!parsed) return null;

  const words = getReadingSteps(parsed.level)[parsed.index];
  if (!words) return null;

  return {
    title: `${describeReadingLevel(parsed.level)} · Ступень ${parsed.index + 1}`,
    words,
  };
}
