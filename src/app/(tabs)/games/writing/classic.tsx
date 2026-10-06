import WritingLessonScreen from "@/screens/WritingLessonScreen";
import { createClassicPlan } from "@/utils/writingLessons";

export default function ClassicWritingRoute() {
  return (
    <WritingLessonScreen
      title="Классическая тренировка"
      buildPlan={createClassicPlan}
    />
  );
}
