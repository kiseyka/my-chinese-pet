// src/hooks/useActivityBackfill.ts
//
// Один раз дополняет журнал занятий днями из старого прогресса слов
// (когда отвечали на слова, проходили наборы, сдавали экзамены).
// Ждёт, пока оба стора загрузятся с диска: иначе загрузка затёрла бы запись.

import { useActivityStore } from "@/store/activityStore";
import { useWordProgressStore } from "@/store/wordProgressStore";
import { whenHydrated } from "@/utils/hydration";
import { useEffect } from "react";

/** Когда пользователь занимался до появления журнала. */
function collectOldProgressTimes(): number[] {
  const { flashcardWords, flashcardSets, readingExams, writingExams } =
    useWordProgressStore.getState();
  return [
    ...Object.values(flashcardWords).map((w) => w.lastAnsweredAt),
    ...Object.values(flashcardSets).map((s) => s.completedAt),
    ...Object.values(readingExams).map((e) => e.passedAt ?? 0),
    ...Object.values(writingExams).map((e) => e.passedAt ?? 0),
  ];
}

export function useActivityBackfill() {
  useEffect(() => {
    // Массив создаётся до подписок: если стор уже загружен, обработчик
    // срабатывает сразу, внутри whenHydrated
    const unsubscribers: Array<() => void> = [];
    unsubscribers.push(
      whenHydrated(useActivityStore.persist, () => {
        if (useActivityStore.getState().backfilled) return;
        unsubscribers.push(
          whenHydrated(useWordProgressStore.persist, () =>
            useActivityStore.getState().backfill(collectOldProgressTimes()),
          ),
        );
      }),
    );

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, []);
}
