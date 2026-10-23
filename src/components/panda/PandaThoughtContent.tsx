// src/components/panda/PandaThoughtContent.tsx
//
// Реплика панды по тапу на облачко (см. utils/panda/thoughts) — нижняя часть сцены
// разговора /panda-talk (сверху панда, PandaTalkStage):
//   phrase        — фраза на китайском (PandaPhraseView): панда сразу её произносит
//                   (если звук не выключен в настройках); слова — тултипом, перевод,
//                   пояснение; у вопросов — варианты ответа (панда ждёт), после
//                   ответа — её реакция (радуется или удивляется, reaction.mood).
//                   «Понятно» — фраза (и ответ) уходят в коллекцию профиля;
//   riddle/pick   — «Как по-китайски …?» и три иероглифа; после ответа — правильный
//                   с пиньинем, «Понятно»;
//   riddle/write  — «Покажешь, как пишется …?» → «Написать» открывает экран письма.
//
// «Не сейчас» нет: тап по облачку и есть «да». Передумал — «назад»: мысль остаётся,
// облачко ждёт до конца дня.

import { findPandaPhrase } from "@/content/panda/thoughtPhrases";
import { findWord } from "@/content/words/vocabulary";
import { useSpeakHanzi } from "@/hooks/useSpeakHanzi";
import { usePandaStore } from "@/store/pandaStore";
import { phraseText } from "@/utils/panda/phraseSegments";
import type { PandaThought } from "@/utils/panda/thoughts";
import * as Speech from "expo-speech";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { usePandaMood, usePandaWaiting } from "./PandaMood";
import { PandaPhraseView } from "./PandaPhraseView";
import { MainButton, PickRiddle, WriteRiddle } from "./PandaRiddles";

/** Через сколько панда заговорит: сцена успевает появиться. */
const SPEAK_DELAY_MS = 450;

interface ThoughtContentProps {
  thought: PandaThought;
  /** Мысль закрыта ответом — назад к панде. */
  onDone: () => void;
  /** Уходим на другой экран (письмо, этап) — мысль остаётся. */
  onLeave: () => void;
}

export function ThoughtContent({ thought, onDone, onLeave }: ThoughtContentProps) {
  if (thought.kind === "phrase") {
    return <PhraseThought thought={thought} onDone={onDone} onLeave={onLeave} />;
  }

  const word = findWord(thought.wordId);
  // Слово убрали из базы — просто закрываем мысль
  if (!word) return <GotIt onPress={onDone} disabled={false} />;

  return thought.form === "write" ? (
    <WriteRiddle
      word={word}
      variant={thought.createdAt}
      source="thought"
      onClose={onLeave}
    />
  ) : (
    <PickRiddle
      word={word}
      variant={thought.createdAt}
      actions={(answered) => <GotIt onPress={onDone} disabled={!answered} />}
    />
  );
}

// ── Фраза ────────────────────────────────────────────────────────────────────

function PhraseThought({
  thought,
  onDone,
  onLeave,
}: {
  thought: Extract<PandaThought, { kind: "phrase" }>;
  onDone: () => void;
  onLeave: () => void;
}) {
  const phrase = findPandaPhrase(thought.phraseId);
  const [answer, setAnswer] = useState<string | undefined>();
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
    usePandaStore.getState().collectPhrase(phrase.id, answer);
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
