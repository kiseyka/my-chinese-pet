// src/components/panda/PandaTalkStage.tsx
//
// Панда крупным планом в сцене разговора (/panda-talk): отдельный файл
// assets/motion/panda_talk.riv (артборд 400×320, прозрачный фон — за ним цвет сцены).
// State Machine 1, входы:
//   talking   (bool)    — говорит: пока звучит озвучка (store/speechStore);
//   listening (bool)    — ждёт ответа (PandaMood.setListening);
//   happy     (trigger) — обрадовалась (PandaMood.react("happy"));
//   surprised (trigger) — удивилась / ошибка (PandaMood.react("surprised")).
// Решает приложение, Rive только показывает. Пока у входов нет анимаций, ничего
// не происходит — дорисуешь в Rive, код трогать не нужно.

import { useSpeechStore } from "@/store/speechStore";
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import Rive, { Fit, type RiveRef } from "rive-react-native";
import type { PandaReaction } from "./PandaMood";

const STATE_MACHINE = "State Machine 1";
/** Пропорция артборда panda_talk (ширина / высота). */
export const TALK_STAGE_RATIO = 400 / 320;

interface PandaTalkStageProps {
  listening: boolean;
  /** Последняя реакция; id меняется на каждую новую, даже такую же. */
  reaction: { kind: PandaReaction; id: number } | null;
}

export function PandaTalkStage({ listening, reaction }: PandaTalkStageProps) {
  const ref = useRef<RiveRef>(null);
  const [ready, setReady] = useState(false);
  const talking = useSpeechStore((s) => s.speakingId !== 0);

  const setBool = (name: string, value: boolean) => {
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
    if (ready) setBool("listening", listening);
  }, [ready, listening]);

  useEffect(() => {
    if (!ready || !reaction) return;
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
        source={require("@/assets/motion/panda_talk.riv")}
        stateMachineName={STATE_MACHINE}
        fit={Fit.Contain}
        style={{ width: "100%", height: "100%" }}
        onPlay={() => setReady(true)}
      />
    </View>
  );
}
