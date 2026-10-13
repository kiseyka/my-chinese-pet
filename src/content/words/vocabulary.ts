// src/content/words/vocabulary.ts
//
// Все слова базы в формате Word (с vocabularyId), как их ждут словарь и тренировки.

import type { Word } from "@/content/flashcards/types";
import { allWords as entries } from "./index";
import type { WordEntry } from "./types";

/**
 * Слово из базы в формате, которого ждут тренировки: id и vocabularyId совпадают.
 * Перевод — ключ i18n "words:<id>": i18next возьмёт ru или en из words.ts
 * (см. src/i18n/index.ts).
 */
export function toWord(entry: WordEntry): Word {
  return {
    id: entry.id,
    vocabularyId: entry.id,
    hanzi: entry.hanzi,
    pinyin: entry.pinyin,
    translation: `words:${entry.id}`,
    ...(entry.colloquial && { colloquial: entry.colloquial }),
  };
}

export const allWords: Word[] = entries.map(toWord);

const byId = new Map(allWords.map((word) => [word.id, word]));

/** Слово по id или undefined, если такого нет (например, слово убрали из базы). */
export function findWord(id: string): Word | undefined {
  return byId.get(id);
}

/** Слова по списку id: в том же порядке, без тех, которых нет в базе. */
export function findWords(ids: string[]): Word[] {
  return ids
    .map((id) => byId.get(id))
    .filter((word): word is Word => !!word);
}
