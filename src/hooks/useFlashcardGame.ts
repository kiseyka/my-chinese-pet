// src/hooks/useFlashcardGame.ts
//
// Флешкарты: иероглиф → выбрать перевод. Ход сессии — в useQuizSession,
// здесь только правила этой тренировки: вопросы, прогресс чтения, награда.

import { generateQuiz } from "@/content/flashcards/generator";
import { practiceSets } from "@/content/flashcards/sets";
import type { QuizQuestion } from "@/content/flashcards/types";
import { useQuizSession } from "@/hooks/game/useQuizSession";
import { useGameStore } from "@/store/gameStore";
import { useWordProgressStore } from "@/store/wordProgressStore";
import { calculateCoinsEarned } from "@/utils/calculateCoinsEarned";
import { finishTraining, getAccuracy } from "@/utils/finishTraining";
import { createWordChangeTracker } from "@/utils/wordChanges";
import { useRef } from "react";

interface UseFlashcardGameProps {
  setId: string;
}

export function useFlashcardGame({ setId }: UseFlashcardGameProps) {
  const practiceSet = practiceSets.find((set) => set.id === setId);

  const wordChanges = useRef(createWordChangeTracker("reading")).current;

  const session = useQuizSession<QuizQuestion, string>({
    sessionKey: setId,

    buildQuestions: () => {
      wordChanges.reset();
      // Новый набор вопросов при каждом входе на экран
      return practiceSet ? generateQuiz(practiceSet.words) : [];
    },

    isCorrect: (question, option) => option === question.correctAnswer,

    onAnswer: (question, _option, isCorrect) => {
      wordChanges.answer(question, isCorrect);
    },

    onFinish: (questions) => {
      if (!practiceSet) return;

      // Берём актуальные значения из стора: последний ответ уже записан
      const { score, startTime, results } = useGameStore.getState();
      const total = questions.length;

      useWordProgressStore.getState().completeFlashcardSet({
        setId: practiceSet.id,
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
    practiceSet,
    questions: session.questions,
    currentQuestion: session.currentQuestion,
    currentIndex: session.currentIndex,
    selected: session.selected,
    isAnswered: session.isAnswered,
    progressPercent: session.progressPercent,
    handleSelect: session.select,
  };
}
