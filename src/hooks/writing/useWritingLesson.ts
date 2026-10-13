// src/hooks/writing/useWritingLesson.ts
//
// Ход урока письма. План (какие слова и в каком формате) приходит снаружи,
// поэтому тот же хук подходит для разных режимов тренировки.
//
// Структура: урок → слова → этапы → ячейки (иероглифы внутри этапа) → черты.

import { getHanzi } from "@/content/writing/hanzi";
import {
  useGameStore,
  type FlashcardQuestionResult,
  type WritingCharResult,
} from "@/store/gameStore";
import type { WordChange } from "@/store/pandaStore";
import { useWordProgressStore } from "@/store/wordProgressStore";
import type { HanziData } from "@/types/hanzi";
import { calculateCoinsEarned } from "@/utils/calculateCoinsEarned";
import { finishTraining, getAccuracy } from "@/utils/finishTraining";
import {
  checkStroke,
  type Point,
  type StrokeCheckReason,
} from "@/utils/strokeCheck";
import { readWordLevel } from "@/utils/wordLevel";
import {
  composeDeepItems,
  getCharacterWord,
  type LessonItem,
} from "@/utils/writingLessons";
import { buildStages, type WritingStage } from "@/utils/writingStages";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

/** Строгость проверки: 1 — обычная, меньше — строже, больше — мягче. */
const STRICTNESS_OUTLINE = 1;
const STRICTNESS_MEMORY = 1.15;

/** После скольких ошибок подряд на одной черте при письме по памяти раскрывается контур. */
const REVEAL_AFTER = 2;

/** Через сколько ошибок подряд дополнительно подсвечивается нужная черта. */
const HINT_AFTER_OUTLINE = 2;
const HINT_AFTER_MEMORY = 4;

/** Пауза после завершённого этапа или иероглифа, чтобы увидеть результат. */
const STAGE_DONE_DELAY = 500;

type Phase = "active" | "slot_done" | "stage_done" | "word_result";

interface LessonWord extends LessonItem {
  /** Данные о чертах каждого иероглифа слова. */
  chars: HanziData[];
  stages: WritingStage[];
}

interface CharOutcome {
  hanzi: string;
  /** Иероглиф написан на итоговом этапе без раскрытых подсказок. */
  success: boolean;
}

interface WordOutcome {
  word: LessonItem["word"];
  /** Линии пользователя на последнем этапе по каждому иероглифу (для экрана итогов). */
  raws: Point[][][];
  /** Слово написано на последнем этапе без раскрытых подсказок. */
  success: boolean;
  /**
   * Результат каждого иероглифа слова (только для слов из нескольких иероглифов,
   * повторяющийся иероглиф — один раз). Каждый получает точку как отдельный иероглиф:
   * под словом из базы или под «char:么», как в окне выбора.
   */
  chars: CharOutcome[];
  /** Это была работа над ошибками (в счёт урока не идёт). */
  deep: boolean;
  /** Слово нужно отправить на работу над ошибками, если не получилось. */
  retryDeep: boolean;
}

function prepare(plan: LessonItem[]): LessonWord[] {
  const words: LessonWord[] = [];

  for (const item of plan) {
    const chars = Array.from(item.word.hanzi).map((character) =>
      getHanzi(character),
    );

    // Слово без данных хотя бы об одном иероглифе пропускаем
    if (chars.length === 0 || chars.some((data) => !data)) continue;

    const data = chars as HanziData[];
    words.push({
      ...item,
      chars: data,
      stages: buildStages(data, item.format, Array.from(item.word.hanzi)),
    });
  }

  return words;
}

/** Результаты отдельных иероглифов слова по тому, где на итоговом этапе были подсказки. */
function charOutcomesOf(hanzi: string, assistedChars: number[]): CharOutcome[] {
  const list = Array.from(hanzi);
  if (list.length < 2) return [];

  return Array.from(new Set(list)).map((character) => ({
    hanzi: character,
    // Повторяющийся иероглиф засчитывается, только если все его вхождения без подсказок
    success: list.every(
      (c, index) => c !== character || !assistedChars.includes(index),
    ),
  }));
}

export function useWritingLesson(buildPlan: () => LessonItem[]) {
  const [words, setWords] = useState<LessonWord[]>([]);
  const [isReady, setIsReady] = useState(false);

  const [wordIndex, setWordIndex] = useState(0);
  const [stageIndex, setStageIndex] = useState(0);
  const [slotIndex, setSlotIndex] = useState(0);
  const [cursor, setCursor] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [revealed, setRevealed] = useState<number[]>([]);
  const [assisted, setAssisted] = useState(false);
  /** Номера иероглифов слова, в которых на итоговом этапе раскрывались подсказки. */
  const [assistedChars, setAssistedChars] = useState<number[]>([]);
  /** Принятые линии пользователя по ячейкам текущего этапа. */
  const [slotRaws, setSlotRaws] = useState<Point[][][]>([]);
  const [phase, setPhase] = useState<Phase>("active");
  const [lastReason, setLastReason] = useState<StrokeCheckReason | null>(null);
  /**
   * Черта проведена верно, но в стороне: один раз на черту подсвечиваем её без ошибки.
   * Сбрасывается, когда черта принята или начинается новая ячейка/этап.
   */
  const [softHint, setSoftHint] = useState(false);
  const [outcomes, setOutcomes] = useState<WordOutcome[]>([]);

  // Ref, а не state: защита от двойного нажатия «Завершить» срабатывает мгновенно
  const isFinishing = useRef(false);
  // Работа над ошибками добавляется в урок только один раз
  const deepAdded = useRef(false);
  // Уровни слов до начисления точек: нужны, чтобы показать, что изменилось
  const levelsBefore = useRef<Record<string, number>>({});

  const current = words[wordIndex];
  const stage = current?.stages[stageIndex];
  const slot = stage?.slots[slotIndex];
  const slotData = slot ? current?.chars[slot.charIndex] : undefined;

  const resetStage = (index: number) => {
    setStageIndex(index);
    setSlotIndex(0);
    setCursor(0);
    setMistakes(0);
    setRevealed([]);
    setSlotRaws([]);
    setLastReason(null);
    setSoftHint(false);
    setPhase("active");
  };

  /** Начало нового слова: сбрасываем подсказки слова. */
  const resetWordAssist = () => {
    setAssisted(false);
    setAssistedChars([]);
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
      resetWordAssist();
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

  // Короткая пауза после иероглифа или этапа, затем переход дальше
  useEffect(() => {
    if (phase !== "slot_done" && phase !== "stage_done") return;

    const timer = setTimeout(() => {
      if (phase === "slot_done") {
        setSlotIndex((i) => i + 1);
        setCursor(0);
        setMistakes(0);
        setRevealed([]);
        setLastReason(null);
        setSoftHint(false);
        setPhase("active");
      } else {
        resetStage(stageIndex + 1);
      }
    }, STAGE_DONE_DELAY);

    return () => clearTimeout(timer);
  }, [phase, stageIndex]);

  /** Конец показа написания: следующий иероглиф слова или следующий этап. */
  const finishDemo = () => {
    if (phase !== "active" || !stage || stage.mode !== "demo") return;

    if (slotIndex + 1 < stage.slots.length) {
      setSlotIndex((i) => i + 1);
      return;
    }

    resetStage(stageIndex + 1);
  };

  const handleStroke = (points: Point[]) => {
    if (
      phase !== "active" ||
      !current ||
      !stage ||
      !slot ||
      !slotData ||
      stage.mode === "demo"
    ) {
      return;
    }

    const strokeIndex = slot.strokeIndices[cursor];
    const result = checkStroke(
      points,
      slotData.medians[strokeIndex],
      stage.mode === "outline" ? STRICTNESS_OUTLINE : STRICTNESS_MEMORY,
    );

    if (result.ok) {
      const nextCursor = cursor + 1;

      setSlotRaws((prev) => {
        const next = [...prev];
        next[slotIndex] = [...(next[slotIndex] ?? []), points];
        return next;
      });
      setCursor(nextCursor);
      setMistakes(0);
      setLastReason(null);
      setSoftHint(false);

      if (nextCursor >= slot.strokeIndices.length) {
        if (slotIndex + 1 < stage.slots.length) {
          // Иероглиф дописан, впереди следующий иероглиф слова
          setPhase("slot_done");
        } else {
          setPhase(stage.isFinal ? "word_result" : "stage_done");
        }
      }
      return;
    }

    // Случайные касания за ошибку не считаем
    if (result.reason === "too_short") return;

    // Верная черта, но в стороне: в первый раз только подсвечиваем её, без ошибки
    if (result.reason === "wrong_position" && !softHint) {
      setSoftHint(true);
      setLastReason(result.reason);
      return;
    }

    const nextMistakes = mistakes + 1;
    setMistakes(nextMistakes);
    setLastReason(result.reason);

    // Письмо по памяти: если застрял, раскрываем контур нужной части
    if (stage.mode === "memory" && nextMistakes === REVEAL_AFTER) {
      const group = slot.revealGroups.find((g) => g.includes(strokeIndex)) ?? [
        strokeIndex,
      ];

      setRevealed((prev) => Array.from(new Set([...prev, ...group])));

      // Подсказки на последнем этапе значат, что слово (и этот иероглиф) написано с помощью
      if (stage.isFinal) {
        setAssisted(true);
        setAssistedChars((prev) =>
          prev.includes(slot.charIndex) ? prev : [...prev, slot.charIndex],
        );
      }
    }
  };

  const finishLesson = (allOutcomes: WordOutcome[]) => {
    const game = useGameStore.getState();
    const wordProgress = useWordProgressStore.getState();

    // Иероглиф как отдельное «слово» — так же, как в окне выбора:
    // слово из базы (你) или «char:么» со своим прогрессом
    const characterOf = (hanzi: string, parent: LessonItem["word"]) =>
      getCharacterWord(hanzi, parent);

    // 0. Уровни иероглифов до начисления точек (у слов урока они уже записаны в начале)
    for (const { word, chars } of allOutcomes) {
      for (const { hanzi } of chars) {
        const character = characterOf(hanzi, word);
        if (
          character &&
          levelsBefore.current[character.vocabularyId] === undefined
        ) {
          levelsBefore.current[character.vocabularyId] = readWordLevel(
            character.vocabularyId,
            "writing",
          );
        }
      }
    }

    // 1. Точки. Тренировка учебная: точки только прибавляются, за подсказки не снимаются.
    //    Каждое слово получает за урок не больше одной точки.
    const credited = new Set<string>();
    const credit = (wordId: string) => {
      if (credited.has(wordId)) return;
      credited.add(wordId);
      wordProgress.updateWordProgress({
        wordId,
        skill: "writing",
        isCorrect: true,
      });
    };

    // Слова, написанные без подсказок
    for (const { word, success } of allOutcomes) {
      if (success) credit(word.vocabularyId);
    }

    // Иероглифы внутри слов, написанные без подсказок
    for (const { word, chars } of allOutcomes) {
      for (const { hanzi, success } of chars) {
        if (!success) continue;
        const character = characterOf(hanzi, word);
        if (character) credit(character.vocabularyId);
      }
    }

    /** Точки слова «было → стало». */
    const levelChange = (wordId: string) => {
      const levelAfter = readWordLevel(wordId, "writing");
      const levelBefore = levelsBefore.current[wordId] ?? levelAfter;
      return { levelBefore, levelAfter };
    };

    // 2. В счёт урока идут основные задания, без работы над ошибками
    const scored = allOutcomes.filter((outcome) => !outcome.deep);

    const results: FlashcardQuestionResult[] = [];
    const wordChanges: WordChange[] = [];

    // Для экрана итогов: все написанные слова с линиями пользователя и точками,
    // у слов из нескольких иероглифов — ещё и точки каждого иероглифа
    game.setWritingResults(
      scored.map(({ word, success, raws, chars }) => ({
        vocabularyId: word.vocabularyId,
        hanzi: word.hanzi,
        pinyin: word.pinyin,
        translation: word.translation,
        isCorrect: success,
        raws,
        ...levelChange(word.vocabularyId),
        characters: chars.flatMap(({ hanzi }): WritingCharResult[] => {
          const character = characterOf(hanzi, word);
          if (!character) return [];
          return [
            {
              vocabularyId: character.vocabularyId,
              hanzi: character.hanzi,
              pinyin: character.pinyin,
              ...levelChange(character.vocabularyId),
            },
          ];
        }),
      })),
    );

    for (const { word, success } of scored) {
      const { levelBefore, levelAfter } = levelChange(word.vocabularyId);

      const result: FlashcardQuestionResult = {
        vocabularyId: word.vocabularyId,
        hanzi: word.hanzi,
        pinyin: word.pinyin,
        translation: word.translation,
        isCorrect: success,
      };

      game.answerQuestion(result);
      results.push(result);
      wordChanges.push({
        ...result,
        levelBefore: levelBefore as WordChange["levelBefore"],
        levelAfter: levelAfter as WordChange["levelAfter"],
      });
    }

    const { score } = useGameStore.getState();
    const total = scored.length;

    finishTraining({
      gameId: "writing",
      rewards: {
        xp: score,
        coins: calculateCoinsEarned(getAccuracy(score, total)),
      },
      pandaResult: {
        type: "writing_completed",
        score,
        total,
        results,
        wordChanges,
      },
    });
  };

  const continueAfterResult = () => {
    if (!current || isFinishing.current) return;

    const nextOutcomes: WordOutcome[] = [
      ...outcomes,
      {
        word: current.word,
        raws: slotRaws,
        success: !assisted,
        chars: charOutcomesOf(current.word.hanzi, assistedChars),
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
          resetWordAssist();
          resetStage(0);
          return;
        }
      }

      isFinishing.current = true;
      finishLesson(nextOutcomes);
      return;
    }

    setWordIndex((i) => i + 1);
    resetWordAssist();
    resetStage(0);
  };

  // Что показывать на холсте в текущей ячейке этапа
  const strokeIndices = slot?.strokeIndices ?? [];
  const outlineIndices =
    stage?.mode === "outline"
      ? strokeIndices
      : stage?.mode === "memory"
        ? revealed
        : [];
  const snappedIndices =
    stage?.mode === "outline" ? strokeIndices.slice(0, cursor) : [];
  const rawStrokes =
    stage?.mode === "memory" ? (slotRaws[slotIndex] ?? []) : [];

  const hintAfter =
    stage?.mode === "outline" ? HINT_AFTER_OUTLINE : HINT_AFTER_MEMORY;
  const hintIndex =
    stage &&
    stage.mode !== "demo" &&
    phase === "active" &&
    (softHint || mistakes >= hintAfter)
      ? strokeIndices[cursor]
      : null;

  // Уже написанные иероглифы слова в этом этапе (для небольшого превью над холстом)
  const completedSlots =
    stage && stage.mode !== "demo"
      ? stage.slots.slice(0, slotIndex).map((s, index) => ({
          charIndex: s.charIndex,
          raw: slotRaws[index] ?? [],
        }))
      : [];

  // Будет ли после этого слова работа над ошибками (чтобы кнопка не говорила «Завершить» зря)
  const deepPending =
    !deepAdded.current &&
    (outcomes.some((o) => !o.success && o.retryDeep) ||
      (assisted && current?.retryDeep === true));

  // Шкала урока: одно деление = один этап, считаются этапы всех слов.
  // Этап засчитывается сразу после завершения (во время паузы и на сравнении в конце слова).
  // Если добавилась работа над ошибками, делений становится больше.
  const totalStages = words.reduce((sum, w) => sum + w.stages.length, 0);
  const stagesBefore = words
    .slice(0, wordIndex)
    .reduce((sum, w) => sum + w.stages.length, 0);
  const stageFinished = phase === "stage_done" || phase === "word_result";
  const doneStages = stagesBefore + stageIndex + (stageFinished ? 1 : 0);
  const progress = totalStages === 0 ? 0 : (doneStages / totalStages) * 100;

  return {
    isReady,
    hasWords: words.length > 0,
    word: current?.word,
    chars: current?.chars,
    roleLabel: current?.roleLabel,
    stage,
    stageIndex,
    stageCount: current?.stages.length ?? 0,
    slot,
    slotData,
    slotIndex,
    slotCount: stage?.slots.length ?? 0,
    wordIndex,
    wordCount: words.length,
    /** Прогресс всего урока в процентах (0–100) для шкалы в шапке. */
    progress,
    phase,
    lastReason,
    assisted,
    /** Линии пользователя по каждому иероглифу слова (для сравнения в конце слова). */
    finalRaws: slotRaws,
    completedSlots,
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
