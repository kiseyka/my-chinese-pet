// src/utils/panda/chatSegments.ts
//
// Реплика панды по словам: «我没吃过冰淇淋。» → 我 · 没 · 吃过 · 冰淇淋 · 。
// Слова разделяет модель (сервер присылает words). Если их нет (старые сообщения,
// модель не разделила) — ищем слова базы приложения: самое длинное совпадение, до 4 иероглифов.
// У слов из базы есть перевод из словаря — бесплатно, без запросов к модели.
// Пиньинь — из ответа сервера (по символу, с изменениями тонов), а у старых сообщений
// без него — из базы слов.

import type { Word } from "@/content/flashcards/types";
import { allWords } from "@/content/words/vocabulary";

const MAX_WORD_CHARS = 4;
const HAN = /\p{Script=Han}/u;

export interface ChatSegment {
  text: string;
  /** Пиньинь слова (пустой у знаков препинания и латиницы). */
  pinyin: string;
  /** Есть ли иероглифы — такие куски можно тапнуть. */
  isHan: boolean;
  /** Слово из базы, если нашлось. */
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

export function segmentReply(
  text: string,
  syllables?: string[],
  words?: string[],
): ChatSegment[] {
  const chars = Array.from(text);
  const aligned = syllables?.length === chars.length ? syllables : undefined;
  const dict = dictionary();

  // Слова от модели — если их склейка совпадает с текстом
  if (words?.length && words.join("") === text) {
    let offset = 0;
    return words.map((piece) => {
      const length = Array.from(piece).length;
      const isHan = HAN.test(piece);
      const word = isHan ? dict.get(piece) : undefined;
      const pinyin = !isHan
        ? ""
        : aligned
          ? aligned.slice(offset, offset + length).join("")
          : (word?.pinyin ?? "");
      offset += length;
      return { text: piece, pinyin, isHan, word };
    });
  }

  const segments: ChatSegment[] = [];

  let i = 0;
  while (i < chars.length) {
    // Не иероглифы (знаки, латиница) — склеиваем подряд идущие
    if (!HAN.test(chars[i])) {
      let j = i;
      while (j < chars.length && !HAN.test(chars[j])) j++;
      segments.push({ text: chars.slice(i, j).join(""), pinyin: "", isHan: false });
      i = j;
      continue;
    }

    // Самое длинное слово из базы, начиная с этого иероглифа
    let length = 1;
    let word: Word | undefined;
    for (let n = Math.min(MAX_WORD_CHARS, chars.length - i); n >= 1; n--) {
      const piece = chars.slice(i, i + n);
      if (piece.some((ch) => !HAN.test(ch))) continue;
      const found = dict.get(piece.join(""));
      if (found) {
        length = n;
        word = found;
        break;
      }
    }

    const piece = chars.slice(i, i + length).join("");
    const pinyin = aligned
      ? aligned.slice(i, i + length).join("")
      : (word?.pinyin ?? "");
    segments.push({ text: piece, pinyin, isHan: true, word });
    i += length;
  }

  return segments;
}
