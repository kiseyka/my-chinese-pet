// src/utils/writing/words.ts
//
// Слова для письма: какие слова можно писать (пул), разделы HSK,
// иероглифы внутри слов как отдельные «слова», точки письма
// и данные о чертах для слова.

import type { Word } from "@/content/flashcards/types";
import { getWordHsk } from "@/content/words/hsk";
import { allWords } from "@/content/words/vocabulary";
import { getHanzi } from "@/content/writing/hanzi";
import { getWordLevel, useWordProgressStore } from "@/store/wordProgressStore";
import type { HanziData } from "@/types/hanzi";

// ── Какие слова можно писать ─────────────────────────────────────────────────

/** Самое длинное слово (в слогах), которое можно тренировать в письме. */
export const MAX_WRITING_SYLLABLES = 2;

/** Слова от 1 до MAX_WRITING_SYLLABLES слогов, у каждого иероглифа которых есть данные о чертах. */
export function getWritableWords(words: Word[]): Word[] {
  return words.filter((word) => {
    const characters = Array.from(word.hanzi);

    return (
      characters.length >= 1 &&
      characters.length <= MAX_WRITING_SYLLABLES &&
      characters.every((character) => getHanzi(character))
    );
  });
}

let writingPool: Word[] | null = null;

/**
 * Все слова, которые можно писать: вся база (src/content/words/data/words.ts).
 * Считается один раз, при первом обращении.
 */
export function getWritingPool(): Word[] {
  if (writingPool) return writingPool;

  writingPool = getWritableWords(allWords);
  return writingPool;
}

/**
 * Данные о чертах каждого иероглифа слова.
 * undefined — если хотя бы для одного иероглифа данных нет (такое слово не пишем).
 */
export function getWordHanziData(word: Word): HanziData[] | undefined {
  const chars = Array.from(word.hanzi).map((character) => getHanzi(character));

  if (chars.length === 0 || chars.some((data) => !data)) return undefined;
  return chars as HanziData[];
}

// ── Разделы HSK ──────────────────────────────────────────────────────────────

/** Раздел тренировок — уровень HSK слова. 0 — «Другие слова». */
export type WritingLevel = number;

export const NO_HSK_LEVEL = 0;

/**
 * Последний уровень HSK со своим разделом. Слова более высоких уровней (их в базе мало)
 * попадают в «Другие слова» вместе со словами без уровня.
 */
export const MAX_HSK_SECTION = 4;

export function getWordHskLevel(word: Word): WritingLevel {
  const level = getWordHsk(word.vocabularyId);
  return level === undefined || level > MAX_HSK_SECTION ? NO_HSK_LEVEL : level;
}

/** Слова раздела (любой длины до двух слогов), независимо от наборов. */
export function getLevelWords(level: WritingLevel): Word[] {
  return getWritingPool().filter((word) => getWordHskLevel(word) === level);
}

/** Разделы, в которых есть слова для письма: по возрастанию HSK, «без уровня» в конце. */
export function getAvailableLevels(): WritingLevel[] {
  const levels = new Set(getWritingPool().map(getWordHskLevel));

  return Array.from(levels).sort(
    (a, b) =>
      (a === NO_HSK_LEVEL ? Infinity : a) - (b === NO_HSK_LEVEL ? Infinity : b),
  );
}

export function describeLevel(level: WritingLevel): string {
  if (level === NO_HSK_LEVEL) return "Другие слова";
  return `HSK ${level}`;
}

// ── Точки письма ─────────────────────────────────────────────────────────────

/** Сколько точек нужно, чтобы слово считалось изученным. */
export const LEARNED_DOTS = 3;

export type ProgressMap = Record<
  string,
  NonNullable<Parameters<typeof getWordLevel>[0]>
>;

/**
 * Точки слова по письму (0–3). Отметка «слово известно» для письма не учитывается.
 * Прогресс можно передать явно: так экран, подписанный на стор, пересчитывается при его изменении.
 */
export function getWordWritingDots(word: Word, progress?: ProgressMap): number {
  const map = progress ?? useWordProgressStore.getState().flashcardWords;
  return getWordLevel(map[word.vocabularyId], false, ["writing"]);
}

// ── Пиньинь и иероглифы внутри слов ──────────────────────────────────────────

/**
 * Слог пиньиня для одного иероглифа слова («nǐ hǎo», 1 → «hǎo»).
 * Если слоги не совпадают по числу с иероглифами, возвращает fallback
 * (по умолчанию — пиньинь всего слова).
 */
export function syllableOf(
  pinyin: string,
  charCount: number,
  charIndex: number,
  fallback: string = pinyin,
): string {
  const syllables = pinyin.trim().split(/\s+/);
  return syllables.length === charCount
    ? (syllables[charIndex] ?? fallback)
    : fallback;
}

/** Префикс id для иероглифа, которого нет в базе отдельным словом (么 из 什么). */
const CHAR_ID_PREFIX = "char:";

/** Слово базы, в котором встречается иероглиф: первое по порядку изучения. */
function findParentWord(char: string): Word | undefined {
  return getWritingPool().find(
    (word) => word.hanzi.length > 1 && Array.from(word.hanzi).includes(char),
  );
}

/**
 * Иероглиф как отдельное слово для тренировки. Если он есть в базе отдельным словом,
 * берётся это слово (и его прогресс). Иначе создаётся слово с id «char:么»: пиньинь — слог
 * из слова parent, перевод — подпись «из слова …». Прогресс у него свой.
 */
export function getCharacterWord(
  char: string,
  parent?: Word,
): Word | undefined {
  const own = getWritingPool().find((word) => word.hanzi === char);
  if (own) return own;

  const source = parent ?? findParentWord(char);
  if (!source) return undefined;

  const chars = Array.from(source.hanzi);

  return {
    vocabularyId: `${CHAR_ID_PREFIX}${char}`,
    id: `${CHAR_ID_PREFIX}${char}`,
    hanzi: char,
    pinyin: syllableOf(source.pinyin, chars.length, chars.indexOf(char), ""),
    translation: `из слова ${source.hanzi}`,
  };
}

/** Иероглифы слова для отдельной практики (у односложного слова — пусто). */
export function getWordCharacters(word: Word): Word[] {
  const chars = Array.from(word.hanzi);
  if (chars.length < 2) return [];

  // Повторяющийся иероглиф (画画) показываем один раз
  return Array.from(new Set(chars))
    .map((char) => getCharacterWord(char, word))
    .filter((item): item is Word => !!item);
}

let poolById: Map<string, Word> | null = null;

/** Слово или иероглиф (id вида «char:么») для тренировки по id. */
export function findPracticeWord(vocabularyId: string): Word | undefined {
  if (vocabularyId.startsWith(CHAR_ID_PREFIX)) {
    return getCharacterWord(vocabularyId.slice(CHAR_ID_PREFIX.length));
  }

  if (!poolById) {
    poolById = new Map(getWritingPool().map((w) => [w.vocabularyId, w]));
  }
  return poolById.get(vocabularyId);
}

/** Слова по списку id (из «Повторения», очереди экзаменов), которые есть в базе. */
export function findPracticeWords(ids: string[]): Word[] {
  return ids.map(findPracticeWord).filter((word): word is Word => !!word);
}
