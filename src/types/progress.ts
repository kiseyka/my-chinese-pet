export type WordProgress = {
  wordId: string;

  correctAnswers: number;
  incorrectAnswers: number;

  mastery: 0 | 1 | 2 | 3 | 4 | 5;

  lastAnsweredAt: number;
};

export type FlashcardSetProgress = {
  bestScore: number;
  totalQuestions: number;
  accuracy: number;
  bestTime: number;
  completedAt: number;
};

export type GameState = {
  user: {
    level: number;
    xp: number;
  };

  flashcards: {
    sets: Record<string, FlashcardSetProgress>;
    words: Record<string, WordProgress>;
  };
};
