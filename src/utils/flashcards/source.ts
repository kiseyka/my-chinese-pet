// src/utils/flashcards/source.ts
//
// Откуда тренировка карточками берёт слова: свой набор (id «set-…»)
// или ступень раздела HSK (id «step:1:3»).

import type { Word } from "@/content/flashcards/types";
import { findWords } from "@/content/words/vocabulary";
import type { CustomSet } from "@/store/customSetsStore";
import { findStepTraining } from "./steps";

export interface FlashcardSource {
  title: string;
  words: Word[];
}

export function resolveFlashcardSource(
  id: string,
  customSets: CustomSet[],
): FlashcardSource | null {
  const step = findStepTraining(id);
  if (step) return step;

  const set = customSets.find((item) => item.id === id);
  if (!set) return null;

  return { title: set.title, words: findWords(set.wordIds) };
}
