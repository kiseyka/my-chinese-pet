// store/settingsStore.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface SettingsStore {
  showPinyin: boolean;
  togglePinyin: () => void;
  soundEnabled: boolean;
  toggleSound: () => void;
  hanziEnabled: boolean;
  toggleHanzi: () => void;
  /** «Слушай и повторяй»: перевод звучит вслух после китайского слова. */
  listenTranslation: boolean;
  toggleListenTranslation: () => void;
  /** «Слушай и повторяй»: скорость китайского голоса (1 — обычная). */
  listenRate: number;
  setListenRate: (rate: number) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      showPinyin: true,
      togglePinyin: () => set((state) => ({ showPinyin: !state.showPinyin })),

      soundEnabled: true,
      toggleSound: () =>
        set((state) => ({ soundEnabled: !state.soundEnabled })),

      hanziEnabled: true,
      toggleHanzi: () =>
        set((state) => ({ hanziEnabled: !state.hanziEnabled })),

      listenTranslation: true,
      toggleListenTranslation: () =>
        set((state) => ({ listenTranslation: !state.listenTranslation })),

      listenRate: 0.8,
      setListenRate: (listenRate) => set({ listenRate }),
    }),
    {
      name: "app_settings",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
