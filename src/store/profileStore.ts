// src/store/profileStore.ts
//
// Данные о пользователе для профиля. Пока только имя: его задают прямо в профиле
// (тап по имени). Позже то же поле сможет спросить онбординг.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const MAX_NAME_LENGTH = 24;

interface ProfileStore {
  /** Пустая строка — имя ещё не задано. */
  name: string;
  setName: (name: string) => void;
}

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set) => ({
      name: "",
      setName: (name) =>
        set({ name: name.trim().slice(0, MAX_NAME_LENGTH) }),
    }),
    {
      name: "profile",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
