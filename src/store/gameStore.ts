// store/gameStore.ts

import { create } from "zustand";

export interface FlashcardQuestionResult {
  vocabularyId: string;
  hanzi: string;
  pinyin: string;
  translation: string;
  isCorrect: boolean;
}

/** Точка линии пользователя в системе 1024×1024 (как в hanziData.json). */
export interface WritingPoint {
  x: number;
  y: number;
}

/** Написанное слово для экрана итогов письма. */
export interface WritingWordResult extends FlashcardQuestionResult {
  /** Линии пользователя по каждому иероглифу слова: [иероглиф][черта][точка]. */
  raws: WritingPoint[][][];
}

interface GameStore {
  score: number;
  startTime: number;
  duration: number;

  results: FlashcardQuestionResult[];

  /** Итоги последней тренировки письма: все написанные слова (не только ошибки). */
  writingResults: WritingWordResult[];

  startGame: () => void;

  answerQuestion: (result: FlashcardQuestionResult) => void;

  setWritingResults: (results: WritingWordResult[]) => void;

  setDuration: (duration: number) => void;

  resetGame: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  score: 0,

  startTime: 0,

  duration: 0,

  results: [],

  writingResults: [],

  startGame: () =>
    set({
      score: 0,
      results: [],
      writingResults: [],
      duration: 0,
      startTime: Date.now(),
    }),

  answerQuestion: (result) =>
    set((state) => ({
      score: result.isCorrect ? state.score + 1 : state.score,
      results: [...state.results, result],
    })),

  setWritingResults: (writingResults) => set({ writingResults }),

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
      writingResults: [],
    }),
}));
