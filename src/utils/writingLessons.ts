// src/utils/writingLessons.ts
//
// Составление уроков письма: какие слова и в каком формате пройдут в тренировке.

import { practiceSets } from "@/content/flashcards/sets";
import type { Word } from "@/content/flashcards/types";
import { getWordLevel, useWordProgressStore } from "@/store/wordProgressStore";
import type { LessonFormat } from "./writingStages";
import { getWritableWords } from "./writingWords";

export interface LessonItem {
  word: Word;
  format: LessonFormat;
  /** Подпись над заданием: «Новое слово», «Повторение» и т.д. */
  roleLabel: string;
  /** Если слово написано только с подсказками, в конце урока оно получает работу над ошибками. */
  retryDeep?: boolean;
  /** Это задание — работа над ошибками (не входит в счёт урока). */
  isDeep?: boolean;
}

export interface WordGroups {
  /** Ещё не начатые (0 точек по написанию). */
  fresh: Word[];
  /** В процессе (1–2 точки). */
  learning: Word[];
  /** Освоенные (3 точки). */
  learned: Word[];
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Все слова простого уровня (один слог) из всех наборов, без повторов. */
export function getSimpleWords(): Word[] {
  const seen = new Set<string>();
  const result: Word[] = [];

  for (const practiceSet of practiceSets) {
    for (const word of getWritableWords(practiceSet.words)) {
      if (!seen.has(word.vocabularyId)) {
        seen.add(word.vocabularyId);
        result.push(word);
      }
    }
  }

  return result;
}

type ProgressMap = Record<
  string,
  NonNullable<Parameters<typeof getWordLevel>[0]>
>;

/**
 * Делит слова на новые / в процессе / освоенные по написанию.
 * Прогресс можно передать явно: так экран, подписанный на стор, пересчитывается при его изменении.
 */
export function groupByWritingLevel(
  words: Word[],
  progress?: ProgressMap,
): WordGroups {
  const map = progress ?? useWordProgressStore.getState().flashcardWords;
  const groups: WordGroups = { fresh: [], learning: [], learned: [] };

  for (const word of words) {
    // Для письма отметка «слово известно» не учитывается
    const level = getWordLevel(map[word.vocabularyId], false, ["writing"]);

    if (level === 0) groups.fresh.push(word);
    else if (level === 3) groups.learned.push(word);
    else groups.learning.push(word);
  }

  return groups;
}

/**
 * Классическая тренировка: 1 слово для изучения (полный формат) и 2 повторения
 * (быстрый формат): одно «в процессе» и одно освоенное.
 * Если нужных слов нет, повторение заменяется новым словом.
 */
export function composeClassicPlan(
  groups: WordGroups,
  random: (words: Word[]) => Word[] = shuffle,
): LessonItem[] {
  const fresh = random(groups.fresh);
  const learning = random(groups.learning);
  const learned = random(groups.learned);

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
  const main = take(fresh, learning, learned);
  if (main) {
    const isNew = fresh.includes(main);
    plan.push({
      word: main,
      format: "full",
      roleLabel: isNew ? "Новое слово" : "Учим дальше",
    });
  }

  const review = (pool: Word[]) => {
    const word = take(pool);
    if (word) {
      plan.push({ word, format: "quick", roleLabel: "Повторение" });
      return;
    }

    const filler = take(fresh);
    if (filler) {
      plan.push({ word: filler, format: "quick", roleLabel: "Новое слово" });
    }
  };

  review(learning);
  review(learned);

  return plan;
}

export function createClassicPlan(): LessonItem[] {
  return composeClassicPlan(groupByWritingLevel(getSimpleWords()));
}

/** Свободная тренировка: одно выбранное слово, полный цикл. */
export function createFreePlan(vocabularyId: string): LessonItem[] {
  const word = getSimpleWords().find((w) => w.vocabularyId === vocabularyId);

  return word
    ? [{ word, format: "full", roleLabel: "Свободная тренировка" }]
    : [];
}

/** Сколько слов в «Повторить тему». */
export const REVIEW_WORD_COUNT = 4;

/** Сколько слов с ошибками получают работу над ошибками (чтобы урок не затягивался). */
export const DEEP_TRAINING_LIMIT = 2;

/** Освоенные слова набора, из которых можно собрать повторение. */
export function getLearnedWords(words: Word[], progress?: ProgressMap): Word[] {
  return groupByWritingLevel(getWritableWords(words), progress).learned;
}

/** Повторить тему: 4 освоенных слова набора, быстрый формат. Меньше четырёх — урока нет. */
export function composeReviewPlan(
  learned: Word[],
  random: (words: Word[]) => Word[] = shuffle,
): LessonItem[] {
  if (learned.length < REVIEW_WORD_COUNT) return [];

  return random(learned)
    .slice(0, REVIEW_WORD_COUNT)
    .map((word) => ({
      word,
      format: "quick" as const,
      roleLabel: "Повторение",
      retryDeep: true,
    }));
}

export function createReviewPlan(setId: string): LessonItem[] {
  const practiceSet = practiceSets.find((set) => set.id === setId);
  if (!practiceSet) return [];

  return composeReviewPlan(getLearnedWords(practiceSet.words));
}

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
