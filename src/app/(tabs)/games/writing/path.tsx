// app/(tabs)/games/writing/path.tsx
//
// Тренировка письма по списку слов из «Словаря» или пути:
//   source = «path:1:0» (этап), «favorites», «dict:other» — см. utils/wordSource.ts;
//   stage = «1:0» — то же, что source=path:1:0 (так запускает путь).
// Из слов источника берутся те, что можно писать: 1 новое слово + 2 повторения.

import { WritingLessonScreen } from "@/components/writing/lesson/WritingLessonScreen";
import { PATH_TRAINING_PREFIX } from "@/utils/path/stages";
import { resolveWordSource } from "@/utils/wordSource";
import { createWordsPlan } from "@/utils/writing/plans";
import { getWritableWords } from "@/utils/writing/words";
import { useLocalSearchParams } from "expo-router";
import { useCallback } from "react";

export default function WordsWritingRoute() {
  const params = useLocalSearchParams<{ source?: string; stage?: string }>();
  const sourceId =
    params.source ?? (params.stage ? `${PATH_TRAINING_PREFIX}${params.stage}` : "");
  const source = resolveWordSource(sourceId);

  const buildPlan = useCallback(
    () => createWordsPlan(getWritableWords(resolveWordSource(sourceId)?.words ?? [])),
    [sourceId],
  );

  return (
    <WritingLessonScreen title={source?.title ?? "Письмо"} buildPlan={buildPlan} />
  );
}
