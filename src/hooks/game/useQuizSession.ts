// src/hooks/game/useQuizSession.ts
//
// Общий «двигатель» тренировок с вопросами и вариантами ответа
// (флешкарты, тоны и будущие режимы того же вида).
//
// Хук отвечает только за ход сессии:
// - новый набор вопросов и новая игровая сессия при каждом входе на экран;
// - текущий вопрос, выбранный ответ, блокировка двойных нажатий;
// - пауза после ответа и переход к следующему вопросу;
// - запись ответа в gameStore (для экрана итогов);
// - вызов onFinish после последнего вопроса.
//
// Что считать правильным, что делать с прогрессом слова и какую давать награду,
// решает конкретная тренировка через колбэки.

import {
  useGameStore,
  type FlashcardQuestionResult,
} from "@/store/gameStore";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

/** Минимум, который нужен экрану итогов от любого вопроса. */
export interface QuizQuestionBase {
  vocabularyId: string;
  hanzi: string;
  pinyin: string;
  translation: string;
}

interface UseQuizSessionOptions<Q extends QuizQuestionBase, A> {
  /**
   * Ключ сессии: когда он меняется (например, другой набор),
   * сессия собирается заново. Вход на экран тоже всегда начинает новую.
   */
  sessionKey: string;
  /** Собирает вопросы. Вызывается при каждом входе на экран. */
  buildQuestions: () => Q[];
  isCorrect: (question: Q, answer: A) => boolean;
  /** Сразу после ответа: обновить прогресс слова и т.п. */
  onAnswer?: (question: Q, answer: A, isCorrect: boolean) => void;
  /** После последнего вопроса. Счёт и ответы уже лежат в gameStore. */
  onFinish: (questions: Q[]) => void;
  /** Сколько мс показывать результат ответа перед следующим вопросом. */
  advanceDelayMs?: number;
  /**
   * false — после ответа не переходим сами: экран зовёт next()
   * (самопроверка: нужно время прочитать перевод).
   */
  autoAdvance?: boolean;
  /** Дополнительные поля ответа для экрана итогов (например, ответ самопроверки). */
  resultExtra?: (question: Q, answer: A) => Partial<FlashcardQuestionResult>;
}

export function useQuizSession<Q extends QuizQuestionBase, A>({
  sessionKey,
  buildQuestions,
  isCorrect,
  onAnswer,
  onFinish,
  advanceDelayMs = 600,
  autoAdvance = true,
  resultExtra,
}: UseQuizSessionOptions<Q, A>) {
  const [questions, setQuestions] = useState<Q[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<A | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const isProcessingAnswer = useRef(false);
  /** Последний вопрос пройден, onFinish уже вызван — повторные next() не нужны. */
  const isFinished = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Колбэки держим в ref, чтобы сессия не пересобиралась на каждом рендере,
  // а таймер всегда вызывал свежие версии.
  const callbacks = useRef({
    buildQuestions,
    isCorrect,
    onAnswer,
    onFinish,
    resultExtra,
  });
  callbacks.current = {
    buildQuestions,
    isCorrect,
    onAnswer,
    onFinish,
    resultExtra,
  };

  const clearTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  // Экран может оставаться смонтированным между заходами,
  // поэтому новая сессия собирается при каждом входе
  useFocusEffect(
    useCallback(() => {
      setQuestions(callbacks.current.buildQuestions());
      useGameStore.getState().startGame();
      setCurrentIndex(0);
      setSelected(null);
      setIsAnswered(false);
      isProcessingAnswer.current = false;
      isFinished.current = false;

      // Ушли с экрана посреди паузы — не переходим к следующему вопросу за кадром
      return clearTimer;
    }, [sessionKey]),
  );

  useEffect(() => clearTimer, []);

  const currentQuestion: Q | undefined = questions[currentIndex];

  const goToNext = () => {
    timeoutRef.current = null;

    if (currentIndex >= questions.length - 1) {
      // На последнем вопросе клики так и остаются заблокированными
      isFinished.current = true;
      callbacks.current.onFinish(questions);
      return;
    }

    setSelected(null);
    setIsAnswered(false);
    setCurrentIndex((index) => index + 1);
    isProcessingAnswer.current = false;
  };

  const select = (answer: A) => {
    // Защита от быстрых повторных нажатий
    if (isProcessingAnswer.current || !currentQuestion) return;
    isProcessingAnswer.current = true;

    setSelected(answer);
    setIsAnswered(true);

    const correct = callbacks.current.isCorrect(currentQuestion, answer);

    useGameStore.getState().answerQuestion({
      vocabularyId: currentQuestion.vocabularyId,
      hanzi: currentQuestion.hanzi,
      pinyin: currentQuestion.pinyin,
      translation: currentQuestion.translation,
      isCorrect: correct,
      ...callbacks.current.resultExtra?.(currentQuestion, answer),
    });

    callbacks.current.onAnswer?.(currentQuestion, answer, correct);

    if (autoAdvance) timeoutRef.current = setTimeout(goToNext, advanceDelayMs);
  };

  /** Следующий вопрос вручную (при autoAdvance: false). */
  const next = () => {
    if (!isAnswered || timeoutRef.current || isFinished.current) return;
    goToNext();
  };

  const progressPercent =
    questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  return {
    questions,
    currentQuestion,
    currentIndex,
    totalQuestions: questions.length,
    selected,
    isAnswered,
    progressPercent,
    select,
    next,
  };
}
