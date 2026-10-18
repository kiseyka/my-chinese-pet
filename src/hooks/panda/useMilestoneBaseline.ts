// src/hooks/panda/useMilestoneBaseline.ts
//
// Первый снимок вех для панды (см. utils/panda/milestones): делается один раз,
// когда загрузились панда и прогресс слов. Без него панда после обновления
// отпраздновала бы разом всё, что пройдено раньше.

import { usePandaStore } from "@/store/pandaStore";
import { useWordProgressStore } from "@/store/wordProgressStore";
import { whenHydrated } from "@/utils/hydration";
import { takeMilestoneSnapshot, toSnapshot } from "@/utils/panda/milestones";
import { useEffect } from "react";

export function useMilestoneBaseline() {
  useEffect(() => {
    const unsubscribers: Array<() => void> = [];
    unsubscribers.push(
      whenHydrated(usePandaStore.persist, () => {
        if (usePandaStore.getState().milestones) return;
        unsubscribers.push(
          whenHydrated(useWordProgressStore.persist, () => {
            const panda = usePandaStore.getState();
            if (panda.milestones) return;
            panda.setMilestones(toSnapshot(takeMilestoneSnapshot()));
          }),
        );
      }),
    );
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, []);
}
