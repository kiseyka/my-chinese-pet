// src/components/panda/PandaRiddles.tsx
//
// Загадки панды — общие для мысли с облачком и для игры по тапу (PandaPlayContent);
// показываются в сцене разговора /panda-talk, панда отзывается через PandaMood:
//   PickRiddle  — «Как по-китайски …?» и три похожих иероглифа; после ответа —
//                 правильный с пиньинем; если за верный ответ есть опыт — «+N».
//                 listen — вместо перевода панда произносит слово (сразу и по кнопке),
//                 перевод появляется после ответа;
//   WriteRiddle — «Покажешь, как пишется …?» → экран письма /panda-riddle: «Написать»
//                 (по памяти) или «Не помню — по контуру».
// MainButton — главная кнопка панели (во всю ширину).

import ZapIcon from "@/assets/images/icons/zap.svg";
import { colors } from "@/theme/colors";
import { Hanzi } from "@/components/ui/Hanzi";
import { Pinyin } from "@/components/ui/Pinyin";
import type { Word } from "@/content/flashcards/types";
import { useSpeakHanzi } from "@/hooks/useSpeakHanzi";
import { buildReadingExamQuestion } from "@/utils/readingExam";
import { shuffle } from "@/utils/shuffle";
import { useRouter } from "expo-router";
import VolumeIcon from "@/assets/images/icons/volume.svg";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { usePandaListening, usePandaMood } from "./PandaMood";

/** Сколько вариантов в загадке (правильный + неправильные). */
const RIDDLE_OPTIONS = 3;

/** Реплика из списка вариантов — одна и та же для одной мысли (variant). */
export function useLine(key: string, variant: number, word: string): string {
  const { t } = useTranslation("pandaThoughts");
  const lines = t(key, { returnObjects: true, word }) as unknown;
  if (!Array.isArray(lines) || lines.length === 0) return "";
  return String(lines[variant % lines.length]);
}

export function PickRiddle({
  word,
  variant,
  reward,
  onAnswer,
  actions,
  listen = false,
}: {
  word: Word;
  variant: number;
  /** «Послушай и угадай»: вопрос — звук, а не перевод. */
  listen?: boolean;
  /** Опыт за верный ответ (показывается «+N» после ответа). */
  reward?: number;
  /** Ответили: верно или нет. */
  onAnswer?: (correct: boolean) => void;
  /** Кнопки снизу; answered — уже ответили. */
  actions: (answered: boolean) => ReactNode;
}) {
  const { t } = useTranslation();
  const { t: tp } = useTranslation("pandaThoughts");
  const { speakForced } = useSpeakHanzi();
  const translation = t(word.translation);
  const question = useLine(
    listen ? "riddle.listen" : "riddle.pick",
    variant,
    translation,
  );

  // Послушай и угадай: панда сразу произносит слово
  useEffect(() => {
    if (listen) speakForced(word.hanzi, { rate: 0.8 });
    // Один раз на загадку
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const praise = useLine("riddle.correct", variant, translation);

  // Похожие иероглифы, как на экзамене по переводу, но вариантов три
  const options = useMemo(() => {
    const { options: all } = buildReadingExamQuestion(word, t);
    const others = all.filter((o) => o.vocabularyId !== word.vocabularyId);
    return shuffle([word, ...others.slice(0, RIDDLE_OPTIONS - 1)]);
    // Варианты собираются один раз на загадку
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word.vocabularyId]);

  const [picked, setPicked] = useState<Word | null>(null);
  const answered = picked !== null;
  const correct = picked?.vocabularyId === word.vocabularyId;

  // Сцена разговора: панда ждёт ответа, потом радуется или удивляется
  usePandaListening(!answered);
  const { react } = usePandaMood();

  const pick = (option: Word) => {
    if (answered) return;
    setPicked(option);
    react(option.vocabularyId === word.vocabularyId ? "happy" : "surprised");
    speakForced(word.hanzi);
    onAnswer?.(option.vocabularyId === word.vocabularyId);
  };

  return (
    <View className="gap-5">
      {listen ? (
        <View className="flex-row items-center gap-4">
          <Pressable
            onPress={() => speakForced(word.hanzi, { rate: 0.8 })}
            className="h-16 w-16 items-center justify-center rounded-full bg-primary active:opacity-70"
            accessibilityRole="button"
            accessibilityLabel={tp("listen")}
          >
            <VolumeIcon width={30} height={30} color="#FFFFFF" />
          </Pressable>
          <Text className="flex-1 font-nunito text-title text-text">{question}</Text>
        </View>
      ) : (
        <Text className="font-nunito text-title text-text">{question}</Text>
      )}

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

      {/* Место под ответом есть всегда — окно не прыгает после выбора */}
      <View
        className={`flex-row items-start justify-between gap-3 ${listen ? "min-h-24" : "min-h-16"}`}
        style={{ opacity: answered ? 1 : 0 }}
      >
        <View className="flex-1 gap-1">
          <Text className="font-nunitoBold text-body text-text">
            {correct ? praise : tp("riddle.wrong")}
          </Text>
          <Pressable
            onPress={() => speakForced(word.hanzi)}
            disabled={!answered}
            className="flex-row items-center gap-3 self-start active:opacity-70"
          >
            <Hanzi size="sm">{word.hanzi}</Hanzi>
            <Pinyin size="sm">{word.pinyin}</Pinyin>
          </Pressable>
          {listen && (
            <Text className="font-nunito text-small text-textSecondary" numberOfLines={2}>
              {translation}
            </Text>
          )}
        </View>
        {!!reward && correct && <RewardBadge xp={reward} />}
      </View>

      {actions(answered)}
    </View>
  );
}

export function WriteRiddle({
  word,
  variant,
  source,
  onClose,
}: {
  word: Word;
  variant: number;
  /** thought — мысль с облачком; play — игра по тапу (с наградой). */
  source: "thought" | "play";
  onClose: () => void;
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const { t: tp } = useTranslation("pandaThoughts");
  const question = useLine("riddle.write", variant, t(word.translation));

  const write = (outline: boolean) => {
    onClose();
    router.push({
      pathname: "/panda-riddle",
      params: { wordId: word.vocabularyId, source, ...(outline && { outline: "1" }) },
    });
  };

  return (
    <View className="gap-5">
      <Text className="font-nunito text-title text-text">{question}</Text>
      {/* Не помнишь — можно написать по контуру */}
      <View className="flex-row gap-3">
        <MainButton
          label={tp("writeOutline")}
          variant="secondary"
          onPress={() => write(true)}
        />
        <MainButton label={tp("write")} onPress={() => write(false)} />
      </View>
    </View>
  );
}

/** «+1 ⚡» — сколько опыта дала игра (значок — как у опыта в профиле). */
export function RewardBadge({ xp }: { xp: number }) {
  return (
    <View className="flex-row items-center gap-1 rounded-full bg-primary/15 px-3 py-1">
      <Text className="font-nunitoBold text-body text-text">+{xp}</Text>
      <ZapIcon width={18} height={18} color={colors.primary} />
    </View>
  );
}

export function MainButton({
  label,
  onPress,
  disabled = false,
  variant = "primary",
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
}) {
  const primary = variant === "primary";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`min-h-12 flex-1 items-center justify-center rounded-full px-6 py-3 active:opacity-70 ${
        primary ? "bg-primary" : "border border-primary/40 bg-surface"
      } ${disabled ? "opacity-40" : ""}`}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      <Text
        className={`font-nunito text-body ${primary ? "text-white" : "text-text"}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
