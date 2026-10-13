// src/utils/searchWords.ts
//
// Поиск слова по иероглифу, пиньиню без тонов и переводу.
// Используется на экране «Написание» и при сборке своих наборов.

import type { Word } from "@/content/flashcards/types";

/**
 * Пиньинь без тонов, пробелов и апострофов, в нижнем регистре: «nǐ hǎo» → «nihao».
 * ü и привычная замена «v» (lv = lü) приводятся к «u».
 */
export function normalizePinyin(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[üv]/g, "u")
    .replace(/[\s'’·-]/g, "")
    .toLowerCase();
}

/** Сколько результатов поиска показывать. */
export const SEARCH_LIMIT = 40;

/**
 * Поиск по списку слов: по иероглифам, по пиньиню без тонов («nihao») и по переводу.
 * translate — функция перевода (t из i18next): перевод у слов — ключ.
 * Сначала точные совпадения, затем пиньинь с начала, затем остальное.
 */
export function searchWords(
  pool: Word[],
  query: string,
  translate: (key: string) => string,
  limit = SEARCH_LIMIT,
): Word[] {
  const raw = query.trim();
  if (!raw) return [];

  const lower = raw.toLowerCase();
  const pinyinQuery = normalizePinyin(raw);
  const hasHan = /\p{Script=Han}/u.test(raw);

  const scored: { word: Word; score: number; index: number }[] = [];

  pool.forEach((word, index) => {
    let score = -1;

    if (hasHan) {
      if (word.hanzi === raw) score = 0;
      else if (word.hanzi.includes(raw)) score = 1;
    } else {
      const pinyin = normalizePinyin(word.pinyin);

      if (pinyinQuery && pinyin === pinyinQuery) score = 0;
      else if (pinyinQuery && pinyin.startsWith(pinyinQuery)) score = 1;
      else if (translate(word.translation).toLowerCase().includes(lower)) {
        score = 2;
      }
    }

    if (score >= 0) scored.push({ word, score, index });
  });

  return scored
    .sort((a, b) => a.score - b.score || a.index - b.index)
    .slice(0, limit)
    .map((item) => item.word);
}
