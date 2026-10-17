// store/gameStore.ts

import type { Href } from "expo-router";
import { create } from "zustand";

/** Ответ в самопроверке карточек. */
export type SelfCheckAnswer = "know" | "unsure" | "dont";

export interface FlashcardQuestionResult {
  vocabularyId: string;
  hanzi: string;
  pinyin: string;
  translation: string;
  /** В самопроверке — «знаю». */
  isCorrect: boolean;
  /** Только в самопроверке: что ответил пользователь. */
  selfCheck?: SelfCheckAnswer;
}

/** Точка линии пользователя в системе 1024×1024 (как в hanziData.json). */
export interface WritingPoint {
  x: number;
  y: number;
}

/** Иероглиф внутри написанного слова, засчитанный как отдельное слово из базы. */
export interface WritingCharResult {
  vocabularyId: string;
  hanzi: string;
  pinyin: string;
  /** Точки письма до и после урока (0–3). */
  levelBefore: number;
  levelAfter: number;
}

/** Написанное слово для экрана итогов письма. */
export interface WritingWordResult extends FlashcardQuestionResult {
  /** Линии пользователя по каждому иероглифу слова: [иероглиф][черта][точка]. */
  raws: WritingPoint[][][];
  /** Точки письма слова до и после урока (0–3). */
  levelBefore: number;
  levelAfter: number;
  /** Иероглифы слова, которые есть в базе как отдельные слова (у слов из одного иероглифа — пусто). */
  characters: WritingCharResult[];
}

/** Что пользователь получил за тренировку (уже начислено в userProgressStore). */
export interface TrainingRewards {
  xp: number;
  coins: number;
}

interface GameStore {
  score: number;
  startTime: number;
  duration: number;

  results: FlashcardQuestionResult[];

  /** Итоги последней тренировки письма: все написанные слова (не только ошибки). */
  writingResults: WritingWordResult[];

  /** Награда за последнюю тренировку — экран итогов показывает её как есть. */
  rewards: TrainingRewards;

  startGame: () => void;

  answerQuestion: (result: FlashcardQuestionResult) => void;

  setWritingResults: (results: WritingWordResult[]) => void;

  setDuration: (duration: number) => void;

  setRewards: (rewards: TrainingRewards) => void;

  resetGame: () => void;

  /**
   * Куда ведёт «Продолжить» на экране итогов, если тренировку запустили не с экрана
   * своего режима (например, с пути). null — на экран режима (карточки, «Написание»).
   * Ставится перед запуском тренировки; экраны режимов сбрасывают его, когда открываются.
   */
  returnTo: Href | null;
  setReturnTo: (href: Href | null) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  score: 0,

  startTime: 0,

  duration: 0,

  results: [],

  writingResults: [],

  rewards: { xp: 0, coins: 0 },

  startGame: () =>
    set({
      score: 0,
      results: [],
      writingResults: [],
      rewards: { xp: 0, coins: 0 },
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

  setRewards: (rewards) => set({ rewards }),

  resetGame: () =>
    set({
      rewards: { xp: 0, coins: 0 },
      score: 0,
      startTime: 0,
      duration: 0,
      results: [],
      writingResults: [],
    }),

  returnTo: null,
  setReturnTo: (returnTo) => set({ returnTo }),
}));
