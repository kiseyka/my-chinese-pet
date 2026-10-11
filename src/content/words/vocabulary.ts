// src/content/words/vocabulary.ts
//
// Все слова базы в формате Word (с vocabularyId), как их ждут словарь и тренировки.

import { toWord } from "@/content/flashcards/sets";
import type { Word } from "@/content/flashcards/types";
import { allWords as entries } from "./index";

export const allWords: Word[] = entries.map(toWord);
