// src/hooks/useExamQueue.ts
//
// Очередь экзаменов по письму: какие слова готовы прямо сейчас и какие откроются скоро.
// На экзамен попадает слово с 3 точками письма (или ждущее пересдачи).
// now обновляется при каждом возвращении на экран.

import type { UpcomingExamWord } from "@/components/writing/modals/ExamModal";
import {
  getWritingExamQueue,
  useWordProgressStore,
} from "@/store/wordProgressStore";
import { findPracticeWords } from "@/utils/writing/words";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";

export function useExamQueue() {
  const flashcardWords = useWordProgressStore((s) => s.flashcardWords);
  const writingExams = useWordProgressStore((s) => s.writingExams);

  const [now, setNow] = useState(() => Date.now());
  useFocusEffect(
    useCallback(() => {
      setNow(Date.now());
    }, []),
  );

  const queue = useMemo(() => {
    const ids = Array.from(
      new Set([...Object.keys(flashcardWords), ...Object.keys(writingExams)]),
    );
    const result = getWritingExamQueue(ids, flashcardWords, writingExams, now);

    const ready = findPracticeWords(result.ready);
    const upcoming: UpcomingExamWord[] = result.upcoming.flatMap(
      ({ wordId, availableAt }) => {
        const [word] = findPracticeWords([wordId]);
        return word ? [{ word, availableAt }] : [];
      },
    );
    return { ready, upcoming };
  }, [flashcardWords, writingExams, now]);

  return { ...queue, now };
}
