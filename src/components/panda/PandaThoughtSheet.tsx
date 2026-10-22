// src/components/panda/PandaThoughtSheet.tsx
//
// Реплика панды по тапу на облачко (см. utils/panda/thoughts):
//   phrase        — фраза на китайском (PandaPhraseView): слова — тултипом, перевод,
//                   пояснение; у вопросов — варианты ответа и реакция панды.
//                   «Понятно» — фраза (и ответ) уходят в коллекцию профиля;
//   riddle/pick   — «Как по-китайски …?» и три иероглифа; после ответа — правильный
//                   с пиньинем, «Понятно»;
//   riddle/write  — «Покажешь, как пишется …?» → «Написать» открывает экран письма.
//
// «Не сейчас» нет: тап по облачку и есть «да». Передумал — смахни панель или тапни
// мимо: мысль остаётся, облачко ждёт до конца дня.

import { BottomSheet } from "@/components/ui/BottomSheet";
import { findPandaPhrase } from "@/content/panda/thoughtPhrases";
import { findWord } from "@/content/words/vocabulary";
import { usePandaStore } from "@/store/pandaStore";
import type { PandaThought } from "@/utils/panda/thoughts";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { PandaPhraseView } from "./PandaPhraseView";
import { MainButton, PickRiddle, WriteRiddle } from "./PandaRiddles";

interface PandaThoughtSheetProps {
  thought: PandaThought | null;
  onClose: () => void;
  onDone: () => void;
}

export function PandaThoughtSheet({
  thought,
  onClose,
  onDone,
}: PandaThoughtSheetProps) {
  return (
    <BottomSheet item={thought} onClose={onClose}>
      {(shown) => (
        // key: новая мысль — новое состояние внутри (ответ, перевод)
        <ThoughtContent
          key={shown.createdAt}
          thought={shown}
          onDone={onDone}
          onClose={onClose}
        />
      )}
    </BottomSheet>
  );
}

function ThoughtContent({
  thought,
  onDone,
  onClose,
}: {
  thought: PandaThought;
  onDone: () => void;
  onClose: () => void;
}) {
  if (thought.kind === "phrase") {
    return <PhraseThought thought={thought} onDone={onDone} onClose={onClose} />;
  }

  const word = findWord(thought.wordId);
  // Слово убрали из базы — просто закрываем мысль
  if (!word) return <GotIt onPress={onDone} disabled={false} />;

  return thought.form === "write" ? (
    <WriteRiddle
      word={word}
      variant={thought.createdAt}
      source="thought"
      onClose={onClose}
    />
  ) : (
    <PickRiddle
      word={word}
      variant={thought.createdAt}
      actions={(answered) => (
        <GotIt onPress={onDone} disabled={!answered} />
      )}
    />
  );
}

// ── Фраза ────────────────────────────────────────────────────────────────────

function PhraseThought({
  thought,
  onDone,
  onClose,
}: {
  thought: Extract<PandaThought, { kind: "phrase" }>;
  onDone: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation("pandaThoughts");
  const phrase = findPandaPhrase(thought.phraseId);
  const [answer, setAnswer] = useState<string | undefined>();

  if (!phrase) return <GotIt onPress={onDone} disabled={false} />;

  // У вопроса «Понятно» — после ответа
  const waitsForAnswer = !!phrase.replies && !answer;

  const finish = () => {
    usePandaStore.getState().collectPhrase(phrase.id, answer);
    onDone();
  };

  return (
    <View className="gap-5">
      <PandaPhraseView
        phrase={phrase}
        answer={answer}
        onAnswer={setAnswer}
        from="pet"
        onLeave={onClose}
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
