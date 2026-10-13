// app/games/writing/exam.tsx
//
// Маршрут экзамена по письму. wordIds — id слов через запятую.
// Берём только слова, которые прямо сейчас готовы к экзамену: так вернуться назад
// и пересдать уже сданное слово не выйдет.

import WritingExamScreen from "@/screens/WritingExamScreen";
import {
  getWritingExamStatus,
  useWordProgressStore,
} from "@/store/wordProgressStore";
import { getRepeatWords } from "@/utils/writingLessons";
import { useLocalSearchParams } from "expo-router";
import { useCallback } from "react";

export default function ExamWritingRoute() {
  const { wordIds } = useLocalSearchParams<{ wordIds?: string }>();

  const buildWords = useCallback(() => {
    if (!wordIds) return [];

    const { flashcardWords, writingExams } = useWordProgressStore.getState();
    const ids = wordIds.split(",").filter(Boolean);

    return getRepeatWords(ids).filter(
      (word) =>
        getWritingExamStatus(
          flashcardWords[word.vocabularyId],
          writingExams[word.vocabularyId],
        ).status === "ready",
    );
  }, [wordIds]);

  return <WritingExamScreen buildWords={buildWords} />;
}
