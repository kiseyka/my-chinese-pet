// src/utils/panda/phraseSegments.ts
//
// Фраза панды по словам с пиньинем и словом из словаря:
// ["我", "的", "花", "。"] → 我 wǒ · 的 de · 花 huā · 。
// Пиньинь — из фразы (если задан), иначе из словаря, иначе по иероглифам из словаря.

import type { Word } from "@/content/flashcards/types";
import type { PandaPhrase } from "@/content/panda/thoughtPhrases";
import { allWords } from "@/content/words/vocabulary";

const HAN = /\p{Script=Han}/u;

export interface PhraseSegment {
  text: string;
  /** Пиньинь слова (пустой у знаков препинания). */
  pinyin: string;
  /** Есть иероглифы — такой кусок можно тапнуть. */
  isHan: boolean;
  /** Слово из словаря, если нашлось. */
  word?: Word;
}

let byHanzi: Map<string, Word> | null = null;

function dictionary(): Map<string, Word> {
  if (byHanzi) return byHanzi;
  byHanzi = new Map();
  for (const word of allWords) {
    if (!byHanzi.has(word.hanzi)) byHanzi.set(word.hanzi, word);
  }
  return byHanzi;
}

export function findWordByHanzi(hanzi: string): Word | undefined {
  return dictionary().get(hanzi);
}

export function isHanText(text: string): boolean {
  return HAN.test(text);
}

export function segmentPhrase(phrase: PandaPhrase): PhraseSegment[] {
  return phrase.words.map((text) => {
    if (!HAN.test(text)) return { text, pinyin: "", isHan: false };

    const word = findWordByHanzi(text);
    const pinyin =
      phrase.pinyin?.[text] ??
      word?.pinyin ??
      Array.from(text)
        .map((char) => findWordByHanzi(char)?.pinyin ?? "")
        .join(" ")
        .trim();

    return { text, pinyin, isHan: true, word };
  });
}

/** Слова фразы из словаря (без знаков); undefined — какого-то слова в словаре нет. */
export function getPhraseWords(phrase: PandaPhrase): Word[] | undefined {
  const words: Word[] = [];
  for (const text of phrase.words) {
    if (!HAN.test(text)) continue;
    const word = findWordByHanzi(text);
    if (!word) return undefined;
    words.push(word);
  }
  return words;
}

export function phraseText(phrase: PandaPhrase): string {
  return phrase.words.join("");
}

const MAX_WORD_CHARS = 4;

/**
 * Иероглифы внутри обычного текста (перевод, пояснение) по словам словаря:
 * «Отвечают 吃了 или 还没» → «Отвечают », 吃, 了, « или », 还, 没.
 * Самое длинное совпадение со словарём, до 4 иероглифов; нет в словаре — по одному.
 */
export function segmentMixedText(text: string): PhraseSegment[] {
  const chars = Array.from(text);
  const segments: PhraseSegment[] = [];

  let i = 0;
  while (i < chars.length) {
    if (!HAN.test(chars[i])) {
      let j = i;
      while (j < chars.length && !HAN.test(chars[j])) j++;
      segments.push({ text: chars.slice(i, j).join(""), pinyin: "", isHan: false });
      i = j;
      continue;
    }

    let length = 1;
    let word: Word | undefined;
    for (let n = Math.min(MAX_WORD_CHARS, chars.length - i); n >= 1; n--) {
      const piece = chars.slice(i, i + n);
      if (piece.some((ch) => !HAN.test(ch))) continue;
      const found = findWordByHanzi(piece.join(""));
      if (found) {
        length = n;
        word = found;
        break;
      }
    }

    const piece = chars.slice(i, i + length).join("");
    segments.push({ text: piece, pinyin: word?.pinyin ?? "", isHan: true, word });
    i += length;
  }

  return segments;
}
