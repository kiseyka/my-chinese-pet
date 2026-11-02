// src/utils/wordThemes.ts
//
// Слова одной темы пути (src/content/path/themes.ts): «Числа», «Семья», «Еда»…
// Нужны тренировке перевода: неверные варианты из той же темы похожи по смыслу,
// и ответ не угадать методом исключения (у «пять» соседи «шесть», «восемь», а не
// «мама» и «красный»).

import type { Word } from "@/content/flashcards/types";
import { pathThemes } from "@/content/path/themes";
import { allWords } from "@/content/words/vocabulary";
import { getWordHskLevel } from "@/utils/writing/words";

let themeOfWord: Map<string, string> | null = null;
let wordsOfTheme: Map<string, Word[]> | null = null;

function build() {
  themeOfWord = new Map();
  wordsOfTheme = new Map();

  // Тема знает свои слова по иероглифам и уровню (один иероглиф бывает на разных уровнях)
  const byKey = new Map<string, Word>();
  for (const word of allWords) {
    const key = `${getWordHskLevel(word)}:${word.hanzi}`;
    if (!byKey.has(key)) byKey.set(key, word);
  }

  for (const theme of pathThemes) {
    const words: Word[] = [];
    for (const hanzi of theme.words.split(/\s+/)) {
      const word = byKey.get(`${theme.level}:${hanzi}`);
      if (!word || themeOfWord.has(word.vocabularyId)) continue;
      themeOfWord.set(word.vocabularyId, theme.id);
      words.push(word);
    }
    wordsOfTheme.set(theme.id, words);
  }
}

/** Другие слова темы, в которой лежит слово. Пусто — у слова нет темы. */
export function getThemeMates(word: Word): Word[] {
  if (!themeOfWord || !wordsOfTheme) build();
  const themeId = themeOfWord!.get(word.vocabularyId);
  if (!themeId) return [];
  return (wordsOfTheme!.get(themeId) ?? []).filter(
    (other) => other.vocabularyId !== word.vocabularyId,
  );
}
