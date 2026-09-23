// store/vocabularyStore.ts
import {
  loadProgress,
  toggleFavorite as toggleFavoriteStorage,
} from "@/services/storage/progressStorage";
import { GameState } from "@/types/progress";
import { create } from "zustand";

interface VocabularyStore {
  progress: GameState | null;
  loaded: boolean;
  load: () => Promise<void>;
  toggleFavorite: (wordId: string) => Promise<void>;
}

export const useVocabularyStore = create<VocabularyStore>((set, get) => ({
  progress: null,
  loaded: false,

  load: async () => {
    const progress = await loadProgress();
    set({ progress, loaded: true });
  },

  toggleFavorite: async (wordId: string) => {
    let state = get();

    if (!state.progress) {
      await state.load();
      state = get();
    }

    if (!state.progress) return;

    const previous = state.progress.vocabulary.words[wordId];

    const updated = {
      isFavorite: !(previous?.isFavorite ?? false),
      isKnown: previous?.isKnown ?? false,
    };

    set({
      progress: {
        ...state.progress,
        vocabulary: {
          ...state.progress.vocabulary,
          words: {
            ...state.progress.vocabulary.words,
            [wordId]: updated,
          },
        },
      },
    });

    toggleFavoriteStorage(wordId).catch((err) => {
      console.error("Failed to persist favorite:", err);
    });
  },
}));
