// src/utils/writingLessons.ts
//
// Составление уроков письма: какие слова и в каком формате пройдут в тренировке.

import type { Word } from "@/content/flashcards/types";
import { getWordFrequency, getWordHsk } from "@/content/words/hsk";
import { allWords } from "@/content/words/vocabulary";
import { getWordLevel, useWordProgressStore } from "@/store/wordProgressStore";
import type { LessonFormat } from "./writingStages";
import {
  chunkSteps,
  getStepsProgress,
  orderLevelWords,
  type StepsProgress,
} from "./writingSteps";
import { getWritableWords } from "./writingWords";

export interface LessonItem {
  word: Word;
  format: LessonFormat;
  /** Подпись над заданием: «Новое слово», «Повторение» и т.д. */
  roleLabel: string;
  /** Если слово написано только с подсказками, в конце урока оно получает работу над ошибками. */
  retryDeep?: boolean;
  /** Это задание — работа над ошибками (не входит в счёт урока). */
  isDeep?: boolean;
}

export interface WordGroups {
  /** Ещё не начатые (0 точек по написанию). */
  fresh: Word[];
  /** В процессе (1–2 точки). */
  learning: Word[];
  /** Освоенные (3 точки). */
  learned: Word[];
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

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

type ProgressMap = Record<
  string,
  NonNullable<Parameters<typeof getWordLevel>[0]>
>;

/** Точки слова по письму (0–3). Отметка «слово известно» для письма не учитывается. */
function getWritingDots(word: Word, map: ProgressMap): number {
  return getWordLevel(map[word.vocabularyId], false, ["writing"]);
}

// ── Ступени ──────────────────────────────────────────────────────────────────

/** Слова без частоты (редкие слова не из HSK) идут в конце раздела. */
function wordFrequency(word: Word): number {
  return getWordFrequency(word.vocabularyId) ?? Number.MAX_SAFE_INTEGER;
}

const sequenceCache = new Map<WritingLevel, Word[]>();

/**
 * Порядок изучения слов раздела (см. writingSteps.ts). Иероглифы из предыдущих разделов
 * считаются уже знакомыми; для «Других слов» знакомы все иероглифы разделов HSK.
 * Считается один раз для каждого раздела.
 */
export function getLevelSequence(level: WritingLevel): Word[] {
  const cached = sequenceCache.get(level);
  if (cached) return cached;

  const knownChars = new Set<string>();
  for (const word of getWritingPool()) {
    const wordLevel = getWordHskLevel(word);
    const isEarlier =
      wordLevel !== NO_HSK_LEVEL &&
      (level === NO_HSK_LEVEL || wordLevel < level);

    if (isEarlier) {
      for (const char of Array.from(word.hanzi)) knownChars.add(char);
    }
  }

  const sequence = orderLevelWords(
    getLevelWords(level),
    knownChars,
    wordFrequency,
  );
  sequenceCache.set(level, sequence);
  return sequence;
}

const stepsCache = new Map<WritingLevel, Word[][]>();

export function getLevelSteps(level: WritingLevel): Word[][] {
  const cached = stepsCache.get(level);
  if (cached) return cached;

  const steps = chunkSteps(getLevelSequence(level));
  stepsCache.set(level, steps);
  return steps;
}

/**
 * Ступени раздела с прогрессом. Прогресс можно передать явно: так экран, подписанный
 * на стор, пересчитывается при его изменении.
 */
export function getLevelStepsProgress(
  level: WritingLevel,
  progress?: ProgressMap,
): StepsProgress {
  const map = progress ?? useWordProgressStore.getState().flashcardWords;
  return getStepsProgress(getLevelSteps(level), (word) =>
    getWritingDots(word, map),
  );
}

/**
 * Делит слова на новые / в процессе / освоенные по написанию.
 * Прогресс можно передать явно: так экран, подписанный на стор, пересчитывается при его изменении.
 */
export function groupByWritingLevel(
  words: Word[],
  progress?: ProgressMap,
): WordGroups {
  const map = progress ?? useWordProgressStore.getState().flashcardWords;
  const groups: WordGroups = { fresh: [], learning: [], learned: [] };

  for (const word of words) {
    const level = getWritingDots(word, map);

    if (level === 0) groups.fresh.push(word);
    else if (level === 3) groups.learned.push(word);
    else groups.learning.push(word);
  }

  return groups;
}

/** Среди скольких самых простых новых слов по умолчанию выбирается слово для изучения. */
const EASIEST_POOL = 3;

/**
 * Классическая тренировка: 1 слово для изучения (полный формат) и 2 повторения
 * (быстрый формат): одно «в процессе» и одно освоенное. Если нужных слов нет,
 * повторение заменяется новым словом.
 *
 * Слово для изучения выбирается случайно среди easiestPool новых слов с наименьшей
 * difficulty. Для ступеней difficulty — место в порядке изучения, а easiestPool = 1:
 * слова идут строго по порядку.
 */
export function composeClassicPlan(
  groups: WordGroups,
  random: (words: Word[]) => Word[] = shuffle,
  difficulty: (word: Word) => number = () => 0,
  easiestPool: number = EASIEST_POOL,
): LessonItem[] {
  const fresh = random(groups.fresh);
  const learning = random(groups.learning);
  const learned = random(groups.learned);

  const easiestFresh = random(
    [...fresh]
      .sort((a, b) => difficulty(a) - difficulty(b))
      .slice(0, easiestPool),
  );

  const usedHanzi = new Set<string>();

  const take = (...pools: Word[][]): Word | undefined => {
    for (const pool of pools) {
      const word = pool.find((w) => !usedHanzi.has(w.hanzi));
      if (word) {
        usedHanzi.add(word.hanzi);
        return word;
      }
    }
    return undefined;
  };

  const plan: LessonItem[] = [];

  // Слово для изучения: новое, а если новых нет — то, что в процессе, затем освоенное
  const main = take(easiestFresh, learning, learned);
  if (main) {
    const isNew = fresh.includes(main);
    plan.push({
      word: main,
      format: "full",
      roleLabel: isNew ? "Новое слово" : "Учим дальше",
    });
  }

  // Если слов для повторения нет, вместо них идут самые простые новые слова.
  // Они проходятся в лёгком формате (показ → контур → сам), а не «сразу по контуру»
  const easiestFirst = [...fresh].sort((a, b) => difficulty(a) - difficulty(b));

  const review = (pool: Word[]) => {
    const word = take(pool);
    if (word) {
      plan.push({ word, format: "quick", roleLabel: "Повторение" });
      return;
    }

    const filler = take(easiestFirst);
    if (filler) {
      plan.push({ word: filler, format: "light", roleLabel: "Новое слово" });
    }
  };

  review(learning);
  review(learned);

  return plan;
}

/**
 * Классическая тренировка в разделе: новые слова — по порядку из открытых ступеней
 * (сначала недоученные из пройденных, затем из текущей), повторения — из открытых ступеней.
 */
export function createClassicPlan(level: WritingLevel): LessonItem[] {
  const { currentIndex } = getLevelStepsProgress(level);
  const opened = getLevelSteps(level)
    .slice(0, currentIndex + 1)
    .flat();

  const order = new Map(
    getLevelSequence(level).map((word, index) => [word.vocabularyId, index]),
  );

  return composeClassicPlan(
    groupByWritingLevel(opened),
    shuffle,
    (word) => order.get(word.vocabularyId) ?? Number.MAX_SAFE_INTEGER,
    1,
  );
}

// ── Практика отдельных иероглифов ───────────────────────────────────────────

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
  const syllables = source.pinyin.trim().split(/\s+/);
  const index = chars.indexOf(char);

  return {
    vocabularyId: `${CHAR_ID_PREFIX}${char}`,
    id: `${CHAR_ID_PREFIX}${char}`,
    hanzi: char,
    pinyin: syllables.length === chars.length ? (syllables[index] ?? "") : "",
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

/** Точки слова по письму (0–3) — для сетки и окна выбора. */
export function getWordWritingDots(word: Word, progress?: ProgressMap): number {
  return getWritingDots(
    word,
    progress ?? useWordProgressStore.getState().flashcardWords,
  );
}

/** Формат свободной тренировки: полный цикл или быстрый (контур → по памяти). */
export type FreeFormat = "full" | "quick";

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

/**
 * Свободная тренировка: одно выбранное слово или иероглиф (id вида «char:么»).
 * Слово ищется во всей базе, в том числе среди слов HSK.
 */
export function createFreePlan(
  vocabularyId: string,
  format: FreeFormat = "full",
): LessonItem[] {
  const word = findPracticeWord(vocabularyId);

  return word
    ? [
        {
          word,
          format,
          roleLabel:
            format === "quick" ? "Быстрая тренировка" : "Полная тренировка",
        },
      ]
    : [];
}

/** Сколько слов в «Повторить тему». */
export const REVIEW_WORD_COUNT = 4;

/** Сколько слов с ошибками получают работу над ошибками (чтобы урок не затягивался). */
export const DEEP_TRAINING_LIMIT = 2;

/** Освоенные слова, из которых можно собрать повторение. */
export function getLearnedWords(words: Word[], progress?: ProgressMap): Word[] {
  return groupByWritingLevel(getWritableWords(words), progress).learned;
}

/** Повторить тему: 4 освоенных слова, быстрый формат. Меньше четырёх — урока нет. */
export function composeReviewPlan(
  learned: Word[],
  random: (words: Word[]) => Word[] = shuffle,
): LessonItem[] {
  if (learned.length < REVIEW_WORD_COUNT) return [];

  return random(learned)
    .slice(0, REVIEW_WORD_COUNT)
    .map((word) => ({
      word,
      format: "quick" as const,
      roleLabel: "Повторение",
      retryDeep: true,
    }));
}

// ── «Повторение» в письме ────────────────────────────────────────────────────

/** Сколько слов из «Повторения» в одной тренировке. */
export const REPEAT_LESSON_SIZE = 5;

/** Слова из «Повторения» (по id из стора), которые есть в базе. */
export function getRepeatWords(ids: string[]): Word[] {
  return ids.map(findPracticeWord).filter((word): word is Word => !!word);
}

/**
 * Тренировка по «Повторению»: до REPEAT_LESSON_SIZE слов, сначала те, что дольше всего
 * не писались. Быстрый формат; слово, написанное с подсказками, в конце идёт
 * на полный цикл (работа над ошибками).
 */
export function createRepeatPlan(): LessonItem[] {
  const state = useWordProgressStore.getState();
  const lastWritten = (word: Word) =>
    state.flashcardWords[word.vocabularyId]?.lastAnsweredAt ?? 0;

  return getRepeatWords(Object.keys(state.writingReview))
    .sort((a, b) => lastWritten(a) - lastWritten(b))
    .slice(0, REPEAT_LESSON_SIZE)
    .map((word) => ({
      word,
      format: "quick" as const,
      roleLabel: "Повторение",
      retryDeep: true,
    }));
}

// ── Поиск ────────────────────────────────────────────────────────────────────

/**
 * Пиньинь без тонов, пробелов и апострофов, в нижнем регистре: «nǐ hǎo» → «nihao».
 * ü и привычная замена «v» (lv = lü) приводятся к «u».
 */
export function normalizePinyin(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[üv]/g, "u")
    .replace(/[\s'’·-]/g, "")
    .toLowerCase();
}

/** Сколько результатов поиска показывать. */
export const SEARCH_LIMIT = 40;

/**
 * Поиск по базе письма: по иероглифам, по пиньиню без тонов («nihao») и по переводу.
 * translate — функция перевода (t из i18next): перевод у слов — ключ "words:<id>".
 * Сначала точные совпадения иероглифов, затем пиньинь с начала, затем остальное.
 */
export function searchWritingWords(
  query: string,
  translate: (key: string) => string,
): Word[] {
  const raw = query.trim();
  if (!raw) return [];

  const lower = raw.toLowerCase();
  const pinyinQuery = normalizePinyin(raw);
  const hasHan = /\p{Script=Han}/u.test(raw);

  const scored: { word: Word; score: number; index: number }[] = [];

  getWritingPool().forEach((word, index) => {
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
    .slice(0, SEARCH_LIMIT)
    .map((item) => item.word);
}

interface OutcomeLike {
  word: Word;
  success: boolean;
  retryDeep?: boolean;
}

/** Слова, которые после быстрой проверки идут на работу над ошибками (полный цикл). */
export function composeDeepItems(
  outcomes: OutcomeLike[],
  limit: number = DEEP_TRAINING_LIMIT,
): LessonItem[] {
  return outcomes
    .filter((outcome) => !outcome.success && outcome.retryDeep)
    .slice(0, limit)
    .map((outcome) => ({
      word: outcome.word,
      format: "full" as const,
      roleLabel: "Работа над ошибками",
      isDeep: true,
    }));
}
