import { useSettingsStore } from "@/store/settingsStore"; // предполагаемое место soundEnabled — поправь путь при необходимости
import * as Speech from "expo-speech";

interface SpeakOptions {
  rate?: number; // 0.1–2.0, по умолчанию 1.0
}

export function useSpeakHanzi() {
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);

  const speak = (hanzi: string, options?: SpeakOptions) => {
    if (!soundEnabled) return;
    Speech.speak(hanzi, {
      language: "zh-CN",
      rate: options?.rate ?? 1.0,
    });
  };

  const speakForced = (hanzi: string, options?: SpeakOptions) => {
    Speech.speak(hanzi, {
      language: "zh-CN",
      rate: options?.rate ?? 1.0,
    });
  };

  return { speak, speakForced };
}
