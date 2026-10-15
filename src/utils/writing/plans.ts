// src/utils/writing/plans.ts
//
// Планы уроков письма: какие слова и в каком формате пройдут в тренировке.
// План — список LessonItem; дальше его разворачивает в этапы useWritingLesson.

import type { Word } from "@/content/flashcards/types";
import { useCustomSetsStore } from "@/store/customSetsStore";
import { useWordProgressStore } from "@/store/wordProgressStore";
import { shuffle } from "@/utils/shuffle";
import type { LessonFormat } from "./stages";
import {
  getLevelSequence,
  getLevelSteps,
  getLevelStepsProgress,
} from "./steps";
import {
  findPracticeWord,
  findPracticeWords,
  getWordWritingDots,
  type ProgressMap,
  type WritingLevel,
} from "./words";

export interface LessonItem {
  word: Word;
  format: LessonFormat;
  /** Подпись задания: «Новое слово», «Повторение» и т.д. */
  roleLabel: string;
  /** Если слово написано только с подсказками, в конце урока оно получает работу над ошибками. */
  retryDeep?: boolean;
  /** Это задание — работа над ошибками (не входит в счёт урока). */
  isDeep?: boolean;
}

// ── Свободная тренировка (одно слово из сетки) ───────────────────────────────

/** Формат свободной тренировки: полный цикл или быстрый (контур → по памяти). */
export type FreeFormat = "full" | "quick";

/**
 * Свободная тренировка: одно выбранное слово или иероглиф (id вида «char:么»).
 * Слово ищется во всей базе, в том числе среди слов HSK.
 */
export function createFreePlan(
  vocabularyId: string,
  format: FreeFormat = "full",
): LessonItem[] {
  const word = findPracticeWord(vocabularyId);

  return word
    ? [
        {
          word,
          format,
          roleLabel:
            format === "quick" ? "Быстрая тренировка" : "Полная тренировка",
        },
      ]
    : [];
}

// ── «Повторение» ─────────────────────────────────────────────────────────────

/** Сколько слов из «Повторения» в одной тренировке. */
export const REPEAT_LESSON_SIZE = 5;

/**
 * Тренировка по «Повторению»: до REPEAT_LESSON_SIZE слов, сначала те, что дольше всего
 * не писались. Быстрый формат; слово, написанное с подсказками, в конце идёт
 * на полный цикл (работа над ошибками).
 */
export function createRepeatPlan(): LessonItem[] {
  const state = useWordProgressStore.getState();
  const lastWritten = (word: Word) =>
    state.flashcardWords[word.vocabularyId]?.lastAnsweredAt ?? 0;

  return findPracticeWords(Object.keys(state.writingReview))
    .sort((a, b) => lastWritten(a) - lastWritten(b))
    .slice(0, REPEAT_LESSON_SIZE)
    .map((word) => ({
      word,
      format: "quick" as const,
      roleLabel: "Повторение",
      retryDeep: true,
    }));
}

// ── Свои наборы ──────────────────────────────────────────────────────────────

/** Сколько слов набора в одной тренировке письма. */
export const SET_LESSON_SIZE = 5;

/** Слова набора, которые можно писать (до 2 иероглифов, с данными о чертах). */
export function getSetWritableWords(setId: string): Word[] {
  const set = useCustomSetsStore
    .getState()
    .sets.find((item) => item.id === setId);
  return set ? findPracticeWords(set.wordIds) : [];
}

/**
 * Тренировка письма по своему набору: как «Повторение» — до SET_LESSON_SIZE слов,
 * сначала те, что дольше всего не писались; быстрый формат, слово с подсказками
 * в конце идёт на полный цикл.
 */
export function createSetPlan(setId: string): LessonItem[] {
  const state = useWordProgressStore.getState();
  const lastWritten = (word: Word) =>
    state.flashcardWords[word.vocabularyId]?.lastAnsweredAt ?? 0;

  return getSetWritableWords(setId)
    .sort((a, b) => lastWritten(a) - lastWritten(b))
    .slice(0, SET_LESSON_SIZE)
    .map((word) => ({
      word,
      format: "quick" as const,
      roleLabel: "Набор",
      retryDeep: true,
    }));
}

// ── Работа над ошибками ──────────────────────────────────────────────────────

/** Сколько слов с ошибками получают работу над ошибками (чтобы урок не затягивался). */
export const DEEP_TRAINING_LIMIT = 2;

interface OutcomeLike {
  word: Word;
  success: boolean;
  retryDeep?: boolean;
}

/** Слова, которые после быстрой проверки идут на работу над ошибками (полный цикл). */
export function composeDeepItems(
  outcomes: OutcomeLike[],
  limit: number = DEEP_TRAINING_LIMIT,
): LessonItem[] {
  return outcomes
    .filter((outcome) => !outcome.success && outcome.retryDeep)
    .slice(0, limit)
    .map((outcome) => ({
      word: outcome.word,
      format: "full" as const,
      roleLabel: "Работа над ошибками",
      isDeep: true,
    }));
}

// ── Классическая тренировка по разделу (маршрут /games/writing/classic) ─────

export interface WordGroups {
  /** Ещё не начатые (0 точек по написанию). */
  fresh: Word[];
  /** В процессе (1–2 точки). */
  learning: Word[];
  /** Освоенные (3 точки). */
  learned: Word[];
}

/** Делит слова на новые / в процессе / освоенные по написанию. */
export function groupByWritingLevel(
  words: Word[],
  progress?: ProgressMap,
): WordGroups {
  const groups: WordGroups = { fresh: [], learning: [], learned: [] };

  for (const word of words) {
    const level = getWordWritingDots(word, progress);

    if (level === 0) groups.fresh.push(word);
    else if (level === 3) groups.learned.push(word);
    else groups.learning.push(word);
  }

  return groups;
}

/** Среди скольких самых простых новых слов по умолчанию выбирается слово для изучения. */
const EASIEST_POOL = 3;

/**
 * Классическая тренировка: 1 слово для изучения (полный формат) и 2 повторения
 * (быстрый формат): одно «в процессе» и одно освоенное. Если нужных слов нет,
 * повторение заменяется новым словом.
 *
 * Слово для изучения выбирается случайно среди easiestPool новых слов с наименьшей
 * difficulty. Для ступеней difficulty — место в порядке изучения, а easiestPool = 1:
 * слова идут строго по порядку.
 */
export function composeClassicPlan(
  groups: WordGroups,
  random: (words: Word[]) => Word[] = shuffle,
  difficulty: (word: Word) => number = () => 0,
  easiestPool: number = EASIEST_POOL,
): LessonItem[] {
  const fresh = random(groups.fresh);
  const learning = random(groups.learning);
  const learned = random(groups.learned);

  const easiestFresh = random(
    [...fresh]
      .sort((a, b) => difficulty(a) - difficulty(b))
      .slice(0, easiestPool),
  );

  const usedHanzi = new Set<string>();

  const take = (...pools: Word[][]): Word | undefined => {
    for (const pool of pools) {
      const word = pool.find((w) => !usedHanzi.has(w.hanzi));
      if (word) {
        usedHanzi.add(word.hanzi);
        return word;
      }
    }
    return undefined;
  };

  const plan: LessonItem[] = [];

  // Слово для изучения: новое, а если новых нет — то, что в процессе, затем освоенное
  const main = take(easiestFresh, learning, learned);
  if (main) {
    const isNew = fresh.includes(main);
    plan.push({
      word: main,
      format: "full",
      roleLabel: isNew ? "Новое слово" : "Учим дальше",
    });
  }

  // Если слов для повторения нет, вместо них идут самые простые новые слова.
  // Они проходятся в лёгком формате (показ → контур → сам), а не «сразу по контуру»
  const easiestFirst = [...fresh].sort((a, b) => difficulty(a) - difficulty(b));

  const review = (pool: Word[]) => {
    const word = take(pool);
    if (word) {
      plan.push({ word, format: "quick", roleLabel: "Повторение" });
      return;
    }

    const filler = take(easiestFirst);
    if (filler) {
      plan.push({ word: filler, format: "light", roleLabel: "Новое слово" });
    }
  };

  review(learning);
  review(learned);

  return plan;
}

/**
 * Классическая тренировка в разделе: новые слова — по порядку из открытых ступеней
 * (сначала недоученные из пройденных, затем из текущей), повторения — из открытых ступеней.
 */
export function createClassicPlan(level: WritingLevel): LessonItem[] {
  const { currentIndex } = getLevelStepsProgress(level);
  const opened = getLevelSteps(level)
    .slice(0, currentIndex + 1)
    .flat();

  const order = new Map(
    getLevelSequence(level).map((word, index) => [word.vocabularyId, index]),
  );

  return composeClassicPlan(
    groupByWritingLevel(opened),
    shuffle,
    (word) => order.get(word.vocabularyId) ?? Number.MAX_SAFE_INTEGER,
    1,
  );
}

// ── Тренировка по одной ступени (маршрут /games/writing/step) ───────────────

/**
 * Тренировка по ступени: как классическая, но только из слов этой ступени.
 * 1 слово для изучения (полный формат, строго по порядку) и 2 повторения
 * (быстрый формат); если повторять нечего — новые слова в лёгком формате.
 */
export function createStepPlan(
  level: WritingLevel,
  index: number,
): LessonItem[] {
  const words = getLevelSteps(level)[index] ?? [];
  const order = new Map(words.map((word, i) => [word.vocabularyId, i]));

  return composeClassicPlan(
    groupByWritingLevel(words),
    shuffle,
    (word) => order.get(word.vocabularyId) ?? Number.MAX_SAFE_INTEGER,
    1,
  );
}
