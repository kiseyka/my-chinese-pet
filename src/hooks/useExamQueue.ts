// src/hooks/useExamQueue.ts
//
// Очередь экзаменов навыка (письмо или перевод): какие слова готовы прямо сейчас
// и какие откроются скоро. На экзамен попадает слово с 3 точками этого навыка
// (или ждущее пересдачи).
// now обновляется при каждом возвращении на экран.

import type { UpcomingExamWord } from "@/components/writing/modals/ExamModal";
import {
  getWritingExamQueue,
  useWordProgressStore,
} from "@/store/wordProgressStore";
import { findPracticeWords } from "@/utils/writing/words";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";

export function useExamQueue(skill: "reading" | "writing" = "writing") {
  const flashcardWords = useWordProgressStore((s) => s.flashcardWords);
  const writingExams = useWordProgressStore((s) =>
    skill === "reading" ? s.readingExams : s.writingExams,
  );

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
    const result = getWritingExamQueue(
      ids,
      flashcardWords,
      writingExams,
      now,
      skill,
    );

    const ready = findPracticeWords(result.ready);
    const upcoming: UpcomingExamWord[] = result.upcoming.flatMap(
      ({ wordId, availableAt }) => {
        const [word] = findPracticeWords([wordId]);
        return word ? [{ word, availableAt }] : [];
      },
    );
    return { ready, upcoming };
  }, [flashcardWords, writingExams, now, skill]);

  return { ...queue, now };
}
