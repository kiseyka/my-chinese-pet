// src/content/words/index.ts
//
// База слов. Все слова лежат в одном файле: ./data/words.ts.

import { words } from "./data/words";
import type { WordEntry } from "./types";

export const allWords: WordEntry[] = words;

const byId = new Map(words.map((word) => [word.id, word]));

/** Слово по id или undefined, если такого нет. */
export function findWordEntry(id: string): WordEntry | undefined {
  return byId.get(id);
}

/** Слово по id. Если такого нет — ошибка (для мест, где слово обязано быть). */
export function getWordEntry(id: string): WordEntry {
  const entry = byId.get(id);
  if (!entry) throw new Error(`Слово не найдено: ${id}`);
  return entry;
}
