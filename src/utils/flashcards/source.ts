// src/utils/flashcards/source.ts
//
// Откуда тренировка карточками берёт слова: свой набор (id «set-…»),
// ступень раздела HSK (id «step:1:3»), этап пути (id «path:1:0») или «Повторение» (id «review»).

import type { Word } from "@/content/flashcards/types";
import { findWords } from "@/content/words/vocabulary";
import type { CustomSet } from "@/store/customSetsStore";
import { useWordProgressStore } from "@/store/wordProgressStore";
import { findPathTraining } from "@/utils/path/stages";
import { findStepTraining } from "./steps";

/** id тренировки «Повторение» карточек. */
export const READING_REVIEW_ID = "review";

/** Слова «Повторения» карточек в порядке добавления. */
export function getReadingReviewWords(
  review = useWordProgressStore.getState().readingReview,
): Word[] {
  const ids = Object.entries(review)
    .sort(([, a], [, b]) => a.addedAt - b.addedAt)
    .map(([id]) => id);
  return findWords(ids);
}

export interface FlashcardSource {
  title: string;
  words: Word[];
}

export function resolveFlashcardSource(
  id: string,
  customSets: CustomSet[],
): FlashcardSource | null {
  if (id === READING_REVIEW_ID) {
    return { title: "Повторение", words: getReadingReviewWords() };
  }

  const step = findStepTraining(id);
  if (step) return step;

  const stage = findPathTraining(id);
  if (stage) return stage;

  const set = customSets.find((item) => item.id === id);
  if (!set) return null;

  return { title: set.title, words: findWords(set.wordIds) };
}
