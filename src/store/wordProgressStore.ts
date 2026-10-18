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
   * «Повторение» — один рабочий список на все навыки: слова и иероглифы
   * (id вида «char:么»), которые пользователь хочет отработать. Навык выбирается
   * при запуске тренировки. Отдельно от избранного: избранное — личная коллекция.
   */
  review: Record<string, WritingReviewEntry>;
  /** Экзамены по переводу (те же правила, что у письма), по id слова. */
  readingExams: Record<string, WritingExamEntry>;
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
  /** Добавляет слово в «Повторение» или убирает оттуда. */
  toggleReview: (wordId: string) => void;
  /** Добавляет несколько слов в «Повторение» (уже добавленные пропускает). */
  addToReview: (wordIds: string[]) => void;
  /** Убирает слово из «Повторения». На экзамен не ставит: для него нужны 3 точки. */
  removeFromReview: (wordId: string) => void;
  /** Ставит слово в очередь на экзамен, если оно ещё не сдано и не ждёт. */
  queueWritingExam: (wordId: string) => void;
  /** Записывает результат экзамена по письму по одному слову. */
  recordWritingExamResult: (params: {
    wordId: string;
    passed: boolean;
  }) => void;
  /** Записывает результат экзамена по переводу по одному слову. */
  recordReadingExamResult: (params: {
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

type ExamSkill = "reading" | "writing";

const EXAMS_KEY = {
  reading: "readingExams",
  writing: "writingExams",
} as const;

/**
 * Итог экзамена по навыку (письмо или перевод), правила одинаковые:
 *   сдал — слово отмечается сданным;
 *   первый провал — пересдача через 24 часа, точки не трогаем;
 *   второй провал подряд — минус одна точка навыка, экзамен ждёт новую точку.
 */
function recordExamResult(
  state: WordProgressState,
  skill: ExamSkill,
  wordId: string,
  passed: boolean,
): Partial<WordProgressState> {
  const key = EXAMS_KEY[skill];
  const exams = state[key];
  const now = Date.now();
  // Слова с тремя точками до появления экзаменов записи не имеют.
  const entry: WritingExamEntry = exams[wordId] ?? {
    availableAt: now,
    failures: 0,
  };

  if (passed) {
    return {
      [key]: { ...exams, [wordId]: { ...entry, failures: 0, passedAt: now } },
    };
  }

  const failures = entry.failures + 1;

  if (failures < WRITING_EXAM_FAILURES_BEFORE_DROP) {
    return {
      [key]: {
        ...exams,
        [wordId]: {
          ...entry,
          failures,
          availableAt: now + WRITING_EXAM_COOLDOWN_MS,
        },
      },
    };
  }

  const progress = state.flashcardWords[wordId];
  const flashcardWords = progress
    ? {
        ...state.flashcardWords,
        [wordId]: {
          ...progress,
          [skill]: {
            ...progress[skill],
            streak: Math.max(progress[skill].streak - 1, 0),
          },
          lastAnsweredAt: now,
        },
      }
    : state.flashcardWords;

  return {
    flashcardWords,
    [key]: { ...exams, [wordId]: { availableAt: null, failures: 0 } },
  };
}

export const useWordProgressStore = create<WordProgressStore>()(
  persist(
    (set) => ({
      flashcardSets: {},
      flashcardWords: {},
      vocabularyWords: {},
      review: {},
      readingExams: {},
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

          // Третья точка открывает экзамен своего навыка (через 24 часа)
          if (skill === "reading") {
            return {
              flashcardWords,
              readingExams: applyWritingDotToExams(
                state.readingExams,
                wordId,
                previous.reading.streak,
                nextSkill.streak,
                now,
              ),
            };
          }

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

      // Только убирает слово из «Повторения». На экзамен слово попадает одним путём —
      // 3 точки письма (см. getWritingExamStatus).
      removeFromReview: (wordId) => {
        set((state) => {
          if (!state.review[wordId]) return state;

          const next = { ...state.review };
          delete next[wordId];
          return { review: next };
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
        set((state) => recordExamResult(state, "writing", wordId, passed));
      },

      recordReadingExamResult: ({ wordId, passed }) => {
        set((state) => recordExamResult(state, "reading", wordId, passed));
      },

      reset: () => {
        set({
          flashcardSets: {},
          flashcardWords: {},
          vocabularyWords: {},
          review: {},
          readingExams: {},
          writingExams: {},
        });
      },
    }),
    {
      name: "word-progress",
      storage: createJSONStorage(() => AsyncStorage),
      // Версия 1: склеены дубликаты слов (см. content/words/aliases.ts).
      // Версия 2: два «Повторения» (карточек и письма) слиты в одно — review.
      // writingExams добавлены без смены версии: у старых сохранений их нет,
      // и persist подставляет значение по умолчанию ({}).
      version: 2,
      migrate: (persisted, version) => {
        let state = persisted as any;
        if (version < 1) state = mergeAliasedProgress(state);
        if (version < 2) state = mergeReviewLists(state);
        return state;
      },
    },
  ),
);
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

/**
 * Статус экзамена по письму для одного слова.
 * Слова, получившие 3 точки до появления экзаменов, считаются сразу готовыми.
 */
export function getWritingExamStatus(
  progress: WordProgress | undefined,
  entry: WritingExamEntry | undefined,
  now: number = Date.now(),
  skill: ExamSkill = "writing",
): WritingExamStatus {
  if (entry?.passedAt) return { status: "passed", passedAt: entry.passedAt };

  // Раньше слово вставало в очередь, когда его убирали из «Повторения», — даже без
  // 3 точек. Такие записи (без попыток и не «ждёт точку» после провалов) больше
  // не считаются: нужны 3 точки.
  const hasThreeDots = progress?.[skill].streak === 3;
  if (
    entry &&
    entry.failures === 0 &&
    entry.availableAt !== null &&
    !hasThreeDots
  ) {
    return { status: "unavailable" };
  }

  if (entry) {
    if (entry.availableAt === null) return { status: "locked" };
    if (entry.availableAt > now)
      return { status: "cooldown", availableAt: entry.availableAt };
    return { status: "ready" };
  }

  if (hasThreeDots) return { status: "ready" };
  return { status: "unavailable" };
}

/** Делит слова на готовые к экзамену и «скоро» (для модалки экзамена). */
export function getWritingExamQueue(
  wordIds: string[],
  flashcardWords: Record<string, WordProgress>,
  writingExams: Record<string, WritingExamEntry>,
  now: number = Date.now(),
  skill: ExamSkill = "writing",
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
      skill,
    );
    if (result.status === "ready") ready.push(wordId);
    else if (result.status === "cooldown")
      upcoming.push({ wordId, availableAt: result.availableAt });
  }

  upcoming.sort((a, b) => a.availableAt - b.availableAt);
  return { ready, upcoming };
}
