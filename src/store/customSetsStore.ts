// src/store/customSetsStore.ts
//
// «Мои наборы»: наборы слов, которые пользователь собирает сам.
// Набор хранит только id слов из общей базы (src/content/words), поэтому
// прогресс слова общий для всех наборов и тренировок.
// Набор не привязан к навыку: сейчас его тренируют карточками,
// позже можно будет тренировать и письмом.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/** Сколько слов нужно, чтобы запустить карточки (1 правильный + 3 неправильных варианта). */
export const MIN_SET_WORDS = 4;

/** Самое длинное название набора. */
export const MAX_SET_TITLE_LENGTH = 40;

export interface CustomSet {
  id: string;
  title: string;
  /** Слова в порядке добавления. */
  wordIds: string[];
  createdAt: number;
  updatedAt: number;
}

interface CustomSetsState {
  /** Наборы в порядке создания. */
  sets: CustomSet[];
}

interface CustomSetsActions {
  /** Создаёт набор и возвращает его id. */
  createSet: (title: string) => string;
  renameSet: (setId: string, title: string) => void;
  deleteSet: (setId: string) => void;
  /** Добавляет слово в набор или убирает, если оно уже там. */
  toggleWord: (setId: string, wordId: string) => void;
  removeWord: (setId: string, wordId: string) => void;
  reset: () => void;
}

type CustomSetsStore = CustomSetsState & CustomSetsActions;

function makeId(): string {
  return `set-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Обрезает пробелы и длину. Пустое название заменяется на «Мой набор». */
export function cleanSetTitle(title: string): string {
  const trimmed = title.trim().slice(0, MAX_SET_TITLE_LENGTH);
  return trimmed || "Мой набор";
}

/** Меняет один набор, остальные оставляет как есть. */
function updateSet(
  sets: CustomSet[],
  setId: string,
  change: (set: CustomSet) => CustomSet,
): CustomSet[] {
  return sets.map((set) =>
    set.id === setId ? { ...change(set), updatedAt: Date.now() } : set,
  );
}

export const useCustomSetsStore = create<CustomSetsStore>()(
  persist(
    (set) => ({
      sets: [],

      createSet: (title) => {
        const now = Date.now();
        const newSet: CustomSet = {
          id: makeId(),
          title: cleanSetTitle(title),
          wordIds: [],
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({ sets: [...state.sets, newSet] }));
        return newSet.id;
      },

      renameSet: (setId, title) => {
        set((state) => ({
          sets: updateSet(state.sets, setId, (s) => ({
            ...s,
            title: cleanSetTitle(title),
          })),
        }));
      },

      deleteSet: (setId) => {
        set((state) => ({ sets: state.sets.filter((s) => s.id !== setId) }));
      },

      toggleWord: (setId, wordId) => {
        set((state) => ({
          sets: updateSet(state.sets, setId, (s) => ({
            ...s,
            wordIds: s.wordIds.includes(wordId)
              ? s.wordIds.filter((id) => id !== wordId)
              : [...s.wordIds, wordId],
          })),
        }));
      },

      removeWord: (setId, wordId) => {
        set((state) => ({
          sets: updateSet(state.sets, setId, (s) => ({
            ...s,
            wordIds: s.wordIds.filter((id) => id !== wordId),
          })),
        }));
      },

      reset: () => set({ sets: [] }),
    }),
    {
      name: "custom-sets",
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
    },
  ),
);

/** Набор по id или undefined. */
export function useCustomSet(setId: string | undefined): CustomSet | undefined {
  return useCustomSetsStore((state) =>
    setId ? state.sets.find((s) => s.id === setId) : undefined,
  );
}
