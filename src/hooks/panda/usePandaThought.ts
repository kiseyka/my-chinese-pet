// src/hooks/panda/usePandaThought.ts
//
// Мысль панды на её экране:
//   - при входе на экран — придумать мысль, если пора (utils/panda/thoughts);
//   - облачко видно, пока мысль есть и реплика не открыта;
//   - тап по панде — анимация тапа в Rive, затем реплика;
//   - реплику закрыли тапом мимо — мысль остаётся, облачко возвращается;
//   - «Не сейчас» / ответ — мысль закрывается (resolveThought).

import { useActivityStore } from "@/store/activityStore";
import { usePandaStore } from "@/store/pandaStore";
import { useWordProgressStore } from "@/store/wordProgressStore";
import { whenHydrated } from "@/utils/hydration";
import { createThoughtIfDue, resolveThought } from "@/utils/panda/thoughts";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

/** Реплика открывается, когда доиграло сжатие облачка. */
const OPEN_DELAY_MS = 250;

export function usePandaThought() {
  const thought = usePandaStore((s) => s.thought);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Мысль придумывается по прогрессу, поэтому ждём, пока сторы загрузятся с диска
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const unsubscribers: Array<() => void> = [];
      const stores = [
        usePandaStore.persist,
        useWordProgressStore.persist,
        useActivityStore.persist,
      ];
      let left = stores.length;
      for (const store of stores) {
        unsubscribers.push(
          whenHydrated(store, () => {
            left -= 1;
            if (left === 0 && !cancelled) createThoughtIfDue();
          }),
        );
      }
      return () => {
        cancelled = true;
        unsubscribers.forEach((off) => off());
      };
    }, []),
  );

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  // Мысль закрылась где-то ещё (например, загадка на письмо) — реплику тоже
  useEffect(() => {
    if (!thought) setOpen(false);
  }, [thought]);

  return {
    thought,
    /** Облачко над головой. */
    hasCloud: !!thought && !open,
    /** Открытая реплика (или null). */
    openThought: open ? thought : null,
    tapPanda: () => {
      if (!thought || open || timer.current) return;
      timer.current = setTimeout(() => {
        timer.current = null;
        setOpen(true);
      }, OPEN_DELAY_MS);
    },
    /** Закрыли реплику тапом мимо — мысль остаётся. */
    close: () => setOpen(false),
    later: () => {
      setOpen(false);
      resolveThought("later");
    },
    done: () => {
      setOpen(false);
      resolveThought("done");
    },
  };
}
