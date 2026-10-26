import { mergeAliasedProgress } from "@/store/migrations/mergeAliasedProgress";
import { MasteryBucket, SkillProgress, WordProgress } from "@/types/progress";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
/** Лучший результат карточек по набору (id из «Моих наборов»). */
interface FlashcardSetProgress {
  bestScore: number;
  totalQuestions: number;
  accuracy: number;
  bestTime: number;
  completedAt: number;
}

interface VocabularyWordProgress {
  /** Осталось от «Избранного» (убрано из приложения): в сохранённых данных, нигде не показывается. */
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
   * «Повторение» — один рабочий список на все навыки: слова и иероглифы
   * (id вида «char:么»), которые пользователь хочет отработать. Навык выбирается
   * при запуске тренировки. Отдельно от избранного: избранное — личная коллекция.
   */
  review: Record<string, WritingReviewEntry>;
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
  /** Добавляет слово в «Повторение» или убирает оттуда. */
  toggleReview: (wordId: string) => void;
  /** Добавляет несколько слов в «Повторение» (уже добавленные пропускает). */
  addToReview: (wordIds: string[]) => void;
  /** Убирает слово из «Повторения». */
  removeFromReview: (wordId: string) => void;
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
      review: {},

      completeFlashcardSet: ({ setId, score, totalQuestions, duration }) => {
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
      },

      updateWordProgress: ({ wordId, skill, isCorrect }) => {
        set((state) => {
          const now = Date.now();
          const previous = state.flashcardWords[wordId] ?? {
            wordId,
            reading: createDefaultSkillProgress(),
            writing: createDefaultSkillProgress(),
            lastAnsweredAt: now,
          };

          const nextSkill = applySkillAnswer(previous[skill], isCorrect);

          const updated: WordProgress = {
            ...previous,
            [skill]: nextSkill,
            lastAnsweredAt: now,
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

      toggleReview: (wordId) => {
        set((state) => {
          const next = { ...state.review };

          if (next[wordId]) delete next[wordId];
          else next[wordId] = { addedAt: Date.now() };

          return { review: next };
        });
      },

      addToReview: (wordIds) => {
        set((state) => {
          const now = Date.now();
          const next = { ...state.review };
          wordIds.forEach((id, index) => {
            // +index: сохраняем порядок добавления
            if (!next[id]) next[id] = { addedAt: now + index };
          });
          return { review: next };
        });
      },

      removeFromReview: (wordId) => {
        set((state) => {
          if (!state.review[wordId]) return state;

          const next = { ...state.review };
          delete next[wordId];
          return { review: next };
        });
      },

      reset: () => {
        set({
          flashcardSets: {},
          flashcardWords: {},
          vocabularyWords: {},
          review: {},
        });
      },
    }),
    {
      name: "word-progress",
      storage: createJSONStorage(() => AsyncStorage),
      // Версия 1: склеены дубликаты слов (см. content/words/aliases.ts).
      // Версия 2: два «Повторения» (карточек и письма) слиты в одно — review.
      // Версия 3: экзамены убраны — их записи (readingExams, writingExams) удаляются.
      version: 3,
      migrate: (persisted, version) => {
        let state = persisted as any;
        if (version < 1) state = mergeAliasedProgress(state);
        if (version < 2) state = mergeReviewLists(state);
        if (version < 3) state = dropExams(state);
        return state;
      },
    },
  ),
);
/** Версия 3: экзаменов больше нет. */
function dropExams(state: any) {
  const { readingExams: _r, writingExams: _w, ...rest } = state ?? {};
  return rest;
}

/** Версия 2: «Повторение» карточек и письма → одно. Раньше добавленное идёт раньше. */
function mergeReviewLists(state: any) {
  const { readingReview = {}, writingReview = {}, ...rest } = state ?? {};
  const review: Record<string, WritingReviewEntry> = { ...writingReview };
  for (const [id, entry] of Object.entries(
    readingReview as Record<string, WritingReviewEntry>,
  )) {
    const existing = review[id];
    review[id] =
      existing && existing.addedAt <= entry.addedAt ? existing : entry;
  }
  return { ...rest, review: { ...(rest.review ?? {}), ...review } };
}

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
