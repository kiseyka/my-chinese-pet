// src/components/panda/PandaThoughtContent.tsx
//
// Фраза дня (см. utils/panda/thoughts) — нижняя часть сцены разговора /panda-talk
// (сверху панда, PandaTalkStage). Фраза на китайском (PandaPhraseView): панда сразу её
// произносит (если звук не выключен в настройках); слова — тултипом, перевод,
// пояснение; у вопросов — варианты ответа (панда ждёт), после ответа — её реакция
// (радуется или удивляется, reaction.mood).
//
//   новая фраза — «Понятно»: фраза (и ответ) уходят в «Фразы дня» профиля;
//   ещё раз     — фраза, прочитанная сегодня, открытая из меню игр: ответ уже
//                 выбран, «Понятно» просто возвращает в меню.

import { findPandaPhrase } from "@/content/panda/thoughtPhrases";
import { useSpeakHanzi } from "@/hooks/useSpeakHanzi";
import { usePandaStore } from "@/store/pandaStore";
import { phraseText } from "@/utils/panda/phraseSegments";
import * as Speech from "expo-speech";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { usePandaMood, usePandaWaiting } from "./PandaMood";
import { PandaPhraseView } from "./PandaPhraseView";
import { MainButton } from "./PandaRiddles";

/** Через сколько панда заговорит: сцена успевает появиться. */
const SPEAK_DELAY_MS = 450;

interface PhraseOfDayProps {
  phraseId: string;
  /** true — фразу уже читали сегодня: не собирать заново, ответ показать сразу. */
  again?: boolean;
  /** false — фраза о комнате: в «Фразы дня» не кладём. */
  collect?: boolean;
  /** «Понятно». */
  onDone: () => void;
  /** Уходим на другой экран (этап из тултипа слова). */
  onLeave: () => void;
}

export function PhraseOfDay({
  phraseId,
  again = false,
  collect = true,
  onDone,
  onLeave,
}: PhraseOfDayProps) {
  const phrase = findPandaPhrase(phraseId);
  const [answer, setAnswer] = useState<string | undefined>(() =>
    again ? usePandaStore.getState().answers[phraseId] : undefined,
  );
  const { speak } = useSpeakHanzi();
  const { react } = usePandaMood();

  // У вопроса панда ждёт ответа
  const waitsForAnswer = !!phrase?.replies && !answer;
  usePandaWaiting(waitsForAnswer, "listening");

  // Панда сразу говорит фразу; ушли со сцены — замолкает
  useEffect(() => {
    if (!phrase) return;
    const timer = setTimeout(() => speak(phraseText(phrase)), SPEAK_DELAY_MS);
    return () => {
      clearTimeout(timer);
      Speech.stop();
    };
  }, [phrase, speak]);

  if (!phrase) return <GotIt onPress={onDone} disabled={false} />;

  const pickAnswer = (replyId: string) => {
    setAnswer(replyId);
    const reply = phrase.replies?.find((r) => r.id === replyId);
    react(reply?.reaction?.mood ?? "happy");
  };

  const finish = () => {
    Speech.stop();
    if (!again && collect) usePandaStore.getState().collectPhrase(phrase.id, answer);
    onDone();
  };

  return (
    <View className="gap-5">
      <PandaPhraseView
        phrase={phrase}
        answer={answer}
        onAnswer={pickAnswer}
        from="pet"
        onLeave={() => {
          Speech.stop();
          onLeave();
        }}
      />
      <GotIt onPress={finish} disabled={waitsForAnswer} />
    </View>
  );
}

function GotIt({ onPress, disabled }: { onPress: () => void; disabled: boolean }) {
  const { t } = useTranslation("pandaThoughts");
  return (
    <View className="flex-row">
      <MainButton label={t("gotIt")} onPress={onPress} disabled={disabled} />
    </View>
  );
}
