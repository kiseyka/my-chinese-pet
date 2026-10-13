// src/hooks/writing/useWritingHome.ts
//
// Данные и действия экрана «Написание» (WritingHomeScreen):
// разделы HSK и ступени, поиск, «Повторение», очередь экзаменов,
// открытые окна и переходы в тренировки. Экран только раскладывает это по местам.

import type { Word } from "@/content/flashcards/types";
import type { ExamMark } from "@/components/writing/home/WordGrid";
import type { UpcomingExamWord } from "@/components/writing/modals/ExamModal";
import {
  getWritingExamQueue,
  getWritingExamStatus,
  useWordProgressStore,
} from "@/store/wordProgressStore";
import type { FreeFormat } from "@/utils/writing/plans";
import { searchWritingWords } from "@/utils/writing/search";
import { getLevelStepsProgress } from "@/utils/writing/steps";
import {
  NO_HSK_LEVEL,
  findPracticeWords,
  getAvailableLevels,
  getWordCharacters,
  getWordWritingDots,
} from "@/utils/writing/words";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

export function useWritingHome() {
  const router = useRouter();
  const { t } = useTranslation(["sets"]);

  // Подписка на прогресс: точки, ступени, «Повторение» и экзамены пересчитываются при изменении
  const flashcardWords = useWordProgressStore((s) => s.flashcardWords);
  const writingReview = useWordProgressStore((s) => s.writingReview);
  const writingExams = useWordProgressStore((s) => s.writingExams);
  const toggleWritingReview = useWordProgressStore(
    (s) => s.toggleWritingReview,
  );

  // Время для очереди экзаменов: обновляем при каждом возвращении на экран
  const [now, setNow] = useState(() => Date.now());
  useFocusEffect(
    useCallback(() => {
      setNow(Date.now());
    }, []),
  );

  // ── Разделы и ступени ──────────────────────────────────────────────────────

  const levels = useMemo(() => getAvailableLevels(), []);
  const hskLevels = levels.filter((level) => level !== NO_HSK_LEVEL);
  const hasOtherWords = levels.includes(NO_HSK_LEVEL);

  // Пока финалов ступеней нет, открыт только первый раздел HSK
  const currentLevel = hskLevels[0];
  const lockedLevels = hskLevels.slice(1);

  const stepsProgress =
    currentLevel !== undefined
      ? getLevelStepsProgress(currentLevel, flashcardWords)
      : null;

  // Сводка по разделу: изучено / всего по всем ступеням
  const levelLearned =
    stepsProgress?.steps.reduce((sum, step) => sum + step.learned, 0) ?? 0;
  const levelTotal =
    stepsProgress?.steps.reduce((sum, step) => sum + step.words.length, 0) ??
    0;

  // Развёрнутые блоки: «step-3» или «other». Сначала — текущая ступень
  const [expanded, setExpanded] = useState<Set<string>>(
    () =>
      new Set(stepsProgress ? [`step-${stepsProgress.currentIndex}`] : []),
  );

  const toggleExpanded = (key: string) =>
    setExpanded((previous) => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  // ── Поиск ──────────────────────────────────────────────────────────────────

  const [query, setQuery] = useState("");
  const searchResults = useMemo(
    () => searchWritingWords(query, t),
    [query, t],
  );
  const isSearching = query.trim().length > 0;

  // ── «Повторение» и экзамены ────────────────────────────────────────────────

  const repeatWords = useMemo(
    () => findPracticeWords(Object.keys(writingReview)),
    [writingReview],
  );

  // Очередь экзаменов: все слова с прогрессом письма или записью экзамена
  const examQueue = useMemo(() => {
    const ids = Array.from(
      new Set([...Object.keys(flashcardWords), ...Object.keys(writingExams)]),
    );
    const queue = getWritingExamQueue(ids, flashcardWords, writingExams, now);

    const ready = findPracticeWords(queue.ready);
    const upcoming: UpcomingExamWord[] = queue.upcoming.flatMap(
      ({ wordId, availableAt }) => {
        const [word] = findPracticeWords([wordId]);
        return word ? [{ word, availableAt }] : [];
      },
    );

    return { ready, upcoming };
  }, [flashcardWords, writingExams, now]);

  // ── Состояние слова (для сетки и окна слова) ───────────────────────────────

  const getLevel = (word: Word) => getWordWritingDots(word, flashcardWords);
  const isInReview = (word: Word) => !!writingReview[word.vocabularyId];
  const getExamStatus = (word: Word) =>
    getWritingExamStatus(
      flashcardWords[word.vocabularyId],
      writingExams[word.vocabularyId],
      now,
    );
  const getExamMark = (word: Word): ExamMark => {
    const { status } = getExamStatus(word);
    return status === "ready" || status === "passed" ? status : null;
  };

  // ── Окна ───────────────────────────────────────────────────────────────────

  const [examOpen, setExamOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  /** Слово, для которого открыто окно выбора (PracticeChoiceModal). */
  const [selected, setSelected] = useState<Word | null>(null);
  const selectedCharacters = useMemo(
    () => (selected ? getWordCharacters(selected) : []),
    [selected],
  );

  // ── Переходы в тренировки ──────────────────────────────────────────────────

  const startPractice = (word: Word, format: FreeFormat) => {
    setSelected(null);
    router.push({
      pathname: "/games/writing/free" as any,
      params: { wordId: word.vocabularyId, format },
    });
  };

  const startRepeat = () => {
    setReviewOpen(false);
    if (repeatWords.length === 0) return;
    router.push("/games/writing/review" as any);
  };

  const startExam = (words: Word[]) => {
    if (words.length === 0) return;
    setExamOpen(false);
    setSelected(null);
    router.push({
      pathname: "/games/writing/exam" as any,
      params: { wordIds: words.map((w) => w.vocabularyId).join(",") },
    });
  };

  return {
    now,

    // разделы и ступени
    currentLevel,
    lockedLevels,
    hasOtherWords,
    stepsProgress,
    levelLearned,
    levelTotal,
    expanded,
    toggleExpanded,

    // поиск
    query,
    setQuery,
    searchResults,
    isSearching,

    // «Повторение» и экзамены
    repeatWords,
    examQueue,

    // состояние слова
    getLevel,
    isInReview,
    getExamStatus,
    getExamMark,
    toggleReview: (word: Word) => toggleWritingReview(word.vocabularyId),

    // окна
    examOpen,
    setExamOpen,
    reviewOpen,
    setReviewOpen,
    selected,
    setSelected,
    selectedCharacters,

    // переходы
    startPractice,
    startRepeat,
    startExam,
  };
}
