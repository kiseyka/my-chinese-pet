// src/store/dailyStore.ts
//
// Слова дня: два пула — перевод и письмо — и сколько новых слов добавлять в день.
// Логика (добор, что осталось на сегодня) — в utils/daily.ts, здесь только хранение.
//
// Запись пула: когда слово добавили и в какой день с ним последний раз занимались.
// День — ключ «2026-11-02» по местному времени (utils/activity.dayKey).

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type DailySkill = "reading" | "writing";

export interface DailyEntry {
  /** День, когда слово попало в пул. */
  addedDay: string;
  /** День, когда с ним последний раз занимались в словах дня (или на пути). */
  doneDay?: string;
}

export type DailyPool = Record<string, DailyEntry>;

interface DailyState {
  /** Новых слов в день: null — ещё не настроено (спросим на экране панды). */
  perDay: Record<DailySkill, number> | null;
  /** День последнего добора новых слов. */
  filledDay: string | null;
  pools: Record<DailySkill, DailyPool>;
  /** Окно настройки уже показывали сами (второй раз не навязываем). */
  setupOffered: boolean;
}

interface DailyActions {
  setPerDay: (perDay: Record<DailySkill, number>) => void;
  setSetupOffered: () => void;
  /** Добавить слова в пул и запомнить день добора. */
  fill: (skill: DailySkill, ids: string[], day: string) => void;
  setFilledDay: (day: string) => void;
  /** Отметить, что сегодня с этими словами занимались (кто не в пуле — пропускаем). */
  markDone: (skill: DailySkill, ids: string[], day: string) => void;
  /** Убрать слова из пула (освоены). */
  remove: (skill: DailySkill, ids: string[]) => void;
  reset: () => void;
}

const emptyPools = (): Record<DailySkill, DailyPool> => ({
  reading: {},
  writing: {},
});

export const useDailyStore = create<DailyState & DailyActions>()(
  persist(
    (set) => ({
      perDay: null,
      filledDay: null,
      pools: emptyPools(),
      setupOffered: false,

      setPerDay: (perDay) => set({ perDay, setupOffered: true }),
      setSetupOffered: () => set({ setupOffered: true }),

      fill: (skill, ids, day) =>
        set((state) => {
          const pool = { ...state.pools[skill] };
          for (const id of ids) if (!pool[id]) pool[id] = { addedDay: day };
          return { pools: { ...state.pools, [skill]: pool } };
        }),

      setFilledDay: (filledDay) => set({ filledDay }),

      markDone: (skill, ids, day) =>
        set((state) => {
          const pool = { ...state.pools[skill] };
          let changed = false;
          for (const id of ids) {
            if (pool[id] && pool[id].doneDay !== day) {
              pool[id] = { ...pool[id], doneDay: day };
              changed = true;
            }
          }
          return changed ? { pools: { ...state.pools, [skill]: pool } } : state;
        }),

      remove: (skill, ids) =>
        set((state) => {
          const pool = { ...state.pools[skill] };
          let changed = false;
          for (const id of ids) {
            if (pool[id]) {
              delete pool[id];
              changed = true;
            }
          }
          return changed ? { pools: { ...state.pools, [skill]: pool } } : state;
        }),

      reset: () =>
        set({ perDay: null, filledDay: null, pools: emptyPools(), setupOffered: false }),
    }),
    {
      name: "daily-words",
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
    },
  ),
);
