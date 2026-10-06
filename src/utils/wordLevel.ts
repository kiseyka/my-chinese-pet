// src/utils/wordLevel.ts

import {
  getWordLevel,
  useWordProgressStore,
  type WordLevel,
} from "@/store/wordProgressStore";

/**
 * Текущий уровень слова (0–3) по выбранному навыку, прямо из стора.
 * Для написания отметка «слово известно» из словаря не учитывается:
 * знать слово и уметь его писать — разные вещи.
 */
export function readWordLevel(
  wordId: string,
  skill: "reading" | "writing" = "reading",
): WordLevel {
  const { flashcardWords, vocabularyWords } = useWordProgressStore.getState();
  const isKnown =
    skill === "writing" ? false : (vocabularyWords[wordId]?.isKnown ?? false);

  return getWordLevel(flashcardWords[wordId], isKnown, [skill]);
}
