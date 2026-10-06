// src/store/pandaStore.ts

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { FlashcardQuestionResult } from "./gameStore";
import type { WordLevel } from "./wordProgressStore";

/** Что случилось со словом за тренировку (первый уровень «до», последний «после»). */
export interface WordChange {
  vocabularyId: string;
  hanzi: string;
  pinyin: string;
  translation: string;
  levelBefore: WordLevel;
  levelAfter: WordLevel;
  /** Правильность последнего ответа на это слово. */
  isCorrect: boolean;
}

export interface PandaTrainingResult {
  type: "flashcards_completed" | "writing_completed";

  score: number;
  total: number;

  results: FlashcardQuestionResult[];
  wordChanges: WordChange[];
}

const MAX_BOND = 100;
const RECENT_WORDS_LIMIT = 6;

interface PandaState {
  /** Привязанность: только растёт, никогда не уменьшается. Сохраняется. */
  bond: number;

  /** Последние слова, которые панда уже упоминала (защита от повторов). Сохраняется. */
  recentWordIds: string[];

  /**
   * Сколько тренировок прошло с последнего диалога с кнопками выбора.
   * Выбор разрешён, когда значение >= 1 (то есть не чаще раза в две тренировки).
   * Сохраняется. Начальное значение 1: первый диалог может быть с выбором.
   */
  trainingsSinceChoice: number;

  /** Результат последней тренировки, который панда ещё не прокомментировала. Не сохраняется. */
  pendingTrainingResult: PandaTrainingResult | null;
}

interface PandaActions {
  increaseBond: (amount: number) => void;
  rememberWord: (wordId: string) => void;
  /** Вызывается после каждой тренировки: hadChoices — был ли диалог с кнопками. */
  registerTraining: (hadChoices: boolean) => void;
  setPendingTrainingResult: (result: PandaTrainingResult) => void;
  clearPendingTrainingResult: () => void;
}

type PandaStore = PandaState & PandaActions;

export const usePandaStore = create<PandaStore>()(
  persist(
    (set) => ({
      bond: 0,
      recentWordIds: [],
      trainingsSinceChoice: 1,
      pendingTrainingResult: null,

      increaseBond: (amount) =>
        set((state) => ({
          bond: Math.min(MAX_BOND, state.bond + Math.max(0, amount)),
        })),

      rememberWord: (wordId) =>
        set((state) => ({
          recentWordIds: [
            wordId,
            ...state.recentWordIds.filter((id) => id !== wordId),
          ].slice(0, RECENT_WORDS_LIMIT),
        })),

      registerTraining: (hadChoices) =>
        set((state) => ({
          trainingsSinceChoice: hadChoices ? 0 : state.trainingsSinceChoice + 1,
        })),

      setPendingTrainingResult: (result) =>
        set({ pendingTrainingResult: result }),

      clearPendingTrainingResult: () => set({ pendingTrainingResult: null }),
    }),
    {
      name: "panda-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        bond: state.bond,
        recentWordIds: state.recentWordIds,
        trainingsSinceChoice: state.trainingsSinceChoice,
      }),
    },
  ),
);
