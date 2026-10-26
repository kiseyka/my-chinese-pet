// src/utils/wordSource.ts
//
// Списки слов для тренировок из «Словаря» и пути — одинаковые для карточек и письма.
// id источника:
//   «path:1:0»  — этап пути (тема);
//   «dict:other» — «Другие слова» (без уровня HSK);
//   «review»    — «Повторение» (вместе с иероглифами вида «char:么»);
//   «learned»   — «Изученное»;
//   «set-…»     — свой набор.
// Карточки берут слова отсюда же (utils/flashcards/source.ts), письмо —
// маршрут /games/writing/path?source=… (там остаются только слова, которые можно писать).

import type { Word } from "@/content/flashcards/types";
import { allWords } from "@/content/words/vocabulary";
import { findWords } from "@/content/words/vocabulary";
import { useCustomSetsStore } from "@/store/customSetsStore";
import { useWordProgressStore } from "@/store/wordProgressStore";
import { findPathTraining, PATH_TRAINING_PREFIX } from "@/utils/path/stages";
import {
  findPracticeWords,
  getWordHskLevel,
  NO_HSK_LEVEL,
} from "@/utils/writing/words";

export const OTHER_WORDS_SOURCE = "dict:other";
export const REVIEW_SOURCE = "review";
export const LEARNED_SOURCE = "learned";

/**
 * Слова по id из любого списка («Повторение», очередь): слова базы любой длины
 * и иероглифы вида «char:么». Не findPracticeWords: тот знает только слова,
 * которые можно писать (до 2 иероглифов), и молча терял бы 为什么 или 很高兴认识你.
 */
export function findAnyWords(ids: string[]): Word[] {
  return ids.flatMap((id) => {
    if (id.startsWith("char:")) return findPracticeWords([id]);
    return findWords([id]);
  });
}

/** id «Повторения» в порядке добавления. */
export function getReviewIds(
  review = useWordProgressStore.getState().review,
): string[] {
  return Object.entries(review)
    .sort(([, a], [, b]) => a.addedAt - b.addedAt)
    .map(([id]) => id);
}

/** id «Изученного» в порядке добавления. */
export function getLearnedIds(
  learned = useWordProgressStore.getState().learned,
): string[] {
  return Object.entries(learned)
    .sort(([, a], [, b]) => a.addedAt - b.addedAt)
    .map(([id]) => id);
}

export interface WordSource {
  title: string;
  words: Word[];
}

/** Слова и название источника по id. null — такого источника нет. */
export function resolveWordSource(id: string): WordSource | null {
  if (id.startsWith(PATH_TRAINING_PREFIX)) return findPathTraining(id);

  if (id === OTHER_WORDS_SOURCE) {
    return {
      title: "Другие слова",
      words: allWords.filter((word) => getWordHskLevel(word) === NO_HSK_LEVEL),
    };
  }

  if (id === REVIEW_SOURCE) {
    return { title: "Повторение", words: findAnyWords(getReviewIds()) };
  }

  if (id === LEARNED_SOURCE) {
    return { title: "Изученное", words: findAnyWords(getLearnedIds()) };
  }

  const set = useCustomSetsStore.getState().sets.find((item) => item.id === id);
  if (set) return { title: set.title, words: findWords(set.wordIds) };

  return null;
}
