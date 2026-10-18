// src/store/activityStore.ts
//
// Журнал занятий: по каким дням заходили и сколько было тренировок и ответов.
//   - день засчитывается, как только приложение открыли (markVisit);
//   - тренировка — каждый экран итогов и каждый экзамен (recordTraining);
//   - дни не сбрасываются: «дней с пандой» только растёт.
// Дни до появления журнала один раз восстанавливаются по старому прогрессу
// (когда отвечали на слова, сдавали экзамены) — см. hooks/useDailyVisit.

import { dayKey, type ActivityDays } from "@/utils/activity";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface ActivityState {
  days: ActivityDays;
  /** Старые дни уже восстановлены по прогрессу слов. */
  backfilled: boolean;
}

interface ActivityActions {
  /** Отмечает сегодняшний день (если ещё не отмечен). */
  markVisit: (now?: number) => void;
  /** Закончена тренировка или экзамен: answers — сколько было ответов. */
  recordTraining: (answers: number, now?: number) => void;
  /** Добавляет дни из старого прогресса (без тренировок) и больше не повторяется. */
  backfill: (timestamps: number[]) => void;
  reset: () => void;
}

export const useActivityStore = create<ActivityState & ActivityActions>()(
  persist(
    (set) => ({
      days: {},
      backfilled: false,

      markVisit: (now = Date.now()) => {
        const key = dayKey(now);
        set((state) =>
          state.days[key]
            ? state
            : { days: { ...state.days, [key]: { trainings: 0, answers: 0 } } },
        );
      },

      recordTraining: (answers, now = Date.now()) => {
        const key = dayKey(now);
        set((state) => {
          const day = state.days[key] ?? { trainings: 0, answers: 0 };
          return {
            days: {
              ...state.days,
              [key]: {
                trainings: day.trainings + 1,
                answers: day.answers + Math.max(0, answers),
              },
            },
          };
        });
      },

      backfill: (timestamps) => {
        set((state) => {
          if (state.backfilled) return state;
          const days = { ...state.days };
          for (const time of timestamps) {
            if (!time) continue;
            const key = dayKey(time);
            if (!days[key]) days[key] = { trainings: 0, answers: 0 };
          }
          return { days, backfilled: true };
        });
      },

      reset: () => set({ days: {}, backfilled: false }),
    }),
    {
      name: "activity",
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
    },
  ),
);
