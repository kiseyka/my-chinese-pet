// src/hooks/writing/useWritingExam.ts
//
// Ход экзамена по письму. Каждое слово пишется целиком по памяти: без демо, контура
// и раскрытия черт. У двусложного слова — оба иероглифа подряд.
//
// Ошибки считаются на всё слово:
//   - случайное касание (too_short) — не ошибка;
//   - первая черта «верная, но в стороне» на слово — без штрафа: ставим её на место
//     и пишем дальше;
//   - любая другая неверная черта (и вторая «в стороне») — ошибка, черту пишут заново;
//   - ошибок больше ALLOWED_MISTAKES — слово не сдано.
//
// Результат слова записывается в стор сразу, как только он ясен (а не в конце экзамена),
// чтобы выход посреди экзамена не отменял уже проваленное слово.

import type { Word } from "@/content/flashcards/types";
import { getHanzi } from "@/content/writing/hanzi";
import { useProgressStore } from "@/store/userProgressStore";
import { useWordProgressStore } from "@/store/wordProgressStore";
import type { HanziData } from "@/types/hanzi";
import { calculateCoinsEarned } from "@/utils/calculateCoinsEarned";
import {
  checkStroke,
  resample,
  type Point,
  type StrokeCheckReason,
} from "@/utils/strokeCheck";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

/** Строгость проверки — как при письме по памяти на уроке. */
const STRICTNESS = 1.15;

/** Сколько ошибок на слово допускается. Следующая — провал. */
export const ALLOWED_MISTAKES = 1;

/** Пауза после дописанного иероглифа, перед следующим иероглифом слова. */
const CHAR_DONE_DELAY = 500;

/**
 * passed — сдано (галочка);
 * retry — не сдано, пересдать через сутки;
 * dropped — второй провал подряд: минус одна точка.
 */
export type ExamVerdict = "passed" | "retry" | "dropped";

/** Что произошло с последней чертой (для подписи под холстом). */
export type ExamStrokeNote =
  | { kind: "moved" } // верная, но в стороне — поставили на место
  | { kind: "mistake"; reason: Exclude<StrokeCheckReason, "too_short"> };

type Phase = "active" | "char_done" | "word_result" | "finished";

interface ExamWord {
  word: Word;
  chars: HanziData[];
}

export interface ExamOutcome extends ExamWord {
  /** Линии пользователя по каждому иероглифу слова. */
  raws: Point[][][];
  verdict: ExamVerdict;
}

function prepare(list: Word[]): ExamWord[] {
  const words: ExamWord[] = [];

  for (const word of list) {
    const chars = Array.from(word.hanzi).map((character) =>
      getHanzi(character),
    );

    // Слово без данных хотя бы об одном иероглифе пропускаем
    if (chars.length === 0 || chars.some((data) => !data)) continue;

    words.push({ word, chars: chars as HanziData[] });
  }

  return words;
}

function centerOf(points: Point[]): Point {
  const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), {
    x: 0,
    y: 0,
  });
  return { x: sum.x / points.length, y: sum.y / points.length };
}

/** Сдвигает линию пользователя так, чтобы её центр совпал с центром нужной черты. */
function moveIntoPlace(points: Point[], median: number[][]): Point[] {
  const reference = median.map(([x, y]) => ({ x, y }));
  const from = centerOf(resample(points, 20));
  const to = centerOf(resample(reference, 20));

  return points.map((p) => ({
    x: p.x - from.x + to.x,
    y: p.y - from.y + to.y,
  }));
}

/** Записывает результат в стор и возвращает, что из этого вышло. */
function recordVerdict(wordId: string, passed: boolean): ExamVerdict {
  useWordProgressStore.getState().recordWritingExamResult({ wordId, passed });

  if (passed) return "passed";

  const entry = useWordProgressStore.getState().writingExams[wordId];
  return entry?.availableAt === null ? "dropped" : "retry";
}

export function useWritingExam(buildWords: () => Word[]) {
  const [words, setWords] = useState<ExamWord[]>([]);
  const [isReady, setIsReady] = useState(false);

  const [wordIndex, setWordIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [cursor, setCursor] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  /** Черту «в стороне» без штрафа уже ставили на место в этом слове. */
  const [positionFixUsed, setPositionFixUsed] = useState(false);
  /** Принятые линии пользователя по иероглифам текущего слова. */
  const [raws, setRaws] = useState<Point[][][]>([]);
  const [phase, setPhase] = useState<Phase>("active");
  const [note, setNote] = useState<ExamStrokeNote | null>(null);
  const [verdict, setVerdict] = useState<ExamVerdict | null>(null);
  const [outcomes, setOutcomes] = useState<ExamOutcome[]>([]);

  // Защита от двойного нажатия «Дальше» на последнем слове
  const isFinishing = useRef(false);

  const current = words[wordIndex];
  const charData = current?.chars[charIndex];

  const resetWord = () => {
    setCharIndex(0);
    setCursor(0);
    setMistakes(0);
    setPositionFixUsed(false);
    setRaws([]);
    setNote(null);
    setVerdict(null);
    setPhase("active");
  };

  // Экран может оставаться смонтированным между заходами — собираем экзамен при каждом входе
  useFocusEffect(
    useCallback(() => {
      setWords(prepare(buildWords()));
      setWordIndex(0);
      setOutcomes([]);
      isFinishing.current = false;
      resetWord();
      setIsReady(true);

      return () => setIsReady(false);
    }, [buildWords]),
  );

  // Пауза после дописанного иероглифа, затем следующий иероглиф слова
  useEffect(() => {
    if (phase !== "char_done") return;

    const timer = setTimeout(() => {
      setCharIndex((i) => i + 1);
      setCursor(0);
      setNote(null);
      setPhase("active");
    }, CHAR_DONE_DELAY);

    return () => clearTimeout(timer);
  }, [phase]);

  const finishWord = (passed: boolean) => {
    if (!current) return;
    setVerdict(recordVerdict(current.word.vocabularyId, passed));
    setPhase("word_result");
  };

  /** Принимает черту (свою или поставленную на место) и двигает курсор. */
  const accept = (points: Point[], nextNote: ExamStrokeNote | null) => {
    if (!current || !charData) return;

    setRaws((prev) => {
      const next = [...prev];
      next[charIndex] = [...(next[charIndex] ?? []), points];
      return next;
    });
    setNote(nextNote);

    const nextCursor = cursor + 1;
    setCursor(nextCursor);

    if (nextCursor < charData.strokes.length) return;

    if (charIndex + 1 < current.chars.length) setPhase("char_done");
    else finishWord(true);
  };

  const handleStroke = (points: Point[]) => {
    if (phase !== "active" || !current || !charData) return;

    const median = charData.medians[cursor];
    const result = checkStroke(points, median, STRICTNESS);

    if (result.ok) {
      accept(points, null);
      return;
    }

    // Случайные касания за ошибку не считаем
    if (result.reason === "too_short") return;

    // Верная черта в стороне: один раз на слово ставим её на место без штрафа
    if (result.reason === "wrong_position" && !positionFixUsed) {
      setPositionFixUsed(true);
      accept(moveIntoPlace(points, median), { kind: "moved" });
      return;
    }

    const nextMistakes = mistakes + 1;
    setMistakes(nextMistakes);
    setNote({ kind: "mistake", reason: result.reason });

    if (nextMistakes > ALLOWED_MISTAKES) finishWord(false);
  };

  const continueAfterResult = () => {
    if (!current || !verdict || phase !== "word_result") return;

    const nextOutcomes: ExamOutcome[] = [
      ...outcomes,
      { word: current.word, chars: current.chars, raws, verdict },
    ];
    setOutcomes(nextOutcomes);

    if (wordIndex + 1 < words.length) {
      setWordIndex((i) => i + 1);
      resetWord();
      return;
    }

    if (isFinishing.current) return;
    isFinishing.current = true;

    // Награда: опыт за каждое сданное слово, монеты — по доле сданных
    const passed = nextOutcomes.filter((o) => o.verdict === "passed").length;
    const accuracy = Math.round((passed / nextOutcomes.length) * 100);
    useProgressStore.getState().addXp(passed);
    useProgressStore.getState().addCoins(calculateCoinsEarned(accuracy));

    setPhase("finished");
  };

  const wordDone = phase === "word_result" || phase === "finished" ? 1 : 0;
  const progress =
    words.length === 0 ? 0 : ((wordIndex + wordDone) / words.length) * 100;

  return {
    isReady,
    hasWords: words.length > 0,
    word: current?.word,
    chars: current?.chars,
    charIndex,
    charData,
    phase,
    note,
    mistakes,
    /** Сколько ошибок ещё можно сделать в этом слове. */
    mistakesLeft: Math.max(0, ALLOWED_MISTAKES - mistakes),
    verdict,
    raws,
    /** Иероглифы слова, уже дописанные до текущего. */
    completedRaws: raws.slice(0, charIndex),
    rawStrokes: raws[charIndex] ?? [],
    progress,
    isLastWord: wordIndex + 1 >= words.length,
    outcomes,
    handleStroke,
    continueAfterResult,
  };
}
