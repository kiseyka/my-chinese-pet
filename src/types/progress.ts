// types/progress.ts

export type WordProgress = {
  wordId: string;
  reading: SkillProgress; // тренировки на чтение (flashcards и будущие)
  writing: SkillProgress; // тренировки на написание (когда добавишь)
  lastAnsweredAt: number;
};
export type SkillProgress = {
  streak: number; // 0-3, "заморожен" на 3 после освоения навыка
  correctAnswers: number; // для статистики, не влияет на streak после заморозки
  incorrectAnswers: number;
};

export type MasteryBucket = "new" | "seen" | "recognizing" | "learned";

export type FlashcardSetProgress = {
  bestScore: number;
  totalQuestions: number;
  accuracy: number;
  bestTime: number;
  completedAt: number;
};

export type VocabularyWordProgress = {
  isFavorite: boolean;
  isKnown: boolean; // ручная отметка "уже знаю" (онбординг для опытных)
};

export type VocabularyProgress = {
  words: Record<string, VocabularyWordProgress>;
};

export type GameState = {
  user: {
    xp: number;
  };

  flashcards: {
    sets: Record<string, FlashcardSetProgress>;
    words: Record<string, WordProgress>;
  };

  vocabulary: VocabularyProgress;
};
