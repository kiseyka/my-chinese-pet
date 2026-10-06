// …/games/writing/review.tsx
import WritingLessonScreen from "@/screens/WritingLessonScreen";
import { createReviewPlan } from "@/utils/writingLessons";
import { useLocalSearchParams } from "expo-router";
import { useCallback } from "react";

export default function ReviewWritingRoute() {
  const { setId } = useLocalSearchParams<{ setId: string }>();
  const buildPlan = useCallback(() => createReviewPlan(String(setId)), [setId]);

  return <WritingLessonScreen title="Повторить тему" buildPlan={buildPlan} />;
}
