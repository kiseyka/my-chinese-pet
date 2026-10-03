import { singleSyllableToneWords } from "@/content/tones/toneWords";
import { useSpeakHanzi } from "@/hooks/useSpeakHanzi";
import { useGameStore } from "@/store/gameStore";
import { useProgressStore } from "@/store/userProgressStore";
import { parsePinyin } from "@/utils/pinyinTones";
import { calculateToneCoinsEarned, calculateToneXp } from "@/utils/toneRewards";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

const TONE_SESSION_LENGTH = 20;
const TONE_OPTIONS = [1, 2, 3, 4];

function shuffle<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

interface ToneQuestionData {
  vocabularyId: string;
  hanzi: string;
  pinyin: string;
  blankedPinyin: string;
  translation: string;
  correctTone: number;
}

function buildSession(): ToneQuestionData[] {
  const pool = shuffle(singleSyllableToneWords).slice(0, TONE_SESSION_LENGTH);

  return pool.map((word) => {
    const { tones, blankedPinyin } = parsePinyin(word.pinyin);

    return {
      vocabularyId: word.vocabularyId,
      hanzi: word.hanzi,
      pinyin: word.pinyin,
      blankedPinyin,
      translation: word.translation,
      correctTone: tones[0],
    };
  });
}

export function useToneGame() {
  const router = useRouter();
  const { speak, speakForced } = useSpeakHanzi();

  const [questions, setQuestions] = useState<ToneQuestionData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedTone, setSelectedTone] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const score = useGameStore((s) => s.score);
  const startTime = useGameStore((s) => s.startTime);
  const startGame = useGameStore((s) => s.startGame);
  const answerQuestion = useGameStore((s) => s.answerQuestion);
  const setDuration = useGameStore((s) => s.setDuration);

  const isProcessingAnswer = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentQuestion = questions[currentIndex];

  useFocusEffect(
    useCallback(() => {
      setQuestions(buildSession());
      startGame();
      setCurrentIndex(0);
      setSelectedTone(null);
      setIsAnswered(false);
      isProcessingAnswer.current = false;
    }, [startGame]),
  );

  useEffect(() => {
    if (currentQuestion) {
      speakForced(currentQuestion.hanzi);
    }
  }, [currentQuestion?.hanzi]);

  const finishSession = () => {
    const duration = Date.now() - startTime;
    setDuration(duration);

    const totalQuestions = questions.length;
    const accuracy =
      totalQuestions === 0 ? 0 : Math.round((score / totalQuestions) * 100);

    const xpEarned = calculateToneXp(accuracy);
    const coinsEarned = calculateToneCoinsEarned(accuracy);

    useProgressStore.getState().addXp(xpEarned);
    useProgressStore.getState().addCoins(coinsEarned);

    router.replace({
      pathname: "/games/stats",
      params: {
        gameId: "tones",
        xpEarned: String(xpEarned),
        coinsEarned: String(coinsEarned),
      },
    });
  };

  const goToNext = () => {
    const isLast = currentIndex >= questions.length - 1;

    if (isLast) {
      finishSession();
      return;
    }

    setSelectedTone(null);
    setIsAnswered(false);
    setCurrentIndex((index) => index + 1);
    isProcessingAnswer.current = false;
  };

  const handleSelectTone = (tone: number) => {
    if (isProcessingAnswer.current || !currentQuestion) return;
    isProcessingAnswer.current = true;

    setSelectedTone(tone);
    setIsAnswered(true);

    const isCorrect = tone === currentQuestion.correctTone;

    answerQuestion({
      vocabularyId: currentQuestion.vocabularyId,
      hanzi: currentQuestion.hanzi,
      pinyin: currentQuestion.pinyin,
      translation: currentQuestion.translation,
      isCorrect,
    });

    timeoutRef.current = setTimeout(goToNext, 900);
  };

  const handlePlayAudio = () => {
    if (currentQuestion) speakForced(currentQuestion.hanzi);
  };

  const handlePlaySlowAudio = () => {
    if (currentQuestion) speakForced(currentQuestion.hanzi, { rate: 0.5 });
  };

  const progressPercent =
    questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  return {
    currentQuestion,
    currentIndex,
    totalQuestions: questions.length,
    selectedTone,
    isAnswered,
    progressPercent,
    toneOptions: TONE_OPTIONS,
    handleSelectTone,
    handlePlayAudio,
    handlePlaySlowAudio,
  };
}
