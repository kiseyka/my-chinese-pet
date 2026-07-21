// hooks/game/useFlashcardGame.ts

import { generateQuiz } from "@/content/flashcards/generator";
import { practiceSets } from "@/content/flashcards/sets";
import { QuizQuestion } from "@/content/flashcards/types";
import { completeFlashcardLevel } from "@/services/storage/progressStorage";
import { useGameStore } from "@/store/gameStore";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

interface UseFlashcardGameProps {
  setId: string;
}

export function useFlashcardGame({ setId }: UseFlashcardGameProps) {
  const router = useRouter();
  const practiceSet = practiceSets.find((set) => set.id === setId);

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);

  const score = useGameStore((s) => s.score);
  const startTime = useGameStore((s) => s.startTime);

  const startGame = useGameStore((s) => s.startGame);
  const answerQuestion = useGameStore((s) => s.answerQuestion);
  const setDuration = useGameStore((s) => s.setDuration);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const isProcessingAnswer = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentQuestion = questions[currentIndex];

  useFocusEffect(
    useCallback(() => {
      if (!practiceSet) {
        setQuestions([]);
        return;
      }

      // Новый набор вопросов при каждом входе на экран
      setQuestions(generateQuiz(practiceSet.words));

      // Новая игровая сессия
      startGame();
      setCurrentIndex(0);
      setSelected(null);
      setIsAnswered(false);

      isProcessingAnswer.current = false;
    }, [setId, startGame]),
  );

  // Очищаем таймер при размонтировании
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const finishLevel = async () => {
    if (!practiceSet) return;

    const duration = Date.now() - startTime;

    setDuration(duration);

    await completeFlashcardLevel({
      levelId: practiceSet.id,
      score,
      totalQuestions: questions.length,
      duration,
    });

    router.replace({
      pathname: "/games/stats",
      params: {
        gameId: "flashcards",
        xp: practiceSet.xpReward,
      },
    });
  };

  const handleAnswer = async () => {
    const isLast = currentIndex >= questions.length - 1;

    if (isLast) {
      // На последнем вопросе больше не принимаем клики
      await finishLevel();
      return;
    }

    setSelected(null);
    setIsAnswered(false);
    setCurrentIndex((index) => index + 1);

    // Разблокируем ответ для нового вопроса
    isProcessingAnswer.current = false;
  };

  const handleSelect = (option: string) => {
    // Защита от быстрых повторных кликов
    if (isProcessingAnswer.current) {
      return;
    }

    isProcessingAnswer.current = true;

    setSelected(option);
    setIsAnswered(true);

    const isCorrect = option === currentQuestion.correctAnswer;

    answerQuestion({
      hanzi: currentQuestion.hanzi,
      pinyin: currentQuestion.pinyin,
      translation: currentQuestion.correctAnswer,
      isCorrect,
    });

    timeoutRef.current = setTimeout(() => {
      handleAnswer();
    }, 600);
  };

  const progressPercent =
    questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  return {
    practiceSet,
    questions,
    currentQuestion,
    currentIndex,
    selected,
    isAnswered,
    progressPercent,
    handleSelect,
  };
}
