import { practiceSets } from "@/content/flashcards/sets";
import { mergeAliasedProgress } from "@/store/migrations/mergeAliasedProgress";
import { useProgressStore } from "@/store/userProgressStore";
import { MasteryBucket, SkillProgress, WordProgress } from "@/types/progress";
import { calculateCoinsEarned } from "@/utils/calculateCoinsEarned";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
interface FlashcardSetProgress {
  bestScore: number;
  totalQuestions: number;
  accuracy: number;
  bestTime: number;
  completedAt: number;
}

interface VocabularyWordProgress {
  isFavorite: boolean;
  isKnown: boolean;
}

/** Слово в списке «Повторение» режима «Написание». */
interface WritingReviewEntry {
  addedAt: number;
}

interface WordProgressState {
  flashcardSets: Record<string, FlashcardSetProgress>;
  flashcardWords: Record<string, WordProgress>;
  vocabularyWords: Record<string, VocabularyWordProgress>;
  /**
   * «Повторение» в письме: слова и иероглифы (id вида «char:么»), которые пользователь
   * хочет отработать. Отдельно от избранного словаря: это временный список.
   */
  writingReview: Record<string, WritingReviewEntry>;
}

interface WordProgressActions {
  completeFlashcardSet: (params: {
    setId: string;
    score: number;
    totalQuestions: number;
    duration: number;
  }) => void;
  updateWordProgress: (params: {
    wordId: string;
    skill: "reading" | "writing";
    isCorrect: boolean;
  }) => void;
  updateVocabularyWordProgress: (params: {
    wordId: string;
    isFavorite?: boolean;
    isKnown?: boolean;
  }) => void;
  toggleFavorite: (wordId: string) => void;
  /** Добавляет слово в «Повторение» письма или убирает оттуда. */
  toggleWritingReview: (wordId: string) => void;
  removeFromWritingReview: (wordId: string) => void;
  reset: () => void;
}

type WordProgressStore = WordProgressState & WordProgressActions;

const createDefaultSkillProgress = (): SkillProgress => ({
  streak: 0,
  correctAnswers: 0,
  incorrectAnswers: 0,
});

function applySkillAnswer(
  skill: SkillProgress,
  isCorrect: boolean,
): SkillProgress {
  if (isCorrect) {
    return {
      ...skill,
      correctAnswers: skill.correctAnswers + 1,
      streak: Math.min(skill.streak + 1, 3),
    };
  }

  // Ошибка. Если навык уже освоен (streak === 3) — не откатываем.
  const nextStreak = skill.streak === 3 ? 3 : Math.max(skill.streak - 1, 0);

  return {
    ...skill,
    incorrectAnswers: skill.incorrectAnswers + 1,
    streak: nextStreak,
  };
}

export const useWordProgressStore = create<WordProgressStore>()(
  persist(
    (set) => ({
      flashcardSets: {},
      flashcardWords: {},
      vocabularyWords: {},
      writingReview: {},

      completeFlashcardSet: ({ setId, score, totalQuestions, duration }) => {
        const practiceSet = practiceSets.find((s) => s.id === setId);

        if (!practiceSet) {
          throw new Error(`Practice Set not found: ${setId}`);
        }

        const accuracy =
          totalQuestions === 0 ? 0 : Math.round((score / totalQuestions) * 100);

        set((state) => {
          const previous = state.flashcardSets[setId];

          const updated: FlashcardSetProgress = previous
            ? {
                bestScore: Math.max(previous.bestScore, score),
                totalQuestions,
                accuracy: Math.max(previous.accuracy, accuracy),
                bestTime: Math.min(previous.bestTime, duration),
                completedAt: Date.now(),
              }
            : {
                bestScore: score,
                totalQuestions,
                accuracy,
                bestTime: duration,
                completedAt: Date.now(),
              };

          return {
            flashcardSets: { ...state.flashcardSets, [setId]: updated },
          };
        });

        // xp/монеты по-прежнему считает отдельный стор
        useProgressStore.getState().addXp(score);
        useProgressStore.getState().addCoins(calculateCoinsEarned(accuracy));
      },

      updateWordProgress: ({ wordId, skill, isCorrect }) => {
        set((state) => {
          const previous = state.flashcardWords[wordId] ?? {
            wordId,
            reading: createDefaultSkillProgress(),
            writing: createDefaultSkillProgress(),
            lastAnsweredAt: Date.now(),
          };

          const updated: WordProgress = {
            ...previous,
            [skill]: applySkillAnswer(previous[skill], isCorrect),
            lastAnsweredAt: Date.now(),
          };

          return {
            flashcardWords: { ...state.flashcardWords, [wordId]: updated },
          };
        });
      },

      updateVocabularyWordProgress: ({ wordId, isFavorite, isKnown }) => {
        set((state) => {
          const previous = state.vocabularyWords[wordId];

          const updated: VocabularyWordProgress = {
            isFavorite: isFavorite ?? previous?.isFavorite ?? false,
            isKnown: isKnown ?? previous?.isKnown ?? false,
          };

          return {
            vocabularyWords: { ...state.vocabularyWords, [wordId]: updated },
          };
        });
      },

      toggleFavorite: (wordId) => {
        set((state) => {
          const previous = state.vocabularyWords[wordId];

          const updated: VocabularyWordProgress = {
            isFavorite: !(previous?.isFavorite ?? false),
            isKnown: previous?.isKnown ?? false,
          };

          return {
            vocabularyWords: { ...state.vocabularyWords, [wordId]: updated },
          };
        });
      },

      toggleWritingReview: (wordId) => {
        set((state) => {
          const next = { ...state.writingReview };

          if (next[wordId]) delete next[wordId];
          else next[wordId] = { addedAt: Date.now() };

          return { writingReview: next };
        });
      },

      removeFromWritingReview: (wordId) => {
        set((state) => {
          if (!state.writingReview[wordId]) return state;

          const next = { ...state.writingReview };
          delete next[wordId];
          return { writingReview: next };
        });
      },

      reset: () => {
        set({
          flashcardSets: {},
          flashcardWords: {},
          vocabularyWords: {},
          writingReview: {},
        });
      },
    }),
    {
      name: "word-progress",
      storage: createJSONStorage(() => AsyncStorage),
      // Версия 1: склеены дубликаты слов (см. content/words/aliases.ts).
      // writingReview добавлен без смены версии: у старых сохранений его нет,
      // и persist подставляет значение по умолчанию ({}).
      version: 1,
      migrate: (persisted, version) =>
        version < 1
          ? mergeAliasedProgress(persisted as any)
          : (persisted as any),
    },
  ),
);
export type WordLevel = 0 | 1 | 2 | 3;

export function getWordLevel(
  progress: WordProgress | undefined,
  isKnown: boolean,
  requiredSkills: Array<"reading" | "writing"> = ["reading"],
): WordLevel {
  if (isKnown) return 3;
  if (!progress) return 0;

  const streaks = requiredSkills.map((skill) => progress[skill].streak);
  return Math.min(...streaks) as WordLevel;
}

export function getMasteryBucket(
  progress: WordProgress | undefined,
  isKnown: boolean,
  requiredSkills: Array<"reading" | "writing"> = ["reading"],
): MasteryBucket {
  if (isKnown) return "learned";
  if (!progress) return "new";

  const relevantSkills = requiredSkills.map((skill) => progress[skill]);

  if (relevantSkills.every((s) => s.streak === 3)) return "learned";
  if (relevantSkills.some((s) => s.streak > 0)) return "recognizing";
  return "seen";
}
