// src/hooks/useFlashcardGame.ts
//
// Выбор перевода. Ход сессии — в useQuizSession, здесь только правила этой
// тренировки: вопросы, прогресс чтения, награда.
//
// Три вида вопроса:
//   прямой — иероглиф → выбрать перевод;
//   обратный — перевод → выбрать иероглиф из похожих (utils/readingExam.ts);
//   чтение — иероглиф → выбрать пиньинь, варианты отличаются тоном
//     (utils/pinyinVariants.ts).
// Новое слово (0 точек перевода) спрашивается только прямо; у слова с точками
// вид выбирается случайно из трёх. Все дают точку перевода.
// Неверные переводы в прямом вопросе — сначала из той же темы пути (по смыслу).
// После ответа вопрос сам не уходит: следующий — по кнопке «Продолжить» (next).
// Слова — из своего набора («Мои наборы») или ступени HSK (см. utils/flashcards/source.ts).

import { generateQuiz, type QuizAsk } from "@/content/flashcards/generator";
import type { QuizQuestion, Word } from "@/content/flashcards/types";
import { allWords } from "@/content/words/vocabulary";
import { useQuizSession } from "@/hooks/game/useQuizSession";
import { MIN_SET_WORDS, useCustomSetsStore } from "@/store/customSetsStore";
import { useGameStore } from "@/store/gameStore";
import { useWordProgressStore } from "@/store/wordProgressStore";
import { calculateCoinsEarned } from "@/utils/calculateCoinsEarned";
import { DAILY_READING_SOURCE, markDailyDone } from "@/utils/daily";
import { resolveFlashcardSource } from "@/utils/flashcards/source";
import { finishTraining, getAccuracy } from "@/utils/finishTraining";
import { buildPinyinVariants } from "@/utils/pinyinVariants";
import { buildReadingExamQuestion } from "@/utils/readingExam";
import { readWordLevel } from "@/utils/wordLevel";
import { getThemeMates } from "@/utils/wordThemes";
import { createWordChangeTracker } from "@/utils/wordChanges";
import { useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";

/**
 * Вид вопроса для слова. Новое — только прямой (null); знакомое (≥1 точки
 * перевода) — прямой, обратный или чтение поровну. Если для чтения не разобрать
 * пиньинь (слитный, «diàndòngchē»), — прямой.
 */
function pickAsk(word: Word, translate: (key: string) => string): QuizAsk | null {
  if (readWordLevel(word.vocabularyId, "reading") === 0) return null;
  const roll = Math.random();
  if (roll < 1 / 3) return null;
  if (roll < 2 / 3) {
    return {
      direction: "reverse",
      options: buildReadingExamQuestion(word, translate).options,
    };
  }
  const wrong = buildPinyinVariants(word.pinyin, word.hanzi);
  return wrong ? { direction: "pinyin", wrong } : null;
}

interface UseFlashcardGameProps {
  setId: string;
}

export function useFlashcardGame({ setId }: UseFlashcardGameProps) {
  const { t } = useTranslation(["sets"]);
  const customSets = useCustomSetsStore((state) => state.sets);
  const source = useMemo(
    () => resolveFlashcardSource(setId, customSets),
    [setId, customSets],
  );

  const wordChanges = useRef(createWordChangeTracker("reading")).current;

  const session = useQuizSession<QuizQuestion, string>({
    sessionKey: setId,
    autoAdvance: false,

    buildQuestions: () => {
      wordChanges.reset();

      // Наборы берём прямо из стора: на момент входа на экран они самые свежие
      const current = resolveFlashcardSource(
        setId,
        useCustomSetsStore.getState().sets,
      );
      const words = current?.words ?? [];
      // У слов дня их может быть 1–3: варианты ответа добираются из всей базы
      const minWords = setId === DAILY_READING_SOURCE ? 1 : MIN_SET_WORDS;
      if (words.length < minWords) return [];

      // Новый набор вопросов при каждом входе на экран
      const translate = (key: string) => t(key);
      return generateQuiz(words, {
        extraPool: allWords,
        translate,
        related: getThemeMates,
        ask: (word: Word) => pickAsk(word, translate),
      });
    },

    isCorrect: (question, option) => option === question.correctAnswer,

    onAnswer: (question, _option, isCorrect) => {
      wordChanges.answer(question, isCorrect);
    },

    onFinish: (questions) => {
      // Берём актуальные значения из стора: последний ответ уже записан
      const { score, startTime, results } = useGameStore.getState();
      const total = questions.length;
      useGameStore.getState().setLastSourceId(setId);
      // Слова дня: с этими словами сегодня занимались (точка за день — одна)
      markDailyDone(
        "reading",
        questions.map((question) => question.vocabularyId),
      );

      useWordProgressStore.getState().completeFlashcardSet({
        setId,
        score,
        totalQuestions: total,
        duration: Date.now() - startTime,
      });

      finishTraining({
        gameId: "flashcards",
        answers: total,
        rewards: {
          xp: score,
          coins: calculateCoinsEarned(getAccuracy(score, total)),
        },
        pandaResult: {
          type: "flashcards_completed",
          score,
          total,
          results,
          wordChanges: wordChanges.list(),
        },
      });
    },
  });

  return {
    source,
    questions: session.questions,
    currentQuestion: session.currentQuestion,
    currentIndex: session.currentIndex,
    selected: session.selected,
    isAnswered: session.isAnswered,
    progressPercent: session.progressPercent,
    isLast: session.currentIndex >= session.totalQuestions - 1,
    handleSelect: session.select,
    next: session.next,
  };
}
