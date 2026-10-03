// src/store/pandaStore.ts

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { FlashcardQuestionResult } from "./gameStore";

export interface PandaTrainingResult {
  type: "flashcards_completed";

  score: number;
  total: number;

  results: FlashcardQuestionResult[];
}

const MAX_BOND = 100;
const RECENT_WORDS_LIMIT = 6;

interface PandaState {
  /** Привязанность: только растёт, никогда не уменьшается. Сохраняется. */
  bond: number;

  /** Последние слова, которые панда уже упоминала (защита от повторов). Сохраняется. */
  recentWordIds: string[];

  /** Результат последней тренировки, который панда ещё не прокомментировала. Не сохраняется. */
  pendingTrainingResult: PandaTrainingResult | null;
}

interface PandaActions {
  increaseBond: (amount: number) => void;
  rememberWord: (wordId: string) => void;
  setPendingTrainingResult: (result: PandaTrainingResult) => void;
  clearPendingTrainingResult: () => void;
}

type PandaStore = PandaState & PandaActions;

export const usePandaStore = create<PandaStore>()(
  persist(
    (set) => ({
      bond: 0,
      recentWordIds: [],
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

      setPendingTrainingResult: (result) =>
        set({ pendingTrainingResult: result }),

      clearPendingTrainingResult: () => set({ pendingTrainingResult: null }),
    }),
    {
      name: "panda-store",
      storage: createJSONStorage(() => AsyncStorage),
      // Персистим только то, что должно пережить перезапуск.
      partialize: (state) => ({
        bond: state.bond,
        recentWordIds: state.recentWordIds,
      }),
    },
  ),
);
