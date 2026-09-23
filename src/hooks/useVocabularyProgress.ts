//useVocabularyProgress.ts

import {
  loadProgress,
  toggleFavorite,
} from "@/services/storage/progressStorage";
import { GameState } from "@/types/progress";
import { useEffect, useState } from "react";

export function useVocabularyProgress() {
  const [progress, setProgress] = useState<GameState | null>(null);

  useEffect(() => {
    loadProgress().then(setProgress);
  }, []);

  const handleToggleFavorite = async (wordId: string) => {
    const updated = await toggleFavorite(wordId);

    setProgress((current) => {
      if (!current) return current;

      return {
        ...current,
        vocabulary: {
          ...current.vocabulary,
          words: {
            ...current.vocabulary.words,
            [wordId]: updated,
          },
        },
      };
    });

    return updated;
  };

  return {
    progress,
    toggleFavorite: handleToggleFavorite,
  };
}
