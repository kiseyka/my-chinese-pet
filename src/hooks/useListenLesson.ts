// src/hooks/useListenLesson.ts
//
// Проигрывает сценарий «Слушай и повторяй» (utils/listen/script.ts).
//
//   Китайский — файлы Kokoro (content/audio/zhAudio.ts) через expo-audio:
//     один плеер на весь урок, источник меняется replace().
//   Перевод — системный голос через expo-speech (язык интерфейса).
//   Паузы — таймеры.
//
// Фон и экран блокировки: на время урока аудиосессия играет в фоне
// (shouldPlayInBackground) и плеер выведен на экран блокировки — на Android без
// этого фоновый звук обрывается примерно через 3 минуты. Режим doNotMix: другие
// приложения на время урока замолкают. После урока всё возвращается обратно.
//
// Пауза: останавливает текущий шаг; «Продолжить» начинает этот шаг заново.
// Уход с экрана останавливает урок; выключенный экран телефона — нет.
// Кнопки на экране блокировки управляют только звуком слова, сценарий они не двигают.

import { ZH_AUDIO } from "@/content/audio/zhAudio";
import type { Word } from "@/content/flashcards/types";
import { buildListenScript, repeatPauseMs, type ListenStep } from "@/utils/listen/script";
import { setAudioModeAsync, useAudioPlayer, type AudioPlayer } from "expo-audio";
import * as Speech from "expo-speech";
import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export type ListenState = "idle" | "playing" | "paused" | "finished";

const LOCK_SCREEN_TITLE = "Слушай и повторяй";

/** Проиграть файл до конца. Возвращает длину в мс (0 — если не узнали). */
function playClip(player: AudioPlayer, source: number, isSame: boolean): Promise<number> {
  return new Promise((resolve) => {
    let done = false;
    let durationMs = 0;
    const finish = () => {
      if (done) return;
      done = true;
      sub.remove();
      clearTimeout(fallback);
      resolve(durationMs);
    };
    const sub = player.addListener("playbackStatusUpdate", (status) => {
      if (status.duration > 0) durationMs = status.duration * 1000;
      if (status.didJustFinish) finish();
    });
    // Страховка: событие конца потерялось — не зависаем
    const fallback = setTimeout(finish, 8000);

    if (isSame) {
      player.seekTo(0).then(() => player.play());
    } else {
      player.replace(source);
      player.play();
    }
  });
}

function speak(text: string, language: string): Promise<void> {
  return new Promise((resolve) => {
    Speech.speak(text, {
      language,
      onDone: () => resolve(),
      onStopped: () => resolve(),
      onError: () => resolve(),
    });
  });
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function useListenLesson() {
  const { t, i18n } = useTranslation(["sets"]);
  const player = useAudioPlayer(null);

  const [state, setState] = useState<ListenState>("idle");
  const [steps, setSteps] = useState<ListenStep[]>([]);
  const [index, setIndex] = useState(0);

  const stepsRef = useRef<ListenStep[]>([]);
  const indexRef = useRef(0);
  /** Меняется при паузе/остановке: старый цикл видит чужой токен и выходит. */
  const tokenRef = useRef(0);
  const lastClipMs = useRef(0);
  const currentSource = useRef<number | null>(null);

  const translationLanguage = i18n.language?.startsWith("en") ? "en-US" : "ru-RU";

  const run = useCallback(
    async (token: number) => {
      const alive = () => tokenRef.current === token;

      while (indexRef.current < stepsRef.current.length) {
        const step = stepsRef.current[indexRef.current];
        setIndex(indexRef.current);

        switch (step.kind) {
          case "zh": {
            const source = ZH_AUDIO[step.word.vocabularyId];
            player.updateLockScreenMetadata({
              title: `${step.word.hanzi} · ${step.word.pinyin}`,
              artist: LOCK_SCREEN_TITLE,
            });
            const ms = await playClip(player, source, currentSource.current === source);
            currentSource.current = source;
            if (ms > 0) lastClipMs.current = ms;
            break;
          }
          case "translation":
            await speak(t(step.word.translation), translationLanguage);
            break;
          case "repeat":
            await wait(repeatPauseMs(lastClipMs.current || 800));
            break;
          case "gap":
            await wait(step.ms);
            break;
        }

        if (!alive()) return;
        indexRef.current += 1;
      }

      setState("finished");
      player.clearLockScreenControls();
      setAudioModeAsync({ shouldPlayInBackground: false, interruptionMode: "mixWithOthers" });
    },
    [player, t, translationLanguage],
  );

  const start = useCallback(
    async (words: Word[], withTranslation: boolean) => {
      const script = buildListenScript(words, withTranslation);
      stepsRef.current = script;
      indexRef.current = 0;
      currentSource.current = null;
      setSteps(script);
      setIndex(0);

      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        interruptionMode: "doNotMix",
      });
      player.setActiveForLockScreen(true, { title: LOCK_SCREEN_TITLE });

      setState("playing");
      run(++tokenRef.current);
    },
    [player, run],
  );

  const pause = useCallback(() => {
    tokenRef.current += 1;
    player.pause();
    Speech.stop();
    setState("paused");
  }, [player]);

  const resume = useCallback(() => {
    setState("playing");
    run(++tokenRef.current);
  }, [run]);

  /** Остановить урок и вернуть звук как был. */
  const stop = useCallback(() => {
    tokenRef.current += 1;
    player.pause();
    Speech.stop();
    player.clearLockScreenControls();
    setAudioModeAsync({ shouldPlayInBackground: false, interruptionMode: "mixWithOthers" });
    setState("idle");
  }, [player]);

  // Ушли с экрана (назад, на другую вкладку) — урок останавливается.
  // Выключенный экран телефона — не уход: урок играет дальше.
  useFocusEffect(useCallback(() => () => stop(), [stop]));

  const step = steps[index];
  return {
    state,
    step,
    progress: steps.length ? (index + (state === "finished" ? 1 : 0)) / steps.length : 0,
    start,
    pause,
    resume,
    stop,
  };
}
