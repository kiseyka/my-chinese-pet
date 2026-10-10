// src/utils/writingWords.ts

import type { Word } from "@/content/flashcards/types";
import { getHanzi } from "@/content/writing/hanzi";

/** Самое длинное слово (в слогах), которое можно тренировать в письме. */
export const MAX_WRITING_SYLLABLES = 2;

/** Количество слогов в слове (в китайском один слог — один иероглиф). */
export function getSyllables(word: Word): number {
  return Array.from(word.hanzi).length;
}

/**
 * Слова, у каждого иероглифа которых есть данные о чертах.
 * Без второго аргумента — слова от 1 до MAX_WRITING_SYLLABLES слогов,
 * с ним — слова ровно с таким числом слогов.
 */
export function getWritableWords(words: Word[], syllables?: number): Word[] {
  return words.filter((word) => {
    const characters = Array.from(word.hanzi);

    const lengthFits =
      syllables === undefined
        ? characters.length >= 1 && characters.length <= MAX_WRITING_SYLLABLES
        : characters.length === syllables;

    return lengthFits && characters.every((character) => getHanzi(character));
  });
}

/** Сколько всего черт в слове: чем больше, тем оно сложнее для письма. */
export function getWordStrokeCount(word: Word): number {
  return Array.from(word.hanzi).reduce(
    (sum, character) => sum + (getHanzi(character)?.strokes.length ?? 0),
    0,
  );
}
