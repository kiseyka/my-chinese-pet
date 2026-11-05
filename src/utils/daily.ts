// src/utils/daily.ts
//
// СЛОВА ДНЯ — занятие «без выбора» на экране панды.
//
// Два независимых пула: перевод и письмо. Письмо не тормозит перевод и наоборот.
//
// Добор (раз в день, при первом заходе на панду):
//   новых слов = min(N, 2N − слов в пуле), N — «новых в день» для навыка.
//   Перевод: слова пути по порядку этапов, у которых нет ни одной точки перевода.
//   Письмо:  слова пути, которые можно писать, без точек письма.
//   Пул не растёт выше 2N: одно упрямое слово занимает один слот, а не всю очередь.
//
// Выход из пула:
//   перевод — 3 точки перевода и «знаю» в проверке «Помнишь?» (на следующий день
//             после третьей точки или позже); «сомневаюсь» / «не знаю» — остаётся;
//   письмо  — 3 точки письма. Написал слово по памяти без подсказок после «знаю»
//             («знаешь, как пишется?») — сразу 3 точки.
//
// Одна точка в день: тренировка слов дня берёт только слова, с которыми сегодня
// ещё не занимались (doneDay ≠ сегодня). Занятие на пути или в «Словаре» тоже
// отмечает слово пула сделанным на сегодня.

import type { Word } from "@/content/flashcards/types";
import { findWords } from "@/content/words/vocabulary";
import { useDailyStore, type DailyPool, type DailySkill } from "@/store/dailyStore";
import { useWordProgressStore } from "@/store/wordProgressStore";
import { dayKey } from "@/utils/activity";
import { getPathStages, getTrackDots } from "@/utils/path/stages";
import { LEARNED_DOTS, type ProgressMap } from "@/utils/writing/words";

/** Источник тренировки перевода слов дня (как «path:1:0» у этапа). */
export const DAILY_READING_SOURCE = "daily:reading";

/** Выбор «новых слов в день» и что предлагаем по умолчанию. */
export const PER_DAY_OPTIONS: Record<DailySkill, number[]> = {
  reading: [1, 2, 3, 4, 5],
  writing: [1, 2, 3],
};
export const DEFAULT_PER_DAY: Record<DailySkill, number> = {
  reading: 3,
  writing: 1,
};

/** Потолок пула: вдвое больше новых слов в день. */
export const poolCap = (perDay: number) => perDay * 2;

const skillWords = (skill: DailySkill) =>
  getPathStages().flatMap((stage) =>
    skill === "writing" ? stage.writable : stage.words,
  );

/** Новые слова для пула по порядку пути: без точек навыка и не в пуле. */
export function pickNewWords(
  skill: DailySkill,
  count: number,
  progress: ProgressMap,
  pool: DailyPool,
): string[] {
  if (count <= 0) return [];
  const picked: string[] = [];
  const seen = new Set<string>();
  for (const word of skillWords(skill)) {
    if (picked.length >= count) break;
    const id = word.vocabularyId;
    if (seen.has(id) || pool[id]) continue;
    seen.add(id);
    if (getTrackDots(word, skill, progress) === 0) picked.push(id);
  }
  return picked;
}

function dotsOf(id: string, skill: DailySkill, progress: ProgressMap): number {
  const word = findWords([id])[0];
  return word ? getTrackDots(word, skill, progress) : 0;
}

/**
 * Привести слова дня к сегодняшнему дню: убрать из письма освоенное (3 точки),
 * а в новый день — добрать новые слова. Вызывается при заходе на панду.
 */
export function syncDaily(today = dayKey()) {
  const daily = useDailyStore.getState();
  if (!daily.perDay) return;
  const progress = useWordProgressStore.getState().flashcardWords;

  // Письмо: 3 точки — слово освоено, где бы его ни написали
  const masteredWriting = Object.keys(daily.pools.writing).filter(
    (id) => dotsOf(id, "writing", progress) >= LEARNED_DOTS,
  );
  daily.remove("writing", masteredWriting);

  if (daily.filledDay === today) return;

  for (const skill of ["reading", "writing"] as DailySkill[]) {
    const n = daily.perDay[skill];
    const pool = useDailyStore.getState().pools[skill];
    const room = poolCap(n) - Object.keys(pool).length;
    const ids = pickNewWords(skill, Math.min(n, room), progress, pool);
    daily.fill(skill, ids, today);
  }
  daily.setFilledDay(today);
}

/** Сегодняшний план навыка: что спросить «помнишь?», что учить, сколько сделано. */
export interface DailyPlan {
  /** Перевод: 3 точки, не сегодня — сначала «Помнишь?». У письма всегда пусто. */
  check: string[];
  /** Слова, с которыми сегодня ещё не занимались (без check). */
  learn: string[];
  done: number;
  total: number;
}

export function getDailyPlan(
  skill: DailySkill,
  pool: DailyPool,
  progress: ProgressMap,
  today = dayKey(),
): DailyPlan {
  // Порядок добавления: раньше добавленные — раньше
  const ids = Object.entries(pool)
    .sort(([, a], [, b]) => a.addedDay.localeCompare(b.addedDay))
    .map(([id]) => id);

  const check: string[] = [];
  const learn: string[] = [];
  let done = 0;

  for (const id of ids) {
    if (pool[id].doneDay === today) {
      done += 1;
      continue;
    }
    if (skill === "reading" && dotsOf(id, "reading", progress) >= LEARNED_DOTS) {
      check.push(id);
    } else {
      learn.push(id);
    }
  }
  return { check, learn, done, total: ids.length };
}

/** Слова тренировки перевода: все слова пула, с которыми сегодня не занимались. */
export function getDailyReadingWords(): Word[] {
  const { pools } = useDailyStore.getState();
  const progress = useWordProgressStore.getState().flashcardWords;
  const plan = getDailyPlan("reading", pools.reading, progress);
  return findWords([...plan.check, ...plan.learn]);
}

/** Слова тренировки письма: слова пула, которые сегодня ещё не писали. */
export function getDailyWritingWords(): Word[] {
  const { pools } = useDailyStore.getState();
  const progress = useWordProgressStore.getState().flashcardWords;
  return findWords(getDailyPlan("writing", pools.writing, progress).learn);
}

/** С этими словами сегодня занимались (любая тренировка с точками). */
export function markDailyDone(skill: DailySkill, ids: string[]) {
  useDailyStore.getState().markDone(skill, ids, dayKey());
}
