// src/hooks/useListenLesson.ts
//
// Проигрывает сценарий «Слушай и повторяй» (utils/listen/script.ts).
// И китайский (zh-CN), и перевод (ru-RU) говорит голос телефона через expo-speech.
// Паузы — таймеры. Скорость китайского меняется прямо в уроке: действует
// со следующей фразы (setRate).
//
// Пауза: останавливает текущий шаг; «Продолжить» начинает этот шаг заново.
// Уход с экрана останавливает урок.

import type { ListenPhrase } from "@/content/listen/sets";
import { buildListenScript, repeatPauseMs, type ListenStep } from "@/utils/listen/script";
import * as Speech from "expo-speech";
import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";

export type ListenState = "idle" | "playing" | "paused" | "finished";

/** Сказать и дождаться конца. Возвращает, сколько звучало, мс. */
function speak(text: string, language: string, rate = 1): Promise<number> {
  const started = Date.now();
  return new Promise((resolve) => {
    const done = () => resolve(Date.now() - started);
    Speech.speak(text, { language, rate, onDone: done, onStopped: done, onError: done });
  });
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function useListenLesson() {
  const [state, setState] = useState<ListenState>("idle");
  const [steps, setSteps] = useState<ListenStep[]>([]);
  const [index, setIndex] = useState(0);

  const stepsRef = useRef<ListenStep[]>([]);
  const indexRef = useRef(0);
  /** Меняется при паузе/остановке: старый цикл видит чужой токен и выходит. */
  const tokenRef = useRef(0);
  const lastSpokenMs = useRef(0);
  const rateRef = useRef(1);

  const run = useCallback(async (token: number) => {
    const alive = () => tokenRef.current === token;

    while (indexRef.current < stepsRef.current.length) {
      const step = stepsRef.current[indexRef.current];
      setIndex(indexRef.current);

      switch (step.kind) {
        case "zh":
          lastSpokenMs.current = await speak(step.phrase.hanzi, "zh-CN", rateRef.current);
          break;
        case "translation":
          await speak(step.phrase.ru, "ru-RU");
          break;
        case "repeat":
          await wait(repeatPauseMs(lastSpokenMs.current));
          break;
        case "gap":
          await wait(step.ms);
          break;
      }

      if (!alive()) return;
      indexRef.current += 1;
    }

    setState("finished");
  }, []);

  const start = useCallback(
    (phrases: ListenPhrase[], withTranslation: boolean, rate: number) => {
      const script = buildListenScript(phrases, withTranslation);
      stepsRef.current = script;
      indexRef.current = 0;
      rateRef.current = rate;
      setSteps(script);
      setIndex(0);
      setState("playing");
      run(++tokenRef.current);
    },
    [run],
  );

  const setRate = useCallback((rate: number) => {
    rateRef.current = rate;
  }, []);

  const pause = useCallback(() => {
    tokenRef.current += 1;
    Speech.stop();
    setState("paused");
  }, []);

  const resume = useCallback(() => {
    setState("playing");
    run(++tokenRef.current);
  }, [run]);

  const stop = useCallback(() => {
    tokenRef.current += 1;
    Speech.stop();
    setState("idle");
  }, []);

  useFocusEffect(useCallback(() => () => stop(), [stop]));

  return {
    state,
    step: steps[index],
    progress: steps.length ? (index + (state === "finished" ? 1 : 0)) / steps.length : 0,
    start,
    setRate,
    pause,
    resume,
    stop,
  };
}
