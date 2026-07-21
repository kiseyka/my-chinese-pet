import { GameState } from "@/types/progress";

export const DEFAULT_PROGRESS: GameState = {
  user: {
    level: 1,
    xp: 0,

    learnedWords: [],
  },

  flashcards: {
    levels: {},
  },
};
