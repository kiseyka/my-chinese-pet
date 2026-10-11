// src/content/flashcards/sets.ts
//
// Наборы для тренировок. Слова живут в общей базе (src/content/words/data/words.ts),
// а набор хранит только список id. Здесь они собираются в привычный вид PracticeSet.

import { setDefinitions } from "../sets/definitions";
import { findWordEntry } from "../words";
import type { WordEntry } from "../words/types";
import type { PracticeSet, Word } from "./types";

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

export const practiceSets: PracticeSet[] = setDefinitions.map(
  ({ wordIds, ...rest }) => ({
    ...rest,
    words: wordIds
      .map((id) => {
        const entry = findWordEntry(id);
        if (!entry && __DEV__) {
          console.warn(`Набор «${rest.id}»: нет слова с id ${id}`);
        }
        return entry;
      })
      .filter((entry): entry is WordEntry => !!entry)
      .map(toWord),
  }),
);
