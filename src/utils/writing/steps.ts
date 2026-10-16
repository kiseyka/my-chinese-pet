// src/utils/writing/steps.ts
//
// Ступени в разделах режима «Написание».
// Если у уровня есть темы (src/content/path/themes.ts), ступени — это темы по порядку;
// большая тема делится на ровные части не больше STEP_SIZE слов («Еда», «Еда · 2»),
// слова без темы идут в конце («Ещё слова»). Без тем слова раздела выстраиваются
// в порядок изучения и делятся на ступени по STEP_SIZE слов («Ступень 1»). Текущая ступень — первая, в которой есть
// ещё не начатые слова (позже — первая, финал которой не пройден).
//
// Порядок изучения:
//   - от частых слов к редким;
//   - иероглиф раньше слов, в которых он встречается: 你好 идёт после 你 и 好, если они
//     есть в разделе отдельными словами (или были в предыдущих разделах).
//
// Чистые функции (порядок, деление, прогресс) не знают про базу слов и стор —
// всё нужное передаётся аргументами. Внизу — они же, применённые к разделам HSK.

import type { Word } from "@/content/flashcards/types";
import { pathThemes } from "@/content/path/themes";
import { getWordFrequency } from "@/content/words/hsk";
import {
  describeLevel,
  getAvailableLevels,
  getLevelWords,
  getWordHskLevel,
  getWordWritingDots,
  getWritingPool,
  NO_HSK_LEVEL,
  type ProgressMap,
  type WritingLevel,
} from "./words";

/** Сколько слов в одной ступени. */
export const STEP_SIZE = 10;

/**
 * Какая доля слов ступени должна быть начата (хотя бы 1 точка), чтобы ступень считалась
 * пройденной. Сейчас нужны все слова: тогда для ступени открывается финал.
 */
export const STEP_PASS_SHARE = 1;

function charsOf(word: Word): string[] {
  return Array.from(word.hanzi);
}

/**
 * Порядок изучения слов раздела.
 *
 * @param words слова раздела
 * @param knownChars иероглифы, которые уже встречались в предыдущих разделах
 * @param frequency место слова в частотном списке (чем меньше, тем раньше)
 */
export function orderLevelWords(
  words: Word[],
  knownChars: ReadonlySet<string>,
  frequency: (word: Word) => number,
): Word[] {
  const remaining = [...words].sort(
    (a, b) => frequency(a) - frequency(b) || a.hanzi.localeCompare(b.hanzi),
  );

  // Иероглифы, которые есть в разделе отдельным словом: слова с ними ждут, пока он не пройден
  const singles = new Set(
    remaining.filter((word) => charsOf(word).length === 1).map((w) => w.hanzi),
  );

  const introduced = new Set<string>();

  const isKnown = (char: string) =>
    knownChars.has(char) || introduced.has(char) || !singles.has(char);

  const isReady = (word: Word) => {
    const chars = charsOf(word);
    return chars.length === 1 || chars.every(isKnown);
  };

  const result: Word[] = [];

  while (remaining.length > 0) {
    // Самое частое из слов, которые уже можно учить (одиночный иероглиф готов всегда)
    const index = Math.max(remaining.findIndex(isReady), 0);
    const [word] = remaining.splice(index, 1);

    result.push(word);
    for (const char of charsOf(word)) introduced.add(char);
  }

  return result;
}

/** Делит упорядоченные слова на ступени по size слов. */
export function chunkSteps(
  ordered: Word[],
  size: number = STEP_SIZE,
): Word[][] {
  const steps: Word[][] = [];
  for (let i = 0; i < ordered.length; i += size) {
    steps.push(ordered.slice(i, i + size));
  }
  return steps;
}

export interface StepState {
  words: Word[];
  /** Сколько слов ступени начато (хотя бы 1 точка по письму). */
  started: number;
  /** Сколько слов ступени освоено (3 точки). */
  learned: number;
  /** Сколько начатых слов нужно, чтобы ступень считалась пройденной. */
  needed: number;
  passed: boolean;
}

export interface StepsProgress {
  steps: StepState[];
  /** Текущая ступень: первая непройденная (если пройдены все — последняя). */
  currentIndex: number;
  /** Все ступени раздела пройдены. */
  completed: boolean;
}

/**
 * Состояние ступеней по прогрессу.
 * @param writingLevel точки слова по письму (0–3)
 */
export function getStepsProgress(
  steps: Word[][],
  writingLevel: (word: Word) => number,
): StepsProgress {
  const states = steps.map((words) => {
    const levels = words.map(writingLevel);
    const started = levels.filter((level) => level > 0).length;
    const needed = Math.ceil(words.length * STEP_PASS_SHARE);

    return {
      words,
      started,
      learned: levels.filter((level) => level >= 3).length,
      needed,
      passed: started >= needed,
    };
  });

  const firstOpen = states.findIndex((state) => !state.passed);

  return {
    steps: states,
    currentIndex: firstOpen === -1 ? Math.max(states.length - 1, 0) : firstOpen,
    completed: states.length > 0 && firstOpen === -1,
  };
}

// ── Ступени разделов HSK ─────────────────────────────────────────────────────

/** Слова без частоты (редкие слова не из HSK) идут в конце раздела. */
function wordFrequency(word: Word): number {
  return getWordFrequency(word.vocabularyId) ?? Number.MAX_SAFE_INTEGER;
}

/** Иероглифы предыдущих разделов (для «Других слов» — всех разделов HSK). */
function getKnownChars(level: WritingLevel): Set<string> {
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
  return knownChars;
}

/** Делит слова на ровные части не больше size слов: 13 → 7 + 6, а не 10 + 3. */
export function splitEvenly<T>(items: T[], size: number = STEP_SIZE): T[][] {
  if (items.length === 0) return [];
  const parts = Math.ceil(items.length / size);
  const result: T[][] = [];
  let start = 0;
  for (let i = 0; i < parts; i++) {
    const length = Math.ceil((items.length - start) / (parts - i));
    result.push(items.slice(start, start + length));
    start += length;
  }
  return result;
}

/** «Еда», «Еда · 2», «Еда · 3». */
function partTitle(title: string, index: number): string {
  return index === 0 ? title : `${title} · ${index + 1}`;
}

interface LevelPath {
  steps: Word[][];
  titles: string[];
}

/** Ступени по темам уровня. null — у уровня нет тем. */
function buildThemedPath(
  level: WritingLevel,
  knownChars: ReadonlySet<string>,
): LevelPath | null {
  const themes = pathThemes.filter((theme) => theme.level === level);
  if (themes.length === 0) return null;

  const levelWords = getLevelWords(level);
  const byHanzi = new Map<string, Word>();
  for (const word of levelWords) {
    if (!byHanzi.has(word.hanzi)) byHanzi.set(word.hanzi, word);
  }

  const known = new Set(knownChars);
  const used = new Set<string>();
  const path: LevelPath = { steps: [], titles: [] };

  const add = (words: Word[], title: string) => {
    // Внутри темы: частые раньше, иероглиф раньше слов с ним
    const ordered = orderLevelWords(words, known, wordFrequency);
    for (const word of ordered) {
      for (const char of Array.from(word.hanzi)) known.add(char);
    }
    splitEvenly(ordered).forEach((part, index) => {
      path.steps.push(part);
      path.titles.push(partTitle(title, index));
    });
  };

  for (const theme of themes) {
    const words = theme.words
      .split(/\s+/)
      .map((hanzi) => byHanzi.get(hanzi))
      .filter(
        (word): word is Word => !!word && !used.has(word.vocabularyId),
      );
    for (const word of words) used.add(word.vocabularyId);
    add(words, theme.title);
  }

  // Слова уровня, которые не попали ни в одну тему
  add(
    levelWords.filter((word) => !used.has(word.vocabularyId)),
    "Ещё слова",
  );

  return path;
}

/** Ступени по частоте, как раньше: «Ступень 1», «Ступень 2»… */
function buildFrequencyPath(
  level: WritingLevel,
  knownChars: ReadonlySet<string>,
): LevelPath {
  const steps = chunkSteps(
    orderLevelWords(getLevelWords(level), knownChars, wordFrequency),
  );
  return { steps, titles: steps.map((_, index) => `Ступень ${index + 1}`) };
}

const pathCache = new Map<WritingLevel, LevelPath>();

/** Ступени раздела и их названия. Считаются один раз для каждого раздела. */
function getLevelPath(level: WritingLevel): LevelPath {
  const cached = pathCache.get(level);
  if (cached) return cached;

  const knownChars = getKnownChars(level);
  const path =
    buildThemedPath(level, knownChars) ?? buildFrequencyPath(level, knownChars);
  pathCache.set(level, path);
  return path;
}

/** Порядок изучения слов раздела: все ступени подряд. */
export function getLevelSequence(level: WritingLevel): Word[] {
  return getLevelPath(level).steps.flat();
}

export function getLevelSteps(level: WritingLevel): Word[][] {
  return getLevelPath(level).steps;
}

/** Названия ступеней раздела: тема («Семья», «Еда · 2») или «Ступень 3». */
export function getLevelStepTitles(level: WritingLevel): string[] {
  return getLevelPath(level).titles;
}

/**
 * Иероглиф ступени для карты пути: первое односложное слово ступени,
 * а если таких нет — первый иероглиф первого слова.
 */
export function getStepGlyph(words: Word[]): string {
  const single = words.find((word) => Array.from(word.hanzi).length === 1);
  return single?.hanzi ?? Array.from(words[0]?.hanzi ?? "")[0] ?? "";
}

/** Название одной ступени. */
export function getStepTitle(level: WritingLevel, index: number): string {
  return getLevelStepTitles(level)[index] ?? `Ступень ${index + 1}`;
}

/**
 * Ступени раздела с прогрессом. Прогресс можно передать явно: так экран, подписанный
 * на стор, пересчитывается при его изменении.
 */
export function getLevelStepsProgress(
  level: WritingLevel,
  progress?: ProgressMap,
): StepsProgress {
  return getStepsProgress(getLevelSteps(level), (word) =>
    getWordWritingDots(word, progress),
  );
}

// ── Где лежит слово ──────────────────────────────────────────────────────────

let locationCache: Map<string, { level: WritingLevel; index: number }> | null =
  null;

/** Раздел и ступень письма, где лежит слово (для «Показать» из поиска). */
export function findWritingWordStep(
  wordId: string,
): { level: WritingLevel; index: number } | null {
  if (!locationCache) {
    const cache = new Map<string, { level: WritingLevel; index: number }>();
    for (const level of getAvailableLevels()) {
      getLevelSteps(level).forEach((words, index) => {
        for (const word of words) cache.set(word.vocabularyId, { level, index });
      });
    }
    locationCache = cache;
  }
  return locationCache.get(wordId) ?? null;
}

/** «HSK 1 · Семья», «HSK 2 · Ступень 7». */
export function describeWritingStep(level: WritingLevel, index: number): string {
  return `${describeLevel(level)} · ${getStepTitle(level, index)}`;
}
