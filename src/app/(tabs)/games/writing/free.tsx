import { WritingLessonScreen } from "@/components/writing/lesson/WritingLessonScreen";
import { createFreePlan, type FreeFormat } from "@/utils/writing/plans";
import { useLocalSearchParams } from "expo-router";
import { useCallback } from "react";

export default function FreeWritingRoute() {
  const { wordId, format } = useLocalSearchParams<{
    wordId?: string;
    format?: string;
  }>();

  const lessonFormat: FreeFormat = format === "quick" ? "quick" : "full";

  const buildPlan = useCallback(
    () => (wordId ? createFreePlan(wordId, lessonFormat) : []),
    [wordId, lessonFormat],
  );

  return (
    <WritingLessonScreen
      title={
        lessonFormat === "quick" ? "Быстрая тренировка" : "Полная тренировка"
      }
      buildPlan={buildPlan}
    />
  );
}
