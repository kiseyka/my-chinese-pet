// store/gameStore.ts

import type { Href } from "expo-router";
import { create } from "zustand";

/** Где слово: ещё учится, в «Изученном» или в «Повторении». */
export type WordStatus = "learning" | "learned" | "review";

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

  /**
   * Где были слова до тренировки (только те, которых она коснулась).
   * Экран итогов сравнивает с тем, где они сейчас: «Перешли в изученные»,
   * «Вернулись в повторение». Заполняет utils/learning.ts.
   */
  statusBefore: Record<string, WordStatus>;
  /** Запоминает, где было слово до тренировки (только в первый раз). */
  rememberStatus: (wordId: string, status: WordStatus) => void;

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

  /**
   * Откуда брала слова последняя тренировка карточками (id источника: «path:1:0»,
   * набор, «review»…). По нему экран итогов решает, предложить ли письмо этого этапа.
   */
  lastSourceId: string | null;
  setLastSourceId: (id: string | null) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  score: 0,

  startTime: 0,

  duration: 0,

  results: [],

  writingResults: [],

  rewards: { xp: 0, coins: 0 },

  statusBefore: {},
  rememberStatus: (wordId, status) =>
    set((state) =>
      state.statusBefore[wordId]
        ? state
        : { statusBefore: { ...state.statusBefore, [wordId]: status } },
    ),

  startGame: () =>
    set({
      statusBefore: {},
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
      statusBefore: {},
      rewards: { xp: 0, coins: 0 },
      score: 0,
      startTime: 0,
      duration: 0,
      results: [],
      writingResults: [],
    }),

  returnTo: null,
  setReturnTo: (returnTo) => set({ returnTo }),

  lastSourceId: null,
  setLastSourceId: (lastSourceId) => set({ lastSourceId }),
}));
