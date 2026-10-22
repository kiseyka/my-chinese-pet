// src/components/panda/PandaThoughtSheet.tsx
//
// Реплика панды по тапу на облачко (см. utils/panda/thoughts):
//   phrase        — фраза на китайском, слова разбираются тапом; «Покажи перевод»,
//                   «Понятно» (фраза уходит в коллекцию профиля);
//   riddle/pick   — «Как по-китайски …?» и три иероглифа; после ответа — правильный
//                   с пиньинем, «Понятно»;
//   riddle/write  — «Покажешь, как пишется …?» → «Написать» открывает экран письма.
// У всех — «Не сейчас». Тап мимо панели закрывает её, но мысль остаётся.

import { BottomSheet } from "@/components/ui/BottomSheet";
import { Hanzi } from "@/components/ui/Hanzi";
import { Pinyin } from "@/components/ui/Pinyin";
import { PinyinToggle } from "@/components/ui/PinyinToggle";
import type { Word } from "@/content/flashcards/types";
import { findPandaPhrase } from "@/content/panda/thoughtPhrases";
import { findWord } from "@/content/words/vocabulary";
import { useSpeakHanzi } from "@/hooks/useSpeakHanzi";
import { usePandaStore } from "@/store/pandaStore";
import type { PandaThought } from "@/utils/panda/thoughts";
import { buildReadingExamQuestion } from "@/utils/readingExam";
import { shuffle } from "@/utils/shuffle";
import { useRouter } from "expo-router";
import { useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { PandaPhraseView } from "./PandaPhraseView";

/** Сколько вариантов в загадке (правильный + неправильные). */
const RIDDLE_OPTIONS = 3;

interface PandaThoughtSheetProps {
  thought: PandaThought | null;
  onClose: () => void;
  onLater: () => void;
  onDone: () => void;
}

export function PandaThoughtSheet({
  thought,
  onClose,
  onLater,
  onDone,
}: PandaThoughtSheetProps) {
  return (
    <BottomSheet item={thought} onClose={onClose}>
      {(shown) => (
        // key: новая мысль — новое состояние внутри (ответ, перевод)
        <ThoughtContent
          key={shown.createdAt}
          thought={shown}
          onLater={onLater}
          onDone={onDone}
          onClose={onClose}
        />
      )}
    </BottomSheet>
  );
}

function ThoughtContent({
  thought,
  onLater,
  onDone,
  onClose,
}: {
  thought: PandaThought;
  onLater: () => void;
  onDone: () => void;
  onClose: () => void;
}) {
  if (thought.kind === "phrase") {
    return <PhraseThought thought={thought} onLater={onLater} onDone={onDone} />;
  }

  const word = findWord(thought.wordId);
  // Слово убрали из базы — молча закрываем мысль
  if (!word) {
    return <Actions onLater={onLater} primary={{ label: "OK", onPress: onDone }} />;
  }

  return thought.form === "write" ? (
    <WriteRiddle
      word={word}
      variant={thought.createdAt}
      onLater={onLater}
      onClose={onClose}
    />
  ) : (
    <PickRiddle
      word={word}
      variant={thought.createdAt}
      onLater={onLater}
      onDone={onDone}
    />
  );
}

// ── Фраза ────────────────────────────────────────────────────────────────────

function PhraseThought({
  thought,
  onLater,
  onDone,
}: {
  thought: Extract<PandaThought, { kind: "phrase" }>;
  onLater: () => void;
  onDone: () => void;
}) {
  const { t } = useTranslation("pandaThoughts");
  const phrase = findPandaPhrase(thought.phraseId);
  const [showTranslation, setShowTranslation] = useState(false);
  const [showNote, setShowNote] = useState(false);

  if (!phrase) {
    return <Actions onLater={onLater} primary={{ label: "OK", onPress: onDone }} />;
  }

  const finish = () => {
    usePandaStore.getState().collectPhrase(phrase.id);
    onDone();
  };

  return (
    <View className="gap-5">
      <View className="flex-row items-start justify-between gap-3">
        <Text className="flex-1 font-nunito text-small text-textSecondary">
          {t("phraseHint")}
        </Text>
        <PinyinToggle />
      </View>

      <PandaPhraseView
        phrase={phrase}
        showTranslation={showTranslation}
        showNote={showNote}
      />

      {/* У разговорных фраз — откуда фраза и когда её говорят */}
      {phrase.note && !showNote && (
        <Pressable
          onPress={() => setShowNote(true)}
          hitSlop={8}
          className="-mt-2 self-start active:opacity-60"
          accessibilityRole="button"
        >
          <Text className="font-nunito text-body text-primary">
            {t("whyNote")}
          </Text>
        </Pressable>
      )}

      <Actions
        onLater={onLater}
        secondary={
          showTranslation
            ? undefined
            : { label: t("showTranslation"), onPress: () => setShowTranslation(true) }
        }
        primary={{ label: t("gotIt"), onPress: finish }}
      />
    </View>
  );
}

// ── Загадки ──────────────────────────────────────────────────────────────────

/** Реплика из списка вариантов — одна и та же для одной мысли. */
function useLine(key: string, variant: number, word: string): string {
  const { t } = useTranslation("pandaThoughts");
  const lines = t(key, { returnObjects: true, word }) as unknown;
  if (!Array.isArray(lines) || lines.length === 0) return "";
  return String(lines[variant % lines.length]);
}

function PickRiddle({
  word,
  variant,
  onLater,
  onDone,
}: {
  word: Word;
  variant: number;
  onLater: () => void;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const { t: tp } = useTranslation("pandaThoughts");
  const { speakForced } = useSpeakHanzi();
  const translation = t(word.translation);
  const question = useLine("riddle.pick", variant, translation);
  const praise = useLine("riddle.correct", variant, translation);

  // Похожие иероглифы, как на экзамене по переводу, но вариантов три
  const options = useMemo(() => {
    const { options: all } = buildReadingExamQuestion(word, t);
    const others = all.filter((o) => o.vocabularyId !== word.vocabularyId);
    return shuffle([word, ...others.slice(0, RIDDLE_OPTIONS - 1)]);
    // Варианты собираются один раз на мысль
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word.vocabularyId]);

  const [picked, setPicked] = useState<Word | null>(null);
  const answered = picked !== null;
  const correct = picked?.vocabularyId === word.vocabularyId;

  const pick = (option: Word) => {
    if (answered) return;
    setPicked(option);
    speakForced(word.hanzi);
  };

  return (
    <View className="gap-5">
      <Text className="font-nunito text-title text-text">{question}</Text>

      <View className="flex-row gap-3">
        {options.map((option) => {
          const isAnswer = option.vocabularyId === word.vocabularyId;
          const isPicked = option.vocabularyId === picked?.vocabularyId;
          const style = !answered
            ? "border-primary/30 bg-surface"
            : isAnswer
              ? "border-primary bg-primary/15"
              : isPicked
                ? "border-error bg-error/10"
                : "border-border bg-surface opacity-50";

          return (
            <Pressable
              key={option.vocabularyId}
              onPress={() => pick(option)}
              disabled={answered}
              className={`min-h-20 flex-1 items-center justify-center rounded-2xl border-2 py-3 active:opacity-70 ${style}`}
              accessibilityRole="button"
              accessibilityLabel={option.hanzi}
            >
              <Hanzi size={Array.from(option.hanzi).length > 2 ? 24 : 32}>
                {option.hanzi}
              </Hanzi>
            </Pressable>
          );
        })}
      </View>

      {answered && (
        <View className="gap-1">
          <Text className="font-nunitoBold text-body text-text">
            {correct ? praise : tp("riddle.wrong")}
          </Text>
          <Pressable
            onPress={() => speakForced(word.hanzi)}
            className="flex-row items-center gap-3 self-start active:opacity-70"
          >
            <Hanzi size="sm">{word.hanzi}</Hanzi>
            <Pinyin size="sm">{word.pinyin}</Pinyin>
          </Pressable>
        </View>
      )}

      <Actions
        onLater={answered ? undefined : onLater}
        primary={answered ? { label: tp("gotIt"), onPress: onDone } : undefined}
      />
    </View>
  );
}

function WriteRiddle({
  word,
  variant,
  onLater,
  onClose,
}: {
  word: Word;
  variant: number;
  onLater: () => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const { t: tp } = useTranslation("pandaThoughts");
  const question = useLine("riddle.write", variant, t(word.translation));

  // Мысль закроет экран письма, когда слово будет написано.
  // Ушли с него раньше — облачко останется
  const write = () => {
    onClose();
    router.push({
      pathname: "/panda-riddle",
      params: { wordId: word.vocabularyId },
    });
  };

  return (
    <View className="gap-5">
      <Text className="font-nunito text-title text-text">{question}</Text>
      <Actions onLater={onLater} primary={{ label: tp("write"), onPress: write }} />
    </View>
  );
}

// ── Кнопки ───────────────────────────────────────────────────────────────────

interface ActionButton {
  label: string;
  onPress: () => void;
}

/** «Не сейчас» слева текстом, справа — второстепенная и главная кнопки. */
function Actions({
  onLater,
  secondary,
  primary,
}: {
  onLater?: () => void;
  secondary?: ActionButton;
  primary?: ActionButton;
}): ReactNode {
  const { t } = useTranslation("pandaThoughts");

  return (
    <View className="flex-row flex-wrap items-center justify-end gap-3">
      {onLater && (
        <Pressable
          onPress={onLater}
          hitSlop={8}
          className="mr-auto min-h-12 justify-center active:opacity-60"
          accessibilityRole="button"
        >
          <Text className="font-nunito text-body text-textSecondary">
            {t("later")}
          </Text>
        </Pressable>
      )}
      {secondary && (
        <Pressable
          onPress={secondary.onPress}
          className="min-h-12 justify-center rounded-full border border-primary/30 bg-surface px-5 py-3 active:opacity-70"
          accessibilityRole="button"
        >
          <Text className="font-nunito text-body text-text">
            {secondary.label}
          </Text>
        </Pressable>
      )}
      {primary && (
        <Pressable
          onPress={primary.onPress}
          className="min-h-12 justify-center rounded-full bg-primary px-6 py-3 active:opacity-70"
          accessibilityRole="button"
        >
          <Text className="font-nunito text-body text-white">
            {primary.label}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
