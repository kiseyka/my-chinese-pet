// src/utils/activity.ts
//
// Дни занятий: ключ дня, серии, сетка активности за последние недели.
// Дни считаются по местному времени телефона.

export interface DayActivity {
  /** Сколько тренировок и экзаменов закончено в этот день. */
  trainings: number;
  /** Сколько ответов в них было. */
  answers: number;
}

export type ActivityDays = Record<string, DayActivity>;

const pad = (n: number) => String(n).padStart(2, "0");

/** «2026-10-18» — день по местному времени. */
export function dayKey(time: number | Date = Date.now()): string {
  const date = time instanceof Date ? time : new Date(time);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Начало того же дня, сдвинутое на offset дней (по календарю, без часов). */
function shiftDay(date: Date, offset: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + offset);
}

/** Сколько дней подряд, считая с сегодняшнего (или вчерашнего, если сегодня ещё не заходили). */
export function getCurrentSeries(days: ActivityDays, now = Date.now()): number {
  const today = new Date(now);
  let start = days[dayKey(today)] ? today : shiftDay(today, -1);
  let series = 0;
  while (days[dayKey(start)]) {
    series += 1;
    start = shiftDay(start, -1);
  }
  return series;
}

/** Самая длинная серия за всё время. */
export function getBestSeries(days: ActivityDays): number {
  const keys = Object.keys(days).sort();
  let best = 0;
  let run = 0;
  let previous: string | null = null;

  for (const key of keys) {
    const [y, m, d] = key.split("-").map(Number);
    const yesterday = dayKey(new Date(y, m - 1, d - 1));
    run = previous === yesterday ? run + 1 : 1;
    best = Math.max(best, run);
    previous = key;
  }
  return best;
}

export interface ActivityCell {
  key: string;
  /** День ещё не наступил (хвост текущей недели). */
  future: boolean;
  activity?: DayActivity;
}

/**
 * Сетка за последние weeks недель: колонки — недели (с понедельника),
 * строки — дни недели. Последняя колонка — текущая неделя.
 */
export function getActivityWeeks(
  days: ActivityDays,
  weeks: number,
  now = Date.now(),
): ActivityCell[][] {
  const today = new Date(now);
  // 0 — понедельник
  const weekday = (today.getDay() + 6) % 7;
  const firstMonday = shiftDay(today, -weekday - (weeks - 1) * 7);

  return Array.from({ length: weeks }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => {
      const date = shiftDay(firstMonday, week * 7 + day);
      const key = dayKey(date);
      return {
        key,
        future: date.getTime() > today.getTime(),
        activity: days[key],
      };
    }),
  );
}
