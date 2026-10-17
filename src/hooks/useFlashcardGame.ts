// src/hooks/useFlashcardGame.ts
//
// Флешкарты: иероглиф → выбрать перевод. Ход сессии — в useQuizSession,
// здесь только правила этой тренировки: вопросы, прогресс чтения, награда.
// Слова — из своего набора («Мои наборы») или ступени HSK (см. utils/flashcards/source.ts).

import { generateQuiz } from "@/content/flashcards/generator";
import type { QuizQuestion } from "@/content/flashcards/types";
import { allWords } from "@/content/words/vocabulary";
import { useQuizSession } from "@/hooks/game/useQuizSession";
import { MIN_SET_WORDS, useCustomSetsStore } from "@/store/customSetsStore";
import { useGameStore } from "@/store/gameStore";
import { useWordProgressStore } from "@/store/wordProgressStore";
import { calculateCoinsEarned } from "@/utils/calculateCoinsEarned";
import { resolveFlashcardSource } from "@/utils/flashcards/source";
import { finishTraining, getAccuracy } from "@/utils/finishTraining";
import { createWordChangeTracker } from "@/utils/wordChanges";
import { useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";

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

    buildQuestions: () => {
      wordChanges.reset();

      // Наборы берём прямо из стора: на момент входа на экран они самые свежие
      const current = resolveFlashcardSource(
        setId,
        useCustomSetsStore.getState().sets,
      );
      const words = current?.words ?? [];
      if (words.length < MIN_SET_WORDS) return [];

      // Новый набор вопросов при каждом входе на экран
      return generateQuiz(words, {
        extraPool: allWords,
        translate: (key) => t(key),
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

      useWordProgressStore.getState().completeFlashcardSet({
        setId,
        score,
        totalQuestions: total,
        duration: Date.now() - startTime,
      });

      finishTraining({
        gameId: "flashcards",
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
    handleSelect: session.select,
  };
}
