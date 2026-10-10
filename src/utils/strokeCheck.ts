// src/utils/strokeCheck.ts
//
// Проверка одной нарисованной черты по эталонной «средней линии» (median).
// Все координаты — в системе 1024×1024 (как в hanziData.json).

export type Point = { x: number; y: number };

/**
 * too_short — случайное касание или слишком короткая линия;
 * wrong_position — форма и направление верные, но черта проведена в стороне от нужного места;
 * wrong_direction — форма подходит, но проведена в обратную сторону;
 * wrong_shape — не та черта.
 */
export type StrokeCheckReason =
  | "too_short"
  | "wrong_position"
  | "wrong_direction"
  | "wrong_shape";

export type StrokeCheckResult =
  | { ok: true }
  | { ok: false; reason: StrokeCheckReason };

/** Сколько точек сравниваем на каждой линии. */
const SAMPLES = 20;

/** Средняя допустимая дистанция между линиями (в единицах 1024) при strictness = 1. */
const AVG_DISTANCE = 150;

/** Допустимая дистанция для начала и конца черты при strictness = 1. */
const END_DISTANCE = 230;

/** Нарисованная линия не должна быть короче этой доли эталонной. */
const MIN_LENGTH_RATIO = 0.4;

/** Сколько единиц минимум должна занимать любая черта (чтобы случайное касание не считалось). */
const MIN_ABSOLUTE_LENGTH = 25;

/** Минимальная длина вектора начало→конец, при которой проверяем общее направление. */
const DIRECTION_MIN_VECTOR = 100;

/**
 * Насколько далеко (в единицах 1024) черта может быть сдвинута от нужного места, чтобы
 * считаться «правильной, но в стороне». Дальше — это уже другая черта.
 */
const POSITION_SHIFT_LIMIT = 350;

const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

function pathLength(points: Point[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += dist(points[i - 1], points[i]);
  }
  return total;
}

/** Равномерно по длине расставляет count точек вдоль линии. */
export function resample(points: Point[], count: number): Point[] {
  const total = pathLength(points);

  if (points.length === 0) return [];
  if (total === 0) return Array.from({ length: count }, () => points[0]);

  const step = total / (count - 1);
  const result: Point[] = [points[0]];

  let travelled = 0;
  let segment = 1;
  let prev = points[0];

  while (result.length < count - 1 && segment < points.length) {
    const next = points[segment];
    const segLen = dist(prev, next);

    if (travelled + segLen >= step * result.length) {
      const t = (step * result.length - travelled) / segLen;
      result.push({
        x: prev.x + (next.x - prev.x) * t,
        y: prev.y + (next.y - prev.y) * t,
      });
    } else {
      travelled += segLen;
      prev = next;
      segment++;
    }
  }

  while (result.length < count) {
    result.push(points[points.length - 1]);
  }

  return result;
}

function center(points: Point[]): Point {
  const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), {
    x: 0,
    y: 0,
  });
  return { x: sum.x / points.length, y: sum.y / points.length };
}

function averageDistance(a: Point[], b: Point[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += dist(a[i], b[i]);
  return sum / a.length;
}

/**
 * Проверяет, подходит ли нарисованная линия под эталонную черту.
 * strictness: 1 — обычная проверка, меньше — строже (0.7), больше — мягче (1.3).
 */
export function checkStroke(
  drawn: Point[],
  median: number[][],
  strictness = 1,
): StrokeCheckResult {
  const reference: Point[] = median.map(([x, y]) => ({ x, y }));

  const drawnLength = pathLength(drawn);
  const referenceLength = pathLength(reference);

  if (
    drawn.length < 2 ||
    drawnLength < MIN_ABSOLUTE_LENGTH ||
    drawnLength < referenceLength * MIN_LENGTH_RATIO
  ) {
    return { ok: false, reason: "too_short" };
  }

  const a = resample(drawn, SAMPLES);
  const b = resample(reference, SAMPLES);

  const avgLimit = AVG_DISTANCE * strictness;
  const endLimit = END_DISTANCE * strictness;

  const forward = averageDistance(a, b);
  const startOk = dist(a[0], b[0]) <= endLimit;
  const endOk = dist(a[SAMPLES - 1], b[SAMPLES - 1]) <= endLimit;

  // Общее направление: у достаточно длинных черт начало→конец не должно смотреть назад
  const drawnVec = {
    x: a[SAMPLES - 1].x - a[0].x,
    y: a[SAMPLES - 1].y - a[0].y,
  };
  const refVec = { x: b[SAMPLES - 1].x - b[0].x, y: b[SAMPLES - 1].y - b[0].y };
  const drawnVecLen = Math.hypot(drawnVec.x, drawnVec.y);
  const refVecLen = Math.hypot(refVec.x, refVec.y);
  const pointsBackwards =
    drawnVecLen > DIRECTION_MIN_VECTOR &&
    refVecLen > DIRECTION_MIN_VECTOR &&
    drawnVec.x * refVec.x + drawnVec.y * refVec.y < 0;

  if (forward <= avgLimit && startOk && endOk && !pointsBackwards) {
    return { ok: true };
  }

  // Форма и направление верные, но черта сдвинута: совмещаем центры и сравниваем ещё раз
  if (!pointsBackwards) {
    const drawnCenter = center(a);
    const referenceCenter = center(b);
    const shift = dist(drawnCenter, referenceCenter);

    const moved = a.map((p) => ({
      x: p.x - drawnCenter.x + referenceCenter.x,
      y: p.y - drawnCenter.y + referenceCenter.y,
    }));

    if (
      shift <= POSITION_SHIFT_LIMIT &&
      averageDistance(moved, b) <= avgLimit
    ) {
      return { ok: false, reason: "wrong_position" };
    }
  }

  // Форма подходит, но линия проведена в обратную сторону
  const backward = averageDistance([...a].reverse(), b);
  if (backward <= avgLimit || pointsBackwards) {
    return { ok: false, reason: "wrong_direction" };
  }

  return { ok: false, reason: "wrong_shape" };
}
