// src/hooks/writing/useWritingLesson.ts
//
// Ход урока письма. План (какие слова и в каком формате) приходит снаружи,
// поэтому тот же хук подходит для разных режимов тренировки.

import { getHanzi } from "@/content/writing/hanzi";
import { useGameStore, type FlashcardQuestionResult } from "@/store/gameStore";
import { usePandaStore, type WordChange } from "@/store/pandaStore";
import { useProgressStore } from "@/store/userProgressStore";
import { useWordProgressStore } from "@/store/wordProgressStore";
import type { HanziData } from "@/types/hanzi";
import { calculateCoinsEarned } from "@/utils/calculateCoinsEarned";
import {
  checkStroke,
  type Point,
  type StrokeCheckReason,
} from "@/utils/strokeCheck";
import { readWordLevel } from "@/utils/wordLevel";
import { composeDeepItems, type LessonItem } from "@/utils/writingLessons";
import { buildStages, type WritingStage } from "@/utils/writingStages";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

/** Строгость проверки: 1 — обычная, меньше — строже, больше — мягче. */
const STRICTNESS_OUTLINE = 1;
const STRICTNESS_MEMORY = 1.15;

/** После скольких ошибок подряд на одной черте при письме по памяти раскрывается контур. */
const REVEAL_AFTER = 2;

/** Через сколько ошибок подряд дополнительно подсвечивается нужная черта. */
const HINT_AFTER_OUTLINE = 2;
const HINT_AFTER_MEMORY = 4;

/** Пауза после завершённого этапа, чтобы увидеть результат. */
const STAGE_DONE_DELAY = 500;

type Phase = "active" | "stage_done" | "word_result";

interface LessonWord extends LessonItem {
  data: HanziData;
  stages: WritingStage[];
}

interface WordOutcome {
  word: LessonItem["word"];
  /** Слово написано на последнем этапе без раскрытых подсказок. */
  success: boolean;
  /** Это была работа над ошибками (в счёт урока не идёт). */
  deep: boolean;
  /** Слово нужно отправить на работу над ошибками, если не получилось. */
  retryDeep: boolean;
}

function prepare(plan: LessonItem[]): LessonWord[] {
  const words: LessonWord[] = [];

  for (const item of plan) {
    const data = getHanzi(item.word.hanzi);
    if (data) {
      words.push({ ...item, data, stages: buildStages(data, item.format) });
    }
  }

  return words;
}

export function useWritingLesson(buildPlan: () => LessonItem[]) {
  const router = useRouter();

  const [words, setWords] = useState<LessonWord[]>([]);
  const [isReady, setIsReady] = useState(false);

  const [wordIndex, setWordIndex] = useState(0);
  const [stageIndex, setStageIndex] = useState(0);
  const [cursor, setCursor] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [revealed, setRevealed] = useState<number[]>([]);
  const [assisted, setAssisted] = useState(false);
  const [stageRaw, setStageRaw] = useState<Point[][]>([]);
  const [phase, setPhase] = useState<Phase>("active");
  const [lastReason, setLastReason] = useState<StrokeCheckReason | null>(null);
  const [outcomes, setOutcomes] = useState<WordOutcome[]>([]);

  // Ref, а не state: защита от двойного нажатия «Завершить» срабатывает мгновенно
  const isFinishing = useRef(false);
  // Работа над ошибками добавляется в урок только один раз
  const deepAdded = useRef(false);
  // Уровни слов в начале урока: нужны, чтобы показать, что изменилось
  const levelsBefore = useRef<Record<string, number>>({});

  const current = words[wordIndex];
  const stage = current?.stages[stageIndex];

  const resetStage = (index: number) => {
    setStageIndex(index);
    setCursor(0);
    setMistakes(0);
    setRevealed([]);
    setStageRaw([]);
    setLastReason(null);
    setPhase("active");
  };

  // Экран может оставаться смонтированным между заходами, поэтому
  // новый урок собираем при каждом входе на экран
  useFocusEffect(
    useCallback(() => {
      const prepared = prepare(buildPlan());

      levelsBefore.current = Object.fromEntries(
        prepared.map((item) => [
          item.word.vocabularyId,
          readWordLevel(item.word.vocabularyId, "writing"),
        ]),
      );

      setWords(prepared);
      setWordIndex(0);
      setAssisted(false);
      setOutcomes([]);
      isFinishing.current = false;
      deepAdded.current = false;
      resetStage(0);
      setIsReady(true);

      useGameStore.getState().startGame();

      // При уходе с экрана прячем урок, чтобы при возвращении не мелькало старое состояние
      return () => setIsReady(false);
    }, [buildPlan]),
  );

  // После завершённого (не последнего) этапа переходим к следующему
  useEffect(() => {
    if (phase !== "stage_done") return;

    const timer = setTimeout(
      () => resetStage(stageIndex + 1),
      STAGE_DONE_DELAY,
    );

    return () => clearTimeout(timer);
  }, [phase, stageIndex]);

  /** Конец показа написания: переходим к следующему этапу. */
  const finishDemo = () => {
    if (phase !== "active" || stage?.mode !== "demo") return;
    resetStage(stageIndex + 1);
  };

  const handleStroke = (points: Point[]) => {
    if (phase !== "active" || !current || !stage || stage.mode === "demo") {
      return;
    }

    const strokeIndex = stage.strokeIndices[cursor];
    const result = checkStroke(
      points,
      current.data.medians[strokeIndex],
      stage.mode === "outline" ? STRICTNESS_OUTLINE : STRICTNESS_MEMORY,
    );

    if (result.ok) {
      const nextCursor = cursor + 1;

      setStageRaw((prev) => [...prev, points]);
      setCursor(nextCursor);
      setMistakes(0);
      setLastReason(null);

      if (nextCursor >= stage.strokeIndices.length) {
        setPhase(stage.isFinal ? "word_result" : "stage_done");
      }
      return;
    }

    // Случайные касания за ошибку не считаем
    if (result.reason === "too_short") return;

    const nextMistakes = mistakes + 1;
    setMistakes(nextMistakes);
    setLastReason(result.reason);

    // Письмо по памяти: если застрял, раскрываем контур нужной части
    if (stage.mode === "memory" && nextMistakes === REVEAL_AFTER) {
      const group = stage.revealGroups.find((g) => g.includes(strokeIndex)) ?? [
        strokeIndex,
      ];

      setRevealed((prev) => Array.from(new Set([...prev, ...group])));

      // Подсказки на последнем этапе значат, что слово написано с помощью
      if (stage.isFinal) setAssisted(true);
    }
  };

  const finishLesson = (allOutcomes: WordOutcome[]) => {
    const game = useGameStore.getState();
    const wordProgress = useWordProgressStore.getState();

    // 1. Слово, написанное без подсказок, получает точку.
    //    С подсказками точки не меняются: тренировка учебная, а не проверка.
    for (const { word, success } of allOutcomes) {
      if (success) {
        wordProgress.updateWordProgress({
          wordId: word.vocabularyId,
          skill: "writing",
          isCorrect: true,
        });
      }
    }

    // 2. В счёт урока идут основные задания, без работы над ошибками
    const scored = allOutcomes.filter((outcome) => !outcome.deep);

    const results: FlashcardQuestionResult[] = [];
    const wordChanges: WordChange[] = [];

    for (const { word, success } of scored) {
      const levelAfter = readWordLevel(word.vocabularyId, "writing");
      const levelBefore = (levelsBefore.current[word.vocabularyId] ??
        levelAfter) as WordChange["levelBefore"];

      const result: FlashcardQuestionResult = {
        vocabularyId: word.vocabularyId,
        hanzi: word.hanzi,
        pinyin: word.pinyin,
        translation: word.translation,
        isCorrect: success,
      };

      game.answerQuestion(result);
      results.push(result);
      wordChanges.push({ ...result, levelBefore, levelAfter });
    }

    const { score, startTime } = useGameStore.getState();
    game.setDuration(Date.now() - startTime);

    const total = scored.length;
    const accuracy = total === 0 ? 0 : Math.round((score / total) * 100);

    useProgressStore.getState().addXp(score);
    useProgressStore.getState().addCoins(calculateCoinsEarned(accuracy));

    usePandaStore.getState().setPendingTrainingResult({
      type: "writing_completed",
      score,
      total,
      results,
      wordChanges,
    });

    router.replace({
      pathname: "/games/stats",
      params: { gameId: "writing" },
    });
  };

  const continueAfterResult = () => {
    if (!current || isFinishing.current) return;

    const nextOutcomes: WordOutcome[] = [
      ...outcomes,
      {
        word: current.word,
        success: !assisted,
        deep: current.isDeep === true,
        retryDeep: current.retryDeep === true,
      },
    ];
    setOutcomes(nextOutcomes);

    if (wordIndex + 1 >= words.length) {
      // Конец списка: слова, не написанные без подсказок, получают работу над ошибками
      if (!deepAdded.current) {
        deepAdded.current = true;
        const deepWords = prepare(composeDeepItems(nextOutcomes));

        if (deepWords.length > 0) {
          setWords((prev) => [...prev, ...deepWords]);
          setWordIndex((i) => i + 1);
          setAssisted(false);
          resetStage(0);
          return;
        }
      }

      isFinishing.current = true;
      finishLesson(nextOutcomes);
      return;
    }

    setWordIndex((i) => i + 1);
    setAssisted(false);
    resetStage(0);
  };

  // Что показывать на холсте на текущем этапе
  const strokeIndices = stage?.strokeIndices ?? [];
  const outlineIndices =
    stage?.mode === "outline"
      ? strokeIndices
      : stage?.mode === "memory"
        ? revealed
        : [];
  const snappedIndices =
    stage?.mode === "outline" ? strokeIndices.slice(0, cursor) : [];
  const rawStrokes = stage?.mode === "memory" ? stageRaw : [];

  const hintAfter =
    stage?.mode === "outline" ? HINT_AFTER_OUTLINE : HINT_AFTER_MEMORY;
  const hintIndex =
    stage &&
    stage.mode !== "demo" &&
    phase === "active" &&
    mistakes >= hintAfter
      ? strokeIndices[cursor]
      : null;

  // Будет ли после этого слова работа над ошибками (чтобы кнопка не говорила «Завершить» зря)
  const deepPending =
    !deepAdded.current &&
    (outcomes.some((o) => !o.success && o.retryDeep) ||
      (assisted && current?.retryDeep === true));

  return {
    isReady,
    hasWords: words.length > 0,
    word: current?.word,
    data: current?.data,
    roleLabel: current?.roleLabel,
    stage,
    stageIndex,
    stageCount: current?.stages.length ?? 0,
    wordIndex,
    wordCount: words.length,
    phase,
    lastReason,
    assisted,
    finalRaw: stageRaw,
    isLastWord: wordIndex + 1 >= words.length && !deepPending,
    outlineIndices,
    snappedIndices,
    rawStrokes,
    hintIndex,
    handleStroke,
    finishDemo,
    continueAfterResult,
  };
}
