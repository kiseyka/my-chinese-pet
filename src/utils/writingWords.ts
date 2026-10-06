// src/utils/writingWords.ts

import type { Word } from "@/content/flashcards/types";
import { getHanzi } from "@/content/writing/hanzi";

/** Слова из одного иероглифа, для которых есть данные о чертах. */
export function getWritableWords(words: Word[]): Word[] {
  return words.filter(
    (word) => Array.from(word.hanzi).length === 1 && getHanzi(word.hanzi),
  );
}
