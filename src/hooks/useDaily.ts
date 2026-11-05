// src/hooks/useDaily.ts
//
// Слова дня для экрана панды: при каждом заходе на экран — добор нового дня
// и уборка освоенного письма (utils/daily.syncDaily), дальше — план на сегодня
// и запуск тренировок. Тренировки возвращают на панду.

import { useDailyStore, type DailySkill } from "@/store/dailyStore";
import { useGameStore } from "@/store/gameStore";
import { useWordProgressStore } from "@/store/wordProgressStore";
import { dayKey } from "@/utils/activity";
import { getDailyPlan, syncDaily } from "@/utils/daily";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";

export function useDaily() {
  const router = useRouter();
  const perDay = useDailyStore((s) => s.perDay);
  const pools = useDailyStore((s) => s.pools);
  const progress = useWordProgressStore((s) => s.flashcardWords);
  // Меняется при заходе на экран: после полуночи план пересчитается
  const [today, setToday] = useState(dayKey);

  useFocusEffect(
    useCallback(() => {
      const day = dayKey();
      syncDaily(day);
      setToday(day);
    }, []),
  );

  const reading = useMemo(
    () => getDailyPlan("reading", pools.reading, progress, today),
    [pools.reading, progress, today],
  );
  const writing = useMemo(
    () => getDailyPlan("writing", pools.writing, progress, today),
    [pools.writing, progress, today],
  );

  const start = useCallback(
    (skill: DailySkill) => {
      useGameStore.getState().setReturnTo("/pet");
      router.push(
        skill === "reading"
          ? ("/games/daily/reading" as any)
          : ("/games/daily/writing" as any),
      );
    },
    [router],
  );

  /** Сохранить «новых в день» и сразу добрать слова (в том числе сегодня). */
  const saveSettings = useCallback((next: Record<DailySkill, number>) => {
    const store = useDailyStore.getState();
    const first = !store.perDay;
    store.setPerDay(next);
    // При первой настройке добираем сразу; при смене — со следующего дня
    if (first) syncDaily(dayKey());
  }, []);

  return { perDay, reading, writing, start, saveSettings };
}
