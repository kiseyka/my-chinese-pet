// src/hooks/writing/useWritingPractice.ts

import { getHanzi } from "@/content/writing/hanzi";
import {
  checkStroke,
  type Point,
  type StrokeCheckReason,
} from "@/utils/strokeCheck";
import { useCallback, useState } from "react";

/** Строгость проверки: 1 — обычная, меньше — строже, больше — мягче. */
const STRICTNESS = 1;

/** После скольких ошибок подряд на одной черте подсвечиваем нужную. */
const HINT_AFTER_MISTAKES = 2;

export function useWritingPractice(character: string) {
  const data = getHanzi(character);

  const [strokeIndex, setStrokeIndex] = useState(0);
  const [mistakesOnStroke, setMistakesOnStroke] = useState(0);
  const [totalMistakes, setTotalMistakes] = useState(0);
  const [rawStrokes, setRawStrokes] = useState<Point[][]>([]);
  const [lastReason, setLastReason] = useState<StrokeCheckReason | null>(null);

  const strokeCount = data?.strokes.length ?? 0;
  const isFinished = strokeCount > 0 && strokeIndex >= strokeCount;
  const hintIndex =
    !isFinished && mistakesOnStroke >= HINT_AFTER_MISTAKES ? strokeIndex : null;

  const handleStroke = (points: Point[]) => {
    if (!data || isFinished) return;

    const result = checkStroke(points, data.medians[strokeIndex], STRICTNESS);

    if (result.ok) {
      // Сырую линию сохраняем: она понадобится для показа «твоего» иероглифа
      setRawStrokes((prev) => [...prev, points]);
      setStrokeIndex((i) => i + 1);
      setMistakesOnStroke(0);
      setLastReason(null);
    } else {
      setMistakesOnStroke((m) => m + 1);
      setTotalMistakes((m) => m + 1);
      setLastReason(result.reason);
    }
  };

  const reset = useCallback(() => {
    setStrokeIndex(0);
    setMistakesOnStroke(0);
    setTotalMistakes(0);
    setRawStrokes([]);
    setLastReason(null);
  }, []);

  return {
    data,
    strokeIndex,
    strokeCount,
    isFinished,
    hintIndex,
    lastReason,
    rawStrokes,
    totalMistakes,
    handleStroke,
    reset,
  };
}
