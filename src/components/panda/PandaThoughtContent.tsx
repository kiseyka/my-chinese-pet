// src/components/panda/PandaThoughtContent.tsx
//
// Фраза дня (см. utils/panda/thoughts) — нижняя часть сцены разговора /panda-talk
// (без панды крупным планом). Фраза на китайском (PandaPhraseView): панда сразу её
// произносит (если звук не выключен в настройках); слова — тултипом, перевод,
// пояснение; у вопросов — варианты ответа, после ответа — реакция панды.
//
//   новая фраза — «Продолжить»: фраза (и ответ) уходят в «Фразы дня» профиля,
//                 дальше меню игр;
//   ещё раз     — фраза, прочитанная сегодня, открытая из меню игр: ответ уже
//                 выбран, «Продолжить» просто возвращает в меню.

import { findPandaPhrase } from "@/content/panda/thoughtPhrases";
import { useSpeakHanzi } from "@/hooks/useSpeakHanzi";
import { usePandaStore } from "@/store/pandaStore";
import { phraseText } from "@/utils/panda/phraseSegments";
import * as Speech from "expo-speech";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
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
  /** «Продолжить». */
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

  // У вопроса «Продолжить» — только после ответа
  const waitsForAnswer = !!phrase?.replies && !answer;

  // Панда сразу говорит фразу; ушли со сцены — замолкает
  useEffect(() => {
    if (!phrase) return;
    const timer = setTimeout(() => speak(phraseText(phrase)), SPEAK_DELAY_MS);
    return () => {
      clearTimeout(timer);
      Speech.stop();
    };
  }, [phrase, speak]);

  if (!phrase) return <Continue onPress={onDone} disabled={false} />;

  const pickAnswer = (replyId: string) => setAnswer(replyId);

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
      <Continue onPress={finish} disabled={waitsForAnswer} />
    </View>
  );
}

/** «Продолжить» — дальше меню игр. */
function Continue({ onPress, disabled }: { onPress: () => void; disabled: boolean }) {
  const { t } = useTranslation("pandaThoughts");
  return (
    <View className="flex-row">
      <MainButton label={t("continue")} onPress={onPress} disabled={disabled} />
    </View>
  );
}
