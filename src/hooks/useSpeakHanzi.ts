// hooks/useSpeakHanzi.ts

import { useSettingsStore } from "@/store/settingsStore";
import * as Speech from "expo-speech";
import { useCallback, useMemo } from "react";

interface SpeakOptions {
  rate?: number; // 0.1–2.0, по умолчанию 1.0
}

const say = (hanzi: string, options?: SpeakOptions) => {
  Speech.stop(); // не копим очередь, если слова листают быстро
  Speech.speak(hanzi, {
    language: "zh-CN",
    rate: options?.rate ?? 1.0,
  });
};

export function useSpeakHanzi() {
  const speak = useCallback((hanzi: string, options?: SpeakOptions) => {
    if (!useSettingsStore.getState().soundEnabled) return;
    say(hanzi, options);
  }, []);

  const speakForced = useCallback((hanzi: string, options?: SpeakOptions) => {
    say(hanzi, options);
  }, []);

  return useMemo(() => ({ speak, speakForced }), [speak, speakForced]);
}
