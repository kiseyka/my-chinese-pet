// src/hooks/usePath.ts
//
// Прогресс пути и запуск тренировок этапа — общие для карты пути и экрана этапа.
// Прогресс пересчитывается, когда меняются точки слов.
// Тренировки, запущенные отсюда, на экране итогов «Продолжить» возвращают на путь.

import { useGameStore } from "@/store/gameStore";
import { useWordProgressStore } from "@/store/wordProgressStore";
import {
  getPathProgress,
  pathTrainingId,
  type PathStage,
  type TrackId,
} from "@/utils/path/stages";
import { useRouter, type Href } from "expo-router";
import { useCallback, useMemo } from "react";

export function usePath() {
  const router = useRouter();
  const flashcardWords = useWordProgressStore((state) => state.flashcardWords);

  const progress = useMemo(
    () => getPathProgress(flashcardWords),
    [flashcardWords],
  );

  /** Запустить тренировку дорожки этапа. returnTo — куда вернёт «Продолжить» в итогах. */
  const startTraining = useCallback(
    (stage: PathStage, track: TrackId, returnTo: Href = "/games/path") => {
      useGameStore.getState().setReturnTo(returnTo);

      if (track === "writing") {
        if (stage.writable.length === 0) return;
        router.push({
          pathname: "/games/writing/path" as any,
          params: { stage: stage.id },
        });
        return;
      }

      router.push({
        pathname: "/games/flashcards/[setId]",
        params: { setId: pathTrainingId(stage) },
      });
    },
    [router],
  );

  return { progress, flashcardWords, startTraining };
}
