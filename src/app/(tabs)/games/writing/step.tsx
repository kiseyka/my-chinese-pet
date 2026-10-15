// app/(tabs)/games/writing/step.tsx
//
// Тренировка письма по одной ступени раздела HSK (level, index):
// 1 новое слово + 2 повторения из слов этой ступени.

import { WritingLessonScreen } from "@/components/writing/lesson/WritingLessonScreen";
import { createStepPlan } from "@/utils/writing/plans";
import { describeLevel } from "@/utils/writing/words";
import { useLocalSearchParams } from "expo-router";
import { useCallback } from "react";

export default function StepWritingRoute() {
  const params = useLocalSearchParams<{ level?: string; index?: string }>();
  const level = Number(params.level ?? 1);
  const index = Number(params.index ?? 0);

  const buildPlan = useCallback(
    () => createStepPlan(level, index),
    [level, index],
  );

  return (
    <WritingLessonScreen
      title={`${describeLevel(level)} · ступень ${index + 1}`}
      buildPlan={buildPlan}
    />
  );
}
