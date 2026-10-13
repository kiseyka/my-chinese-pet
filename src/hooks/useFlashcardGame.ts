// src/hooks/useFlashcardGame.ts
//
// Флешкарты: иероглиф → выбрать перевод. Ход сессии — в useQuizSession,
// здесь только правила этой тренировки: вопросы, прогресс чтения, награда.
// Слова берутся из пользовательского набора («Мои наборы»).

import { generateQuiz } from "@/content/flashcards/generator";
import type { QuizQuestion } from "@/content/flashcards/types";
import { allWords, findWords } from "@/content/words/vocabulary";
import { useQuizSession } from "@/hooks/game/useQuizSession";
import {
  MIN_SET_WORDS,
  useCustomSet,
  useCustomSetsStore,
} from "@/store/customSetsStore";
import { useGameStore } from "@/store/gameStore";
import { useWordProgressStore } from "@/store/wordProgressStore";
import { calculateCoinsEarned } from "@/utils/calculateCoinsEarned";
import { finishTraining, getAccuracy } from "@/utils/finishTraining";
import { createWordChangeTracker } from "@/utils/wordChanges";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

interface UseFlashcardGameProps {
  setId: string;
}

export function useFlashcardGame({ setId }: UseFlashcardGameProps) {
  const { t } = useTranslation(["sets"]);
  const practiceSet = useCustomSet(setId);

  const wordChanges = useRef(createWordChangeTracker("reading")).current;

  const session = useQuizSession<QuizQuestion, string>({
    sessionKey: setId,

    buildQuestions: () => {
      wordChanges.reset();

      // Набор берём прямо из стора: на момент входа на экран он самый свежий
      const current = useCustomSetsStore
        .getState()
        .sets.find((set) => set.id === setId);
      const words = current ? findWords(current.wordIds) : [];
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
