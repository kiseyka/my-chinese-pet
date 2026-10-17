// app/(tabs)/games/writing/path.tsx
//
// Тренировка письма по этапу пути (stage = «1:0»): 1 новое слово + 2 повторения
// из слов этапа, которые можно писать.

import { WritingLessonScreen } from "@/components/writing/lesson/WritingLessonScreen";
import { findPathStage } from "@/utils/path/stages";
import { createWordsPlan } from "@/utils/writing/plans";
import { useLocalSearchParams } from "expo-router";
import { useCallback } from "react";

export default function PathWritingRoute() {
  const { stage: stageId } = useLocalSearchParams<{ stage?: string }>();
  const stage = findPathStage(stageId ?? "");

  const buildPlan = useCallback(
    () => createWordsPlan(stage?.writable ?? []),
    [stage],
  );

  return (
    <WritingLessonScreen title={stage?.title ?? "Путь"} buildPlan={buildPlan} />
  );
}
