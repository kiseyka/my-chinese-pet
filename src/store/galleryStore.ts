// src/store/galleryStore.ts
//
// Галерея написаний: лучшее написание каждого иероглифа, которое пользователь
// сам сохранил с экрана итогов (урок или экзамен). Один иероглиф — одна запись:
// новое сохранение заменяет старое.
// Линии хранятся как есть (система 1024×1024), координаты округлены до целых.

import type { WritingPoint } from "@/store/gameStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface GalleryItem {
  hanzi: string;
  /** Черты написания: [черта][точка]. */
  strokes: WritingPoint[][];
  savedAt: number;
}

interface GalleryStore {
  /** По иероглифу. */
  items: Record<string, GalleryItem>;
  save: (hanzi: string, strokes: WritingPoint[][]) => void;
  remove: (hanzi: string) => void;
}

const roundStrokes = (strokes: WritingPoint[][]): WritingPoint[][] =>
  strokes.map((stroke) =>
    stroke.map(({ x, y }) => ({ x: Math.round(x), y: Math.round(y) })),
  );

export const useGalleryStore = create<GalleryStore>()(
  persist(
    (set) => ({
      items: {},

      save: (hanzi, strokes) => {
        if (strokes.length === 0) return;
        set((state) => ({
          items: {
            ...state.items,
            [hanzi]: { hanzi, strokes: roundStrokes(strokes), savedAt: Date.now() },
          },
        }));
      },

      remove: (hanzi) => {
        set((state) => {
          if (!state.items[hanzi]) return state;
          const items = { ...state.items };
          delete items[hanzi];
          return { items };
        });
      },
    }),
    {
      name: "gallery",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

/** Записи от новых к старым. */
export function sortGallery(items: Record<string, GalleryItem>): GalleryItem[] {
  return Object.values(items).sort((a, b) => b.savedAt - a.savedAt);
}
