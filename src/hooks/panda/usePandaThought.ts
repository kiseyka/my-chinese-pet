// src/hooks/panda/usePandaThought.ts
//
// Фраза дня на экране панды:
//   - при входе на экран — выбрать фразу дня, если сегодня её ещё не было
//     (utils/panda/thoughts);
//   - облачко видно, пока фраза есть и мы не ушли в сцену разговора;
//   - тап по панде — анимация тапа в Rive, затем шторка разговора (onOpen,
//     components/panda/PandaTalkSheet);
//   - закрыли шторку, не дочитав (closed), — облачко возвращается (до конца дня);
//   - «Продолжить» закрывает фразу в самой шторке (resolveThought).

import { useActivityStore } from "@/store/activityStore";
import { usePandaStore } from "@/store/pandaStore";
import { useRoomStore } from "@/store/roomStore";
import { useWordProgressStore } from "@/store/wordProgressStore";
import { whenHydrated } from "@/utils/hydration";
import { createThoughtIfDue } from "@/utils/panda/thoughts";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

/** Шторка открывается, когда доиграло сжатие облачка. */
const OPEN_DELAY_MS = 250;

export function usePandaThought(onOpen: () => void) {
  const thought = usePandaStore((s) => s.thought);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Мысль придумывается по прогрессу, поэтому ждём, пока сторы загрузятся с диска
  useFocusEffect(
    useCallback(() => {
      // Вернулись из сцены разговора — облачко снова видно (если мысль осталась)
      setOpen(false);
      let cancelled = false;
      const unsubscribers: Array<() => void> = [];
      const stores = [
        usePandaStore.persist,
        useWordProgressStore.persist,
        useActivityStore.persist,
        useRoomStore.persist,
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

  return {
    thought,
    /** Облачко над головой. */
    hasCloud: !!thought && !open,
    tapPanda: () => {
      if (!thought || open || timer.current) return;
      timer.current = setTimeout(() => {
        timer.current = null;
        setOpen(true);
        onOpen();
      }, OPEN_DELAY_MS);
    },
    /** Шторку закрыли: недочитанная фраза снова облачком. */
    closed: () => setOpen(false),
  };
}
