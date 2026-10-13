// src/hooks/useToneGame.ts
//
// Тоны: послушать слог → выбрать тон. Ход сессии — в useQuizSession,
// здесь только правила этой тренировки: вопросы, звук, награда.

import { singleSyllableToneWords } from "@/content/tones/toneWords";
import { useQuizSession } from "@/hooks/game/useQuizSession";
import { useSpeakHanzi } from "@/hooks/useSpeakHanzi";
import { useGameStore } from "@/store/gameStore";
import { finishTraining, getAccuracy } from "@/utils/finishTraining";
import { parsePinyin } from "@/utils/pinyinTones";
import { shuffle } from "@/utils/shuffle";
import { calculateToneCoinsEarned, calculateToneXp } from "@/utils/toneRewards";
import { useEffect } from "react";

const TONE_SESSION_LENGTH = 20;
const TONE_OPTIONS = [1, 2, 3, 4];

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
  const { speakForced } = useSpeakHanzi();

  const session = useQuizSession<ToneQuestionData, number>({
    sessionKey: "tones",
    buildQuestions: buildSession,
    isCorrect: (question, tone) => tone === question.correctTone,
    advanceDelayMs: 900,

    onFinish: (questions) => {
      const { score } = useGameStore.getState();
      const accuracy = getAccuracy(score, questions.length);

      finishTraining({
        gameId: "tones",
        rewards: {
          xp: calculateToneXp(accuracy),
          coins: calculateToneCoinsEarned(accuracy),
        },
      });
    },
  });

  const { currentQuestion } = session;

  // Каждый новый вопрос сразу проигрываем (даже при выключенном звуке)
  useEffect(() => {
    if (currentQuestion) speakForced(currentQuestion.hanzi);
  }, [currentQuestion?.hanzi]);

  const handlePlayAudio = () => {
    if (currentQuestion) speakForced(currentQuestion.hanzi);
  };

  const handlePlaySlowAudio = () => {
    if (currentQuestion) speakForced(currentQuestion.hanzi, { rate: 0.5 });
  };

  return {
    currentQuestion,
    currentIndex: session.currentIndex,
    totalQuestions: session.totalQuestions,
    selectedTone: session.selected,
    isAnswered: session.isAnswered,
    progressPercent: session.progressPercent,
    toneOptions: TONE_OPTIONS,
    handleSelectTone: session.select,
    handlePlayAudio,
    handlePlaySlowAudio,
  };
}
