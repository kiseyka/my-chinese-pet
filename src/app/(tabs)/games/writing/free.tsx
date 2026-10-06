// …/games/writing/free.tsx
import WritingLessonScreen from "@/screens/WritingLessonScreen";
import { createFreePlan } from "@/utils/writingLessons";
import { useLocalSearchParams } from "expo-router";
import { useCallback } from "react";

export default function FreeWritingRoute() {
  const { wordId } = useLocalSearchParams<{ wordId: string }>();
  const buildPlan = useCallback(() => createFreePlan(String(wordId)), [wordId]);

  return (
    <WritingLessonScreen title="Свободная тренировка" buildPlan={buildPlan} />
  );
}
