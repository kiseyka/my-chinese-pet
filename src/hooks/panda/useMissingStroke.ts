// src/hooks/panda/useMissingStroke.ts
//
// Игра панды «Допиши черту»: иероглиф нарисован целиком, кроме одной черты — её
// нужно дописать. Проще, чем писать слово по памяти: видно всё остальное.
//   - у слова из нескольких иероглифов выбирается один (с 2+ чертами, если есть);
//   - пропущенная черта — случайная;
//   - проверка мягкая: случайное касание — не ошибка, черта «в стороне» засчитывается;
//   - после двух ошибок показывается контур нужной черты.

import type { Word } from "@/content/flashcards/types";
import type { HanziData } from "@/types/hanzi";
import { checkStroke, type Point } from "@/utils/writing/strokeCheck";
import { getWordHanziData } from "@/utils/writing/words";
import { useMemo, useState } from "react";

/** Мягче, чем письмо по памяти: черта одна, и всё остальное уже на месте. */
const STRICTNESS = 1.3;
const HINT_AFTER = 2;

export function useMissingStroke(word: Word | undefined) {
  // Иероглиф и черта выбираются один раз на игру
  const target = useMemo(() => {
    const chars = word ? getWordHanziData(word) : undefined;
    if (!chars) return undefined;

    const indices = chars.map((_, i) => i);
    const withStrokes = indices.filter((i) => chars[i].strokes.length >= 2);
    const pool = withStrokes.length > 0 ? withStrokes : indices;
    const charIndex = pool[Math.floor(Math.random() * pool.length)];
    const data: HanziData = chars[charIndex];
    const strokeIndex = Math.floor(Math.random() * data.strokes.length);

    return { chars, charIndex, data, strokeIndex };
  }, [word]);

  const [mistakes, setMistakes] = useState(0);
  const [drawn, setDrawn] = useState<Point[] | null>(null);
  const done = drawn !== null;

  const handleStroke = (points: Point[]) => {
    if (!target || done) return;
    const result = checkStroke(
      points,
      target.data.medians[target.strokeIndex],
      STRICTNESS,
    );

    if (result.ok || result.reason === "wrong_position") {
      setDrawn(points);
      return;
    }
    if (result.reason === "too_short") return;
    setMistakes((n) => n + 1);
  };

  const allButMissing = target
    ? target.data.strokes.map((_, i) => i).filter((i) => i !== target.strokeIndex)
    : [];

  return {
    target,
    mistakes,
    done,
    /** Черты, которые уже нарисованы (все, кроме пропущенной; после ответа — все). */
    snappedIndices: done && target ? target.data.strokes.map((_, i) => i) : allButMissing,
    /** Контур пропущенной черты — после HINT_AFTER ошибок. */
    hintIndex: target && !done && mistakes >= HINT_AFTER ? target.strokeIndex : null,
    handleStroke,
  };
}
