import WritingLessonScreen from "@/screens/writing/WritingLessonScreen";
import { createRepeatPlan } from "@/utils/writing/plans";

/** Тренировка по «Повторению»: план собирается при входе из текущего списка. */
export default function RepeatWritingRoute() {
  return (
    <WritingLessonScreen title="Повторение" buildPlan={createRepeatPlan} />
  );
}
