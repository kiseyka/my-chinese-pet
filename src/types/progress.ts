// types/progress.ts

export interface GameState {
  user: {
    level: number;
    xp: number;

    learnedWords: string[];
  };

  flashcards: {
    levels: Record<string, FlashcardLevelStats>;
  };
}

export interface FlashcardLevelStats {
  bestScore: number;
  totalQuestions: number;

  accuracy: number;

  bestTime: number;

  completedAt: number;
}
