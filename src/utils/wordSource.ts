// src/utils/wordSource.ts
//
// Списки слов для тренировок из «Словаря» и пути — одинаковые для карточек и письма.
// id источника:
//   «path:1:0»  — этап пути (тема);
//   «favorites» — избранное;
//   «dict:other» — «Другие слова» (без уровня HSK).
// Карточки берут слова отсюда же (utils/flashcards/source.ts), письмо —
// маршрут /games/writing/path?source=… (там остаются только слова, которые можно писать).

import type { Word } from "@/content/flashcards/types";
import { allWords } from "@/content/words/vocabulary";
import { useWordProgressStore } from "@/store/wordProgressStore";
import { findPathTraining, PATH_TRAINING_PREFIX } from "@/utils/path/stages";
import { getWordHskLevel, NO_HSK_LEVEL } from "@/utils/writing/words";

export const FAVORITES_SOURCE = "favorites";
export const OTHER_WORDS_SOURCE = "dict:other";

export interface WordSource {
  title: string;
  words: Word[];
}

/** Слова и название источника по id. null — такого источника нет. */
export function resolveWordSource(id: string): WordSource | null {
  if (id.startsWith(PATH_TRAINING_PREFIX)) return findPathTraining(id);

  if (id === FAVORITES_SOURCE) {
    const favorites = useWordProgressStore.getState().vocabularyWords;
    return {
      title: "Избранное",
      words: allWords.filter((word) => favorites[word.vocabularyId]?.isFavorite),
    };
  }

  if (id === OTHER_WORDS_SOURCE) {
    return {
      title: "Другие слова",
      words: allWords.filter((word) => getWordHskLevel(word) === NO_HSK_LEVEL),
    };
  }

  return null;
}
