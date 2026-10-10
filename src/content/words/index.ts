// src/content/words/index.ts
//
// Общая база слов. Новое слово добавляется в один из файлов data/ (или в новый файл,
// который нужно подключить здесь). Наборы ссылаются на слова по id.
import { wordAliases } from "./aliases";
import { animalsWords } from "./data/animals";
import { bodyWords } from "./data/body";
import { charactersWords } from "./data/characters";
import { clothingWords } from "./data/clothing";
import { colorsWords } from "./data/colors";
import { directionsWords } from "./data/directions";
import { familyWords } from "./data/family";
import { foodWords } from "./data/food";
import { greetingsWords } from "./data/greetings";
import { hobbiesWords } from "./data/hobbies";
import { houseWords } from "./data/house";
import { numbersWords } from "./data/numbers";
import { placesWords } from "./data/places";
import { professionsWords } from "./data/professions";
import { timeWords } from "./data/time";
import { transportationWords } from "./data/transportation";
import { weatherWords } from "./data/weather";
import type { WordEntry } from "./types";

export const allWords: WordEntry[] = [
  ...greetingsWords,
  ...numbersWords,
  ...familyWords,
  ...animalsWords,
  ...foodWords,
  ...clothingWords,
  ...weatherWords,
  ...colorsWords,
  ...transportationWords,
  ...houseWords,
  ...bodyWords,
  ...hobbiesWords,
  ...timeWords,
  ...professionsWords,
  ...placesWords,
  ...directionsWords,
  ...charactersWords,
];

export const wordsById: Record<string, WordEntry> = {};

for (const word of allWords) {
  if (wordsById[word.id]) {
    throw new Error(`Повторяющийся id слова в базе: ${word.id}`);
  }
  wordsById[word.id] = word;
}

export function getWordEntry(id: string): WordEntry {
  // Старые id склеенных дубликатов ведут на оставшееся слово
  const word = wordsById[wordAliases[id] ?? id];
  if (!word) {
    throw new Error(`В базе слов нет слова с id: ${id}`);
  }
  return word;
}

/** Количество слогов (в китайском один слог — один иероглиф). */
export function getSyllableCount(word: WordEntry): number {
  return Array.from(word.hanzi).length;
}
