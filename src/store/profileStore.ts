// src/store/profileStore.ts
//
// Данные о пользователе для профиля: имя и род (как к нему обращаться — «ты пил»
// или «ты пила», см. utils/gender). Оба задаются в профиле тапом по имени.
// Позже их сможет спросить онбординг.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Gender } from "@/utils/gender";

export const MAX_NAME_LENGTH = 24;

interface ProfileStore {
  /** Пустая строка — имя ещё не задано. */
  name: string;
  setName: (name: string) => void;
  /** null — не указан: в текстах нейтральные формы («пил(а)»). */
  gender: Gender | null;
  setGender: (gender: Gender | null) => void;
}

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set) => ({
      name: "",
      setName: (name) =>
        set({ name: name.trim().slice(0, MAX_NAME_LENGTH) }),
      gender: null,
      setGender: (gender) => set({ gender }),
    }),
    {
      name: "profile",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
