// src/components/panda/PandaTalkStage.tsx
//
// Панда крупным планом в сцене разговора (/panda-talk): отдельный файл
// assets/motion/panda_talk_thinking.riv (артборд 400×320, прозрачный фон — за ним цвет
// сцены). Сейчас в нём только вход thinking; остальные добавляй в этот же файл.
// State Machine 1, входы:
//   talking   (bool)    — говорит: пока звучит озвучка (store/speechStore);
//   listening (bool)    — ждёт ответа на свой вопрос (PandaMood.setWaiting("listening"));
//   thinking  (bool)    — думает над загадкой (PandaMood.setWaiting("thinking"));
//   happy     (trigger) — обрадовалась (PandaMood.react("happy"));
//   surprised (trigger) — удивилась / ошибка (PandaMood.react("surprised")).
// Решает приложение, Rive только показывает. Пока у входов нет анимаций, ничего
// не происходит — дорисуешь в Rive, код трогать не нужно.
//
// ВАЖНО: вход, которого нет в .riv, на Android роняет приложение (ошибка уходит из
// нативного кода, try/catch в JS её не ловит). Поэтому код трогает только входы из
// RIVE_INPUTS — добавила вход в Rive, допиши его сюда. Плюс onError: другие ошибки
// Rive приходят в JS и пишутся в лог, а не роняют приложение.

import { useSpeechStore } from "@/store/speechStore";
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import Rive, { Fit, type RiveRef } from "rive-react-native";
import type { PandaReaction, PandaWaiting } from "./PandaMood";

const STATE_MACHINE = "State Machine 1";

/**
 * Входы, которые точно есть в файле сцены. Добавишь вход в Rive — допиши сюда:
 * "talking", "listening", "happy", "surprised".
 */
const RIVE_INPUTS = new Set<string>(["thinking"]);
/** Пропорция артборда panda_talk (ширина / высота). */
export const TALK_STAGE_RATIO = 400 / 320;

interface PandaTalkStageProps {
  /** Ждёт ответа: слушает (вопрос) или думает (загадка). */
  waiting: PandaWaiting | null;
  /** Последняя реакция; id меняется на каждую новую, даже такую же. */
  reaction: { kind: PandaReaction; id: number } | null;
}

export function PandaTalkStage({ waiting, reaction }: PandaTalkStageProps) {
  const ref = useRef<RiveRef>(null);
  const [ready, setReady] = useState(false);
  const talking = useSpeechStore((s) => s.speakingId !== 0);

  const setBool = (name: string, value: boolean) => {
    if (!RIVE_INPUTS.has(name)) return;
    try {
      ref.current?.setInputState(STATE_MACHINE, name, value);
    } catch {
      // Входа нет в файле — просто ничего не показываем
    }
  };

  useEffect(() => {
    if (ready) setBool("talking", talking);
  }, [ready, talking]);

  useEffect(() => {
    if (!ready) return;
    setBool("listening", waiting === "listening");
    setBool("thinking", waiting === "thinking");
  }, [ready, waiting]);

  useEffect(() => {
    if (!ready || !reaction || !RIVE_INPUTS.has(reaction.kind)) return;
    try {
      ref.current?.fireState(STATE_MACHINE, reaction.kind);
    } catch {
      // См. setBool
    }
  }, [ready, reaction]);

  return (
    <View style={{ width: "100%", aspectRatio: TALK_STAGE_RATIO }}>
      <Rive
        ref={ref}
        source={require("@/assets/motion/panda_talk_thinking.riv")}
        stateMachineName={STATE_MACHINE}
        fit={Fit.Contain}
        style={{ width: "100%", height: "100%" }}
        onPlay={() => setReady(true)}
        onError={(error) => console.warn("panda_talk.riv:", error.message)}
      />
    </View>
  );
}
