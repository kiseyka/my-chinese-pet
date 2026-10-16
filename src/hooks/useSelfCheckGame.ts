// src/hooks/useSelfCheckGame.ts
//
// Самопроверка карточками: иероглиф и пиньинь → «Знаю» / «Сомневаюсь» / «Не знаю»,
// потом показывается перевод, и пользователь сам идёт дальше.
// Слова — из тех же источников, что у выбора перевода (ступень, набор, «Повторение»).
//
// Точек чтения не даёт (они только за выбор перевода), опыта и монет тоже:
// ответ ничем не проверяется. Панде результат не передаём.

import type { Word } from "@/content/flashcards/types";
import { useQuizSession } from "@/hooks/game/useQuizSession";
import { MIN_SET_WORDS, useCustomSetsStore } from "@/store/customSetsStore";
import type { SelfCheckAnswer } from "@/store/gameStore";
import { resolveFlashcardSource } from "@/utils/flashcards/source";
import { finishTraining } from "@/utils/finishTraining";
import { shuffle } from "@/utils/shuffle";
import { useMemo } from "react";

/** Сколько слов в одной самопроверке — столько же, сколько в выборе перевода. */
const WORDS_PER_SESSION = 10;

/** Режим самопроверки в параметрах маршрута и экрана итогов. */
export const SELF_CHECK_MODE = "self";

export function useSelfCheckGame({ setId }: { setId: string }) {
  const customSets = useCustomSetsStore((state) => state.sets);
  const source = useMemo(
    () => resolveFlashcardSource(setId, customSets),
    [setId, customSets],
  );

  const session = useQuizSession<Word, SelfCheckAnswer>({
    sessionKey: `${setId}:${SELF_CHECK_MODE}`,
    autoAdvance: false,

    buildQuestions: () => {
      const current = resolveFlashcardSource(
        setId,
        useCustomSetsStore.getState().sets,
      );
      const words = current?.words ?? [];
      if (words.length < MIN_SET_WORDS) return [];
      return shuffle(words).slice(0, WORDS_PER_SESSION);
    },

    isCorrect: (_word, answer) => answer === "know",
    resultExtra: (_word, answer) => ({ selfCheck: answer }),

    onFinish: () => {
      finishTraining({
        gameId: "flashcards",
        mode: SELF_CHECK_MODE,
        rewards: { xp: 0, coins: 0 },
      });
    },
  });

  return {
    source,
    currentWord: session.currentQuestion,
    answer: session.selected,
    isAnswered: session.isAnswered,
    isLast: session.currentIndex >= session.totalQuestions - 1,
    progressPercent: session.progressPercent,
    choose: session.select,
    next: session.next,
  };
}
