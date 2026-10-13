// src/utils/writing/search.ts
//
// Поиск слова на экране «Написание»: по базе письма.
// Сам поиск — общий, в utils/searchWords.ts.

import type { Word } from "@/content/flashcards/types";
import { searchWords } from "@/utils/searchWords";
import { getWritingPool } from "./words";

export function searchWritingWords(
  query: string,
  translate: (key: string) => string,
): Word[] {
  return searchWords(getWritingPool(), query, translate);
}
