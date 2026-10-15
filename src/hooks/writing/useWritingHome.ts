// src/hooks/writing/useWritingHome.ts
//
// Данные и действия экрана «Написание» (WritingHomeScreen):
// поиск, «Повторение», очередь экзаменов,
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
import {
  findPracticeWords,
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

  // ── Поиск ──────────────────────────────────────────────────────────────────

  const [query, setQuery] = useState("");
  const searchResults = useMemo(() => searchWritingWords(query, t), [query, t]);
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

  // Стабильные функции (useCallback): от них зависит, перерисуются ли сетки ступеней.
  // Новая функция на каждый рендер перерисовывала все ступени всех разделов —
  // из-за этого чипсы HSK переключались с задержкой.
  const getLevel = useCallback(
    (word: Word) => getWordWritingDots(word, flashcardWords),
    [flashcardWords],
  );
  const isInReview = useCallback(
    (word: Word) => !!writingReview[word.vocabularyId],
    [writingReview],
  );
  const getExamStatus = useCallback(
    (word: Word) =>
      getWritingExamStatus(
        flashcardWords[word.vocabularyId],
        writingExams[word.vocabularyId],
        now,
      ),
    [flashcardWords, writingExams, now],
  );
  const getExamMark = useCallback(
    (word: Word): ExamMark => {
      const { status } = getExamStatus(word);
      return status === "ready" || status === "passed" ? status : null;
    },
    [getExamStatus],
  );

  // ── Окна ───────────────────────────────────────────────────────────────────

  const [examOpen, setExamOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  /**
   * Слово, для которого открыто окно выбора (PracticeChoiceModal), и откуда открыто:
   * из поиска окно показывает, где слово лежит, и «Показать» ступень.
   */
  const [selection, setSelection] = useState<{
    word: Word;
    fromSearch: boolean;
  } | null>(null);
  const selected = selection?.word ?? null;
  const selectedFromSearch = selection?.fromSearch ?? false;
  const setSelected = useCallback(
    (word: Word | null) =>
      setSelection(word ? { word, fromSearch: false } : null),
    [],
  );
  const selectFromSearch = useCallback(
    (word: Word) => setSelection({ word, fromSearch: true }),
    [],
  );
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
    selectedFromSearch,
    selectFromSearch,
    selectedCharacters,

    // переходы
    startPractice,
    startRepeat,
    startExam,
  };
}
