// src/utils/writingSteps.ts
//
// Ступени в разделах режима «Написание»: слова раздела выстраиваются в порядок изучения
// и делятся на ступени по STEP_SIZE слов. Текущая ступень — первая, в которой есть
// ещё не начатые слова (позже — первая, финал которой не пройден).
//
// Порядок изучения:
//   - от частых слов к редким;
//   - иероглиф раньше слов, в которых он встречается: 你好 идёт после 你 и 好, если они
//     есть в разделе отдельными словами (или были в предыдущих разделах).
//
// Функции здесь не знают про базу слов и стор: всё нужное передаётся аргументами.

import type { Word } from "@/content/flashcards/types";

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
