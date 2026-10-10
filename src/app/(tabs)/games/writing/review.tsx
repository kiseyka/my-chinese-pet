import WritingLessonScreen from "@/screens/WritingLessonScreen";
import { createRepeatPlan } from "@/utils/writingLessons";

/** Тренировка по «Повторению»: план собирается при входе из текущего списка. */
export default function RepeatWritingRoute() {
  return (
    <WritingLessonScreen title="Повторение" buildPlan={createRepeatPlan} />
  );
}
