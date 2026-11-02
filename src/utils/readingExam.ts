// src/utils/readingExam.ts
//
// «Обратный перевод»: показываем перевод, нужно выбрать иероглиф из EXAM_OPTIONS
// вариантов. Остался от экзамена по переводу (экзамены убраны); им пользуются
// обратные вопросы в тренировке перевода (useFlashcardGame) и игры панды. Сложнее обычных карточек: нужно вспомнить
// сам знак, а не узнать знакомое слово. Поэтому неправильные варианты подбираются
// похожими:
//   - слово из одного знака — знаки с тем же ключом, общими частями и близким
//     числом черт (休 → 体, 木, 你…);
//   - слово из нескольких знаков — слова той же длины с общим иероглифом
//     (今天 → 明天, 昨天, 今年).
// Похожих не хватило — добираем словами той же длины. Слова с тем же переводом
// в варианты не попадают: иначе правильных ответов было бы два.

import type { Word } from "@/content/flashcards/types";
import { allWords } from "@/content/words/vocabulary";
import { getHanzi } from "@/content/writing/hanzi";
import { shuffle } from "@/utils/shuffle";

/** Сколько вариантов ответа (правильный + неправильные). */
export const EXAM_OPTIONS = 4;

/** Сколько слов в одном экзамене по переводу. */
export const READING_EXAM_SIZE = 10;

export interface ReadingExamQuestion {
  word: Word;
  /** Варианты в случайном порядке, среди них word. */
  options: Word[];
}

/** Части уже разобранных иероглифов: подбор похожих перебирает весь словарь. */
const partsCache = new Map<string, Set<string>>();

/** Знаки-части иероглифа: ключ и всё, что есть в разложении (без служебных ⿰⿱…). */
function partsOf(char: string): Set<string> {
  const cached = partsCache.get(char);
  if (cached) return cached;
  const data = getHanzi(char);
  const parts = new Set<string>();
  if (data?.radical) parts.add(data.radical);
  for (const symbol of Array.from(data?.decomposition ?? "")) {
    if (/\p{Script=Han}/u.test(symbol) && symbol !== char) parts.add(symbol);
  }
  for (const part of data?.parts ?? []) {
    for (const symbol of Array.from(part.label)) parts.add(symbol);
  }
  partsCache.set(char, parts);
  return parts;
}

/** Насколько слово candidate похоже на word (больше — похожее). */
function similarity(word: Word, candidate: Word): number {
  const a = Array.from(word.hanzi);
  const b = Array.from(candidate.hanzi);
  if (a.length !== b.length) return -1;

  // Слова из нескольких знаков: общие иероглифы
  if (a.length > 1) {
    return a.filter((char) => b.includes(char)).length * 3;
  }

  const [x] = a;
  const [y] = b;
  const dataX = getHanzi(x);
  const dataY = getHanzi(y);
  let score = 0;

  if (dataX?.radical && dataX.radical === dataY?.radical) score += 2;

  const partsX = partsOf(x);
  for (const part of partsOf(y)) if (partsX.has(part)) score += 1;

  const strokesX = dataX?.strokes.length ?? 0;
  const strokesY = dataY?.strokes.length ?? 0;
  if (strokesX && strokesY && Math.abs(strokesX - strokesY) <= 2) score += 1;

  return score;
}

/**
 * Вопрос экзамена для слова. translate — перевод ключа (t из i18next):
 * по нему отсеиваются слова с тем же переводом.
 */
export function buildReadingExamQuestion(
  word: Word,
  translate: (key: string) => string,
  pool: Word[] = allWords,
): ReadingExamQuestion {
  const answer = translate(word.translation).trim().toLowerCase();
  const length = Array.from(word.hanzi).length;

  const candidates = pool.filter(
    (other) =>
      other.vocabularyId !== word.vocabularyId &&
      other.hanzi !== word.hanzi &&
      Array.from(other.hanzi).length === length &&
      translate(other.translation).trim().toLowerCase() !== answer,
  );

  // Самые похожие — первыми; при равенстве — случайно (чтобы варианты менялись)
  const ranked = shuffle(candidates)
    .map((other) => ({ other, score: similarity(word, other) }))
    .sort((a, b) => b.score - a.score);

  const distractors: Word[] = [];
  const seenHanzi = new Set([word.hanzi]);

  // Берём из верхушки похожих с небольшим разбросом, остальное — добором
  const top = ranked.filter((item) => item.score > 0).slice(0, 8);
  for (const { other } of shuffle(top)) {
    if (distractors.length >= EXAM_OPTIONS - 1) break;
    if (seenHanzi.has(other.hanzi)) continue;
    seenHanzi.add(other.hanzi);
    distractors.push(other);
  }
  for (const { other } of ranked) {
    if (distractors.length >= EXAM_OPTIONS - 1) break;
    if (seenHanzi.has(other.hanzi)) continue;
    seenHanzi.add(other.hanzi);
    distractors.push(other);
  }

  return { word, options: shuffle([word, ...distractors]) };
}
