// hooks/useSpeakHanzi.ts

import { useSettingsStore } from "@/store/settingsStore";
import { speechEnded, speechStarted } from "@/store/speechStore";
import * as Speech from "expo-speech";
import { useCallback, useMemo } from "react";

interface SpeakOptions {
  rate?: number; // 0.1–2.0, по умолчанию 1.0
}

let warmedUp = false;

/**
 * Разбудить движок озвучки заранее (при старте приложения). На Android движок
 * поднимается лениво, и первая фраза после запуска могла звучать с задержкой или теряться.
 */
export function warmUpSpeech() {
  if (warmedUp) return;
  warmedUp = true;
  Speech.getAvailableVoicesAsync().catch(() => {});
}

interface SayOptions extends SpeakOptions {
  /** Фраза закончилась (договорили; не вызывается, если остановили). */
  onEnd?: () => void;
  /** Говорит пользователь (его ответ), а не панда: панда рот не открывает. */
  byUser?: boolean;
}

/**
 * Произнести по-китайски. Пока звучит — speechStore.speakingId не 0
 * (панда в сцене разговора двигает ртом).
 */
export const say = (hanzi: string, options?: SayOptions) => {
  Speech.stop(); // не копим очередь, если слова листают быстро
  const id = options?.byUser ? -1 : speechStarted();
  const end = () => {
    speechEnded(id);
    options?.onEnd?.();
  };
  Speech.speak(hanzi, {
    language: "zh-CN",
    rate: options?.rate ?? 1.0,
    onDone: end,
    onStopped: () => speechEnded(id),
    onError: () => speechEnded(id),
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
