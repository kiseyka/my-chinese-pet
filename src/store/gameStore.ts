// store/gameStore.ts

import { create } from "zustand";

export interface FlashcardQuestionResult {
  hanzi: string;
  pinyin: string;
  translation: string;
  isCorrect: boolean;
}

interface GameStore {
  score: number;
  startTime: number;
  duration: number;

  results: FlashcardQuestionResult[];

  startGame: () => void;

  answerQuestion: (result: FlashcardQuestionResult) => void;

  setDuration: (duration: number) => void;

  resetGame: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  score: 0,

  startTime: 0,

  duration: 0,

  results: [],

  startGame: () =>
    set({
      score: 0,
      results: [],
      duration: 0,
      startTime: Date.now(),
    }),

  answerQuestion: (result) =>
    set((state) => ({
      score: result.isCorrect ? state.score + 1 : state.score,
      results: [...state.results, result],
    })),

  setDuration: (duration) =>
    set({
      duration,
    }),

  resetGame: () =>
    set({
      score: 0,
      startTime: 0,
      duration: 0,
      results: [],
    }),
}));
