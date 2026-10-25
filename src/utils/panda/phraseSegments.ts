// src/utils/panda/phraseSegments.ts
//
// Фраза панды по словам с пиньинем и словом из словаря:
// ["我", "的", "花", "。"] → 我 wǒ · 的 de · 花 huā · 。
// Пиньинь — из фразы (если задан), иначе из словаря, иначе по иероглифам из словаря.

import type { Word } from "@/content/flashcards/types";
import type { PandaPhrase } from "@/content/panda/thoughtPhrases";
import { PANDA_GLOSSARY } from "@/content/panda/glossary";
import { allWords } from "@/content/words/vocabulary";
import i18n from "i18next";

const HAN = /\p{Script=Han}/u;

export interface PhraseSegment {
  text: string;
  /** Пиньинь слова (пустой у знаков препинания). */
  pinyin: string;
  /** Есть иероглифы — такой кусок можно тапнуть. */
  isHan: boolean;
  /** Слово из словаря, если нашлось. */
  word?: Word;
  /** Перевод именно в этом месте (выражение из пояснения, фраза целиком) —
   *  важнее словарного. */
  gloss?: string;
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

/** Строка панды или ответа: слова и (необязательно) пиньинь вместо словарного. */
export interface PhraseLineLike {
  words: string[];
  pinyin?: Record<string, string>;
}

export function segmentPhrase(phrase: PhraseLineLike): PhraseSegment[] {
  return phrase.words.map((text) => {
    if (!HAN.test(text)) return { text, pinyin: "", isHan: false };
    // Имя панды, кактус — не из словаря: пиньинь и перевод из глоссария
    if (PANDA_GLOSSARY[text]) return glossarySegment(text);

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

function glossarySegment(text: string): PhraseSegment {
  const entry = PANDA_GLOSSARY[text];
  const ru = i18n.language?.startsWith("ru");
  return { text, pinyin: entry.pinyin, isHan: true, gloss: ru ? entry.ru : entry.en };
}

/**
 * Слова фразы из словаря (без знаков и без слов из глоссария панды — они всегда
 * знакомы);
 * undefined — какого-то слова в словаре нет.
 */
export function getPhraseWords(phrase: PandaPhrase): Word[] | undefined {
  const words: Word[] = [];
  for (const text of phrase.words) {
    if (!HAN.test(text) || PANDA_GLOSSARY[text]) continue;
    const word = findWordByHanzi(text);
    if (!word) return undefined;
    words.push(word);
  }
  return words;
}

export function phraseText(phrase: PhraseLineLike): string {
  return phrase.words.join("");
}

/** Пиньинь по иероглифам из словаря: 送钟 → «sòng zhōng» (чего нет — пропускаем). */
function pinyinByChars(text: string): string {
  return Array.from(text)
    .map((char) => findWordByHanzi(char)?.pinyin ?? "")
    .filter(Boolean)
    .join(" ");
}

/** Что известно о выражении из пояснения: пиньинь и перевод. */
export interface NoteTerm {
  pinyin?: string;
  gloss: string;
}

/**
 * Пояснение: иероглифы, стоящие подряд, — одно выражение, а не отдельные слова:
 * «送钟 звучит как 送终» → «送钟», « звучит как », «送终».
 * Перевод — из termFor (термины пояснения, сама фраза), иначе из словаря.
 */
export function segmentNoteText(
  text: string,
  termFor: (run: string) => NoteTerm | undefined,
): PhraseSegment[] {
  const segments: PhraseSegment[] = [];
  for (const part of text.match(/\p{Script=Han}+|[^\p{Script=Han}]+/gu) ?? []) {
    if (!HAN.test(part)) {
      segments.push({ text: part, pinyin: "", isHan: false });
      continue;
    }
    const term = termFor(part);
    const word = findWordByHanzi(part);
    segments.push({
      text: part,
      pinyin: term?.pinyin ?? word?.pinyin ?? pinyinByChars(part),
      isHan: true,
      word,
      gloss: term?.gloss,
    });
  }
  return segments;
}
