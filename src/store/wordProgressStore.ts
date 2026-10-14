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
  isFavorite: boolean;
  isKnown: boolean;
}

/** Слово в списке «Повторение» режима «Написание». */
interface WritingReviewEntry {
  addedAt: number;
}

/** Через сколько после третьей точки (или провала) открывается экзамен. */
export const WRITING_EXAM_COOLDOWN_MS = 24 * 60 * 60 * 1000;

/** Сколько провалов подряд снимают одну точку письма. */
const WRITING_EXAM_FAILURES_BEFORE_DROP = 2;

/**
 * Экзамен по письму для одного слова.
 * Хранится отдельно от SkillProgress, чтобы не трогать тип прогресса и миграции.
 */
export interface WritingExamEntry {
  /**
   * Когда экзамен станет доступен.
   * null — экзамен заблокирован, пока пользователь снова не заработает точку
   * (бывает после второго провала подряд).
   */
  availableAt: number | null;
  /** Провалы подряд с момента последней заработанной точки. */
  failures: number;
  /** Когда экзамен сдан (слово отмечается галочкой). */
  passedAt?: number;
}

export type WritingExamStatus =
  | { status: "unavailable" } // нет 3 точек и слово не ставили в очередь
  | { status: "locked" } // после второго провала: нужно снова заработать точку
  | { status: "cooldown"; availableAt: number } // ждём 24 часа
  | { status: "ready" }
  | { status: "passed"; passedAt: number };

interface WordProgressState {
  flashcardSets: Record<string, FlashcardSetProgress>;
  flashcardWords: Record<string, WordProgress>;
  vocabularyWords: Record<string, VocabularyWordProgress>;
  /**
   * «Повторение» в письме: слова и иероглифы (id вида «char:么»), которые пользователь
   * хочет отработать. Отдельно от избранного словаря: это временный список.
   */
  writingReview: Record<string, WritingReviewEntry>;
  /**
   * «Повторение» в карточках (чтение): слова, которые пользователь хочет повторить.
   * Своё для каждого навыка: слово можно легко читать и не уметь писать.
   */
  readingReview: Record<string, WritingReviewEntry>;
  /** Экзамены по письму, по id слова. */
  writingExams: Record<string, WritingExamEntry>;
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
  /** Добавляет слово в «Повторение» карточек или убирает оттуда. */
  toggleReadingReview: (wordId: string) => void;
  /** Добавляет несколько слов в «Повторение» карточек (уже добавленные пропускает). */
  addToReadingReview: (wordIds: string[]) => void;
  /** Добавляет слово в «Повторение» письма или убирает оттуда (без экзамена). */
  toggleWritingReview: (wordId: string) => void;
  /**
   * Убирает слово из «Повторения» как «чувствую, что знаю»:
   * ставит его в очередь на экзамен (откроется через 24 часа).
   */
  removeFromWritingReview: (wordId: string) => void;
  /** Ставит слово в очередь на экзамен, если оно ещё не сдано и не ждёт. */
  queueWritingExam: (wordId: string) => void;
  /** Записывает результат экзамена по одному слову. */
  recordWritingExamResult: (params: {
    wordId: string;
    passed: boolean;
  }) => void;
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

/**
 * Реакция экзамена на заработанную точку письма.
 * - Третья точка → экзамен откроется через 24 часа.
 * - Экзамен был заблокирован после второго провала → любая новая точка
 *   снова ставит его в очередь (тоже через 24 часа).
 */
function applyWritingDotToExams(
  exams: Record<string, WritingExamEntry>,
  wordId: string,
  prevStreak: number,
  nextStreak: number,
  now: number,
): Record<string, WritingExamEntry> {
  if (nextStreak <= prevStreak) return exams;

  const entry = exams[wordId];
  if (entry?.passedAt) return exams;

  if (entry && entry.availableAt === null) {
    return {
      ...exams,
      [wordId]: { ...entry, availableAt: now + WRITING_EXAM_COOLDOWN_MS },
    };
  }

  if (!entry && nextStreak === 3) {
    return {
      ...exams,
      [wordId]: { availableAt: now + WRITING_EXAM_COOLDOWN_MS, failures: 0 },
    };
  }

  return exams;
}

export const useWordProgressStore = create<WordProgressStore>()(
  persist(
    (set) => ({
      flashcardSets: {},
      flashcardWords: {},
      vocabularyWords: {},
      writingReview: {},
      readingReview: {},
      writingExams: {},

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

          const flashcardWords = { ...state.flashcardWords, [wordId]: updated };

          if (skill !== "writing") return { flashcardWords };

          return {
            flashcardWords,
            writingExams: applyWritingDotToExams(
              state.writingExams,
              wordId,
              previous.writing.streak,
              nextSkill.streak,
              now,
            ),
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

      toggleReadingReview: (wordId) => {
        set((state) => {
          const next = { ...state.readingReview };

          if (next[wordId]) delete next[wordId];
          else next[wordId] = { addedAt: Date.now() };

          return { readingReview: next };
        });
      },

      addToReadingReview: (wordIds) => {
        set((state) => {
          const now = Date.now();
          const next = { ...state.readingReview };
          wordIds.forEach((id, index) => {
            // +index: сохраняем порядок добавления
            if (!next[id]) next[id] = { addedAt: now + index };
          });
          return { readingReview: next };
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

          const entry = state.writingExams[wordId];
          if (entry) return { writingReview: next };

          return {
            writingReview: next,
            writingExams: {
              ...state.writingExams,
              [wordId]: {
                availableAt: Date.now() + WRITING_EXAM_COOLDOWN_MS,
                failures: 0,
              },
            },
          };
        });
      },

      queueWritingExam: (wordId) => {
        set((state) => {
          // Уже сдано, уже в очереди или заблокировано после провалов — не трогаем.
          if (state.writingExams[wordId]) return state;

          return {
            writingExams: {
              ...state.writingExams,
              [wordId]: {
                availableAt: Date.now() + WRITING_EXAM_COOLDOWN_MS,
                failures: 0,
              },
            },
          };
        });
      },

      recordWritingExamResult: ({ wordId, passed }) => {
        set((state) => {
          const now = Date.now();
          // Слова с тремя точками до появления экзаменов записи не имеют.
          const entry: WritingExamEntry = state.writingExams[wordId] ?? {
            availableAt: now,
            failures: 0,
          };

          if (passed) {
            return {
              writingExams: {
                ...state.writingExams,
                [wordId]: { ...entry, failures: 0, passedAt: now },
              },
            };
          }

          const failures = entry.failures + 1;

          // Первый провал: повтор через 24 часа, точки не трогаем.
          if (failures < WRITING_EXAM_FAILURES_BEFORE_DROP) {
            return {
              writingExams: {
                ...state.writingExams,
                [wordId]: {
                  ...entry,
                  failures,
                  availableAt: now + WRITING_EXAM_COOLDOWN_MS,
                },
              },
            };
          }

          // Второй провал подряд: минус одна точка письма (не до нуля сразу),
          // экзамен ждёт, пока точку снова заработают.
          const progress = state.flashcardWords[wordId];
          const flashcardWords = progress
            ? {
                ...state.flashcardWords,
                [wordId]: {
                  ...progress,
                  writing: {
                    ...progress.writing,
                    streak: Math.max(progress.writing.streak - 1, 0),
                  },
                  lastAnsweredAt: now,
                },
              }
            : state.flashcardWords;

          return {
            flashcardWords,
            writingExams: {
              ...state.writingExams,
              [wordId]: { availableAt: null, failures: 0 },
            },
          };
        });
      },

      reset: () => {
        set({
          flashcardSets: {},
          flashcardWords: {},
          vocabularyWords: {},
          writingReview: {},
          readingReview: {},
          writingExams: {},
        });
      },
    }),
    {
      name: "word-progress",
      storage: createJSONStorage(() => AsyncStorage),
      // Версия 1: склеены дубликаты слов (см. content/words/aliases.ts).
      // writingReview, readingReview и writingExams добавлены без смены версии: у старых
      // сохранений их нет, и persist подставляет значение по умолчанию ({}).
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

/**
 * Статус экзамена по письму для одного слова.
 * Слова, получившие 3 точки до появления экзаменов, считаются сразу готовыми.
 */
export function getWritingExamStatus(
  progress: WordProgress | undefined,
  entry: WritingExamEntry | undefined,
  now: number = Date.now(),
): WritingExamStatus {
  if (entry?.passedAt) return { status: "passed", passedAt: entry.passedAt };

  if (entry) {
    if (entry.availableAt === null) return { status: "locked" };
    if (entry.availableAt > now)
      return { status: "cooldown", availableAt: entry.availableAt };
    return { status: "ready" };
  }

  if (progress?.writing.streak === 3) return { status: "ready" };
  return { status: "unavailable" };
}

/** Делит слова на готовые к экзамену и «скоро» (для модалки экзамена). */
export function getWritingExamQueue(
  wordIds: string[],
  flashcardWords: Record<string, WordProgress>,
  writingExams: Record<string, WritingExamEntry>,
  now: number = Date.now(),
): {
  ready: string[];
  upcoming: Array<{ wordId: string; availableAt: number }>;
} {
  const ready: string[] = [];
  const upcoming: Array<{ wordId: string; availableAt: number }> = [];

  for (const wordId of wordIds) {
    const result = getWritingExamStatus(
      flashcardWords[wordId],
      writingExams[wordId],
      now,
    );
    if (result.status === "ready") ready.push(wordId);
    else if (result.status === "cooldown")
      upcoming.push({ wordId, availableAt: result.availableAt });
  }

  upcoming.sort((a, b) => a.availableAt - b.availableAt);
  return { ready, upcoming };
}
