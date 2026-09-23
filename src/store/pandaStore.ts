// src/store/pandaStore.ts

import { create } from "zustand";
import type { FlashcardQuestionResult } from "./gameStore";

export interface PandaTrainingResult {
  type: "flashcards_completed";

  score: number;
  total: number;

  results: FlashcardQuestionResult[];
}

interface PandaStore {
  pendingTrainingResult: PandaTrainingResult | null;

  setPendingTrainingResult: (result: PandaTrainingResult) => void;
  bond: number;
  increaseBond: (amount: number) => void;
  clearPendingTrainingResult: () => void;
}

export const usePandaStore = create<PandaStore>((set) => ({
  pendingTrainingResult: null,

  setPendingTrainingResult: (result) =>
    set({
      pendingTrainingResult: result,
    }),

  clearPendingTrainingResult: () =>
    set({
      pendingTrainingResult: null,
    }),
  bond: 0,

  increaseBond: (amount) =>
    set((state) => ({
      bond: Math.min(100, state.bond + amount),
    })),
}));
