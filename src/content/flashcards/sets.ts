// src/content/flashcards/sets.ts
//
// Наборы для тренировок. Слова живут в общей базе (src/content/words),
// а набор хранит только список id. Здесь они собираются в привычный вид PracticeSet.

import { setDefinitions } from "../sets/definitions";
import { getWordEntry } from "../words";
import type { WordEntry } from "../words/types";
import type { PracticeSet, Word } from "./types";

/** Слово из базы в формате, которого ждут тренировки: id и vocabularyId совпадают. */
export function toWord(entry: WordEntry): Word {
  return {
    id: entry.id,
    vocabularyId: entry.id,
    hanzi: entry.hanzi,
    pinyin: entry.pinyin,
    translation: entry.translation,
    ...(entry.colloquial && { colloquial: entry.colloquial }),
  };
}

export const practiceSets: PracticeSet[] = setDefinitions.map(
  ({ wordIds, ...rest }) => ({
    ...rest,
    words: wordIds.map((id) => toWord(getWordEntry(id))),
  }),
);
