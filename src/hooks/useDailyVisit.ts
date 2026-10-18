// src/hooks/useDailyVisit.ts
//
// Отмечает день в журнале занятий: при запуске приложения и каждый раз, когда
// оно возвращается на экран (могли открыть вчера, а вернуться сегодня).
// Ждёт, пока журнал загрузится с диска: иначе загрузка затёрла бы отметку.
// Один раз дополняет журнал днями из старого прогресса слов.

import { useActivityStore } from "@/store/activityStore";
import { useWordProgressStore } from "@/store/wordProgressStore";
import { useEffect } from "react";
import { AppState } from "react-native";

type PersistApi = {
  hasHydrated: () => boolean;
  onFinishHydration: (fn: () => void) => () => void;
};

/** Вызывает fn, когда стор загружен (сразу, если уже). Возвращает отписку. */
function whenHydrated(api: PersistApi, fn: () => void): () => void {
  if (api.hasHydrated()) {
    fn();
    return () => {};
  }
  return api.onFinishHydration(fn);
}

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

export function useDailyVisit() {
  useEffect(() => {
    const mark = () => useActivityStore.getState().markVisit();

    // Массив создаётся до подписок: если стор уже загружен, обработчик
    // срабатывает сразу, внутри whenHydrated
    const unsubscribers: Array<() => void> = [];
    unsubscribers.push(
      whenHydrated(useActivityStore.persist, () => {
        mark();
        if (useActivityStore.getState().backfilled) return;
        unsubscribers.push(
          whenHydrated(useWordProgressStore.persist, () =>
            useActivityStore.getState().backfill(collectOldProgressTimes()),
          ),
        );
      }),
    );

    const subscription = AppState.addEventListener("change", (status) => {
      if (status === "active" && useActivityStore.persist.hasHydrated()) {
        mark();
      }
    });

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      subscription.remove();
    };
  }, []);
}
