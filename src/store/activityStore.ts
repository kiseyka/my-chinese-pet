// src/store/activityStore.ts
//
// Журнал занятий: дни обучения и сколько в них было тренировок и ответов.
//   - день засчитывается, только если в нём была тренировка или экзамен
//     (recordTraining — каждый экран итогов и каждый экзамен); просто открыть
//     приложение мало;
//   - дни не сбрасываются: «дней занятий» только растёт.
// Дни до появления журнала один раз восстанавливаются по старому прогрессу
// (когда отвечали на слова, сдавали экзамены) — см. hooks/useActivityBackfill.

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
  /** Закончена тренировка или экзамен: answers — сколько было ответов. */
  recordTraining: (answers: number, now?: number) => void;
  /**
   * Добавляет дни из старого прогресса и больше не повторяется. Сколько было
   * тренировок, неизвестно — записываем одну (раз прогресс есть, она была).
   */
  backfill: (timestamps: number[]) => void;
  reset: () => void;
}

export const useActivityStore = create<ActivityState & ActivityActions>()(
  persist(
    (set) => ({
      days: {},
      backfilled: false,

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
            if (!days[key]) days[key] = { trainings: 1, answers: 0 };
          }
          return { days, backfilled: true };
        });
      },

      reset: () => set({ days: {}, backfilled: false }),
    }),
    {
      name: "activity",
      storage: createJSONStorage(() => AsyncStorage),
      // Версия 2: считаются только дни с тренировками. Дни «только заходили»
      // убираются, восстановление по прогрессу запускается заново.
      version: 2,
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as Partial<ActivityState>;
        if (version < 2) {
          const days: ActivityDays = {};
          for (const [key, day] of Object.entries(state.days ?? {})) {
            if (day.trainings > 0) days[key] = day;
          }
          return { days, backfilled: false };
        }
        return state as ActivityState;
      },
    },
  ),
);
