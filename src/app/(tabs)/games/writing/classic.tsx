import { WritingLessonScreen } from "@/components/writing/lesson/WritingLessonScreen";
import { createClassicPlan } from "@/utils/writing/plans";
import { getLevelStepsProgress } from "@/utils/writing/steps";
import { describeLevel } from "@/utils/writing/words";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useMemo } from "react";

export default function ClassicWritingRoute() {
  const { level } = useLocalSearchParams<{ level?: string }>();
  const hskLevel = Number.isFinite(Number(level)) ? Number(level) : 1;

  const buildPlan = useCallback(() => createClassicPlan(hskLevel), [hskLevel]);

  // Ступень на момент входа: заголовок не меняется посреди урока
  const title = useMemo(() => {
    const progress = getLevelStepsProgress(hskLevel);
    const name = describeLevel(hskLevel);

    return progress.completed
      ? `${name} · повторение`
      : `${name} · ступень ${progress.currentIndex + 1}`;
  }, [hskLevel]);

  return <WritingLessonScreen title={title} buildPlan={buildPlan} />;
}
