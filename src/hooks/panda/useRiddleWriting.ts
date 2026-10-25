// src/hooks/panda/useRiddleWriting.ts
//
// Загадка панды «напиши слово»: слово целиком по памяти, иероглиф за иероглифом.
// Мягче экзамена — это не проверка, а просьба панды:
//   - случайное касание — не ошибка;
//   - верная черта в стороне — всегда ставится на место без штрафа;
//   - неверная черта — ошибка; после двух ошибок на одной черте показывается её контур;
//   - провалить нельзя, точки письма не меняются.

import type { Word } from "@/content/flashcards/types";
import { moveIntoPlace } from "@/hooks/writing/useWritingExam";
import type { HanziData } from "@/types/hanzi";
import { checkStroke, type Point } from "@/utils/writing/strokeCheck";
import { getWordHanziData } from "@/utils/writing/words";
import { useEffect, useMemo, useState } from "react";

/** Строгость проверки — как при письме по памяти на уроке. */
const STRICTNESS = 1.15;
/** После скольких ошибок на одной черте показать её контур. */
const HINT_AFTER = 2;
/** Пауза после дописанного иероглифа, перед следующим. */
const CHAR_DONE_DELAY = 500;

type Phase = "active" | "char_done" | "done";

export function useRiddleWriting(word: Word | undefined) {
  const chars = useMemo<HanziData[] | undefined>(
    () => (word ? getWordHanziData(word) : undefined),
    [word],
  );

  const [charIndex, setCharIndex] = useState(0);
  const [cursor, setCursor] = useState(0);
  const [raws, setRaws] = useState<Point[][][]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [strokeMistakes, setStrokeMistakes] = useState(0);
  const [phase, setPhase] = useState<Phase>("active");

  const charData = chars?.[charIndex];
  const hintIndex = strokeMistakes >= HINT_AFTER ? cursor : null;

  useEffect(() => {
    if (phase !== "char_done") return;
    const timer = setTimeout(() => {
      setCharIndex((i) => i + 1);
      setCursor(0);
      setStrokeMistakes(0);
      setPhase("active");
    }, CHAR_DONE_DELAY);
    return () => clearTimeout(timer);
  }, [phase]);

  const accept = (points: Point[]) => {
    if (!chars || !charData) return;

    setRaws((prev) => {
      const next = [...prev];
      next[charIndex] = [...(next[charIndex] ?? []), points];
      return next;
    });
    setStrokeMistakes(0);

    const nextCursor = cursor + 1;
    setCursor(nextCursor);
    if (nextCursor < charData.strokes.length) return;

    setPhase(charIndex + 1 < chars.length ? "char_done" : "done");
  };

  const handleStroke = (points: Point[]) => {
    if (phase !== "active" || !charData) return;

    const median = charData.medians[cursor];
    const result = checkStroke(points, median, STRICTNESS);

    if (result.ok) return accept(points);
    if (result.reason === "too_short") return;
    if (result.reason === "wrong_position") {
      return accept(moveIntoPlace(points, median));
    }

    setMistakes((n) => n + 1);
    setStrokeMistakes((n) => n + 1);
  };

  return {
    chars,
    charIndex,
    charData,
    phase,
    mistakes,
    hintIndex,
    /** Подсказали контур хотя бы раз на этой черте. */
    isHinting: hintIndex !== null,
    raws,
    completedRaws: raws.slice(0, charIndex),
    rawStrokes: raws[charIndex] ?? [],
    handleStroke,
  };
}
