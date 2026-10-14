// app/(tabs)/games/writing/set.tsx
//
// Тренировка письма по своему набору (setId): до 5 слов набора, которые можно писать.

import { WritingLessonScreen } from "@/components/writing/lesson/WritingLessonScreen";
import { useCustomSet } from "@/store/customSetsStore";
import { createSetPlan } from "@/utils/writing/plans";
import { useLocalSearchParams } from "expo-router";
import { useCallback } from "react";

export default function SetWritingRoute() {
  const { setId } = useLocalSearchParams<{ setId: string }>();
  const set = useCustomSet(setId);

  // План собирается при входе на экран; функция стабильна, пока не сменился набор
  const buildPlan = useCallback(() => createSetPlan(setId ?? ""), [setId]);

  return (
    <WritingLessonScreen title={set?.title ?? "Набор"} buildPlan={buildPlan} />
  );
}
