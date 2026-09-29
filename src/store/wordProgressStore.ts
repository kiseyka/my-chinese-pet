import { practiceSets } from "@/content/flashcards/sets";
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

interface WordProgressState {
  flashcardSets: Record<string, FlashcardSetProgress>;
  flashcardWords: Record<string, WordProgress>;
  vocabularyWords: Record<string, VocabularyWordProgress>;
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

      reset: () => {
        set({ flashcardSets: {}, flashcardWords: {}, vocabularyWords: {} });
      },
    }),
    {
      name: "word-progress",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export function getMasteryBucket(
  progress: WordProgress | undefined,
  isKnown: boolean,
  requiredSkills: Array<"reading" | "writing"> = ["reading"],
): MasteryBucket {
  if (isKnown) return "learned";
  if (!progress) return "seen";

  const relevantSkills = requiredSkills.map((skill) => progress[skill]);

  if (relevantSkills.every((s) => s.streak === 3)) return "learned";
  if (relevantSkills.some((s) => s.streak > 0)) return "recognizing";
  return "seen";
}
