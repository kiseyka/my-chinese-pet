// src/components/panda/PandaRiddles.tsx
//
// Загадки панды — игры из меню панды (PandaPlayContent);
// показываются в сцене разговора /panda-talk, панда отзывается через PandaMood:
//   PickRiddle  — «Как по-китайски …?» и три похожих иероглифа; после ответа —
//                 правильный с пиньинем; если за верный ответ есть опыт — «+N».
//                 listen — вместо перевода панда произносит слово (сразу и по кнопке),
//                 перевод появляется после ответа. Варианты подбирает раунд
//                 (utils/panda/play, pickGuessRound) — здесь их не считаем.
// MainButton — главная кнопка панели (во всю ширину).

import ZapIcon from "@/assets/images/icons/zap.svg";
import { colors } from "@/theme/colors";
import { Hanzi } from "@/components/ui/Hanzi";
import { Pinyin } from "@/components/ui/Pinyin";
import type { Word } from "@/content/flashcards/types";
import { useSpeakHanzi } from "@/hooks/useSpeakHanzi";
import VolumeIcon from "@/assets/images/icons/volume.svg";
import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePandaMood, usePandaWaiting } from "./PandaMood";

/** Реплика из списка вариантов — одна и та же для одной мысли (variant). */
export function useLine(key: string, variant: number, word: string): string {
  const { t } = useTranslation("pandaThoughts");
  const lines = t(key, { returnObjects: true, word }) as unknown;
  if (!Array.isArray(lines) || lines.length === 0) return "";
  return String(lines[variant % lines.length]);
}

export function PickRiddle({
  word,
  options,
  variant,
  reward,
  onAnswer,
  actions,
  top,
  listen = false,
}: {
  word: Word;
  /** Варианты в случайном порядке, среди них word. */
  options: Word[];
  variant: number;
  /** «Послушай и угадай»: вопрос — звук, а не перевод. */
  listen?: boolean;
  /** Опыт за верный ответ (показывается «+N» после ответа). */
  reward?: number;
  /** Ответили: верно или нет. */
  onAnswer?: (correct: boolean) => void;
  /** Кнопки, прибитые к низу экрана; answered — уже ответили. */
  actions: (answered: boolean) => ReactNode;
  /** Над вопросом (например «Загадка 1 из 3»). */
  top?: ReactNode;
}) {
  const { t } = useTranslation();
  const { t: tp } = useTranslation("pandaThoughts");
  const { speakForced } = useSpeakHanzi();
  const insets = useSafeAreaInsets();
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

  const [picked, setPicked] = useState<Word | null>(null);
  const answered = picked !== null;
  const correct = picked?.vocabularyId === word.vocabularyId;

  // Сцена разговора: панда думает над загадкой, потом радуется или удивляется
  usePandaWaiting(!answered, "thinking");
  const { react } = usePandaMood();

  const pick = (option: Word) => {
    if (answered) return;
    setPicked(option);
    react(option.vocabularyId === word.vocabularyId ? "happy" : "surprised");
    speakForced(word.hanzi);
    onAnswer?.(option.vocabularyId === word.vocabularyId);
  };

  // Загадка прокручивается, а кнопки стоят внизу экрана (над панелью навигации
  // Android) и всегда видны — не зависят от длины загадки
  return (
    <View className="flex-1">
      {/* Прокрутка — только если загадка не влезла; без «пружины» на пустом месте */}
      <ScrollView
        className="flex-1"
        overScrollMode="never"
        bounces={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 16,
          gap: 20,
        }}
      >
        {top}
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
            <Text className="flex-1 font-nunito text-title text-text">
              {question}
            </Text>
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
                ? "border-primary bg-learned"
                : isPicked
                  ? "border-wrongBorder bg-wrong"
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

        {/* Ответ появляется под вариантами только после выбора: выше ничего не
            сдвигается, а кнопки стоят отдельно внизу. Заранее место не держим —
            иначе под загадкой была пустая прокрутка. Ошибка: правильное слово и под
            ним выбранное — с пиньинем и переводом */}
        {answered && (
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1 gap-2">
              <Text className="font-nunitoBold text-body text-text">
                {correct ? praise : tp("riddle.wrong")}
              </Text>
              <AnswerWord
                word={word}
                right
                translation={listen ? translation : undefined}
                disabled={false}
                onSpeak={() => speakForced(word.hanzi)}
              />
              {picked && !correct && (
                <View className="gap-1">
                  <Text className="font-nunito text-small text-textSecondary">
                    {tp("riddle.yourAnswer")}
                  </Text>
                  <AnswerWord
                    word={picked}
                    translation={t(picked.translation)}
                    wrong
                    disabled={false}
                    onSpeak={() => speakForced(picked.hanzi)}
                  />
                </View>
              )}
            </View>
            {!!reward && correct && <RewardBadge xp={reward} />}
          </View>
        )}
      </ScrollView>

      {/* Кнопки — прибиты к низу экрана */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: insets.bottom + 16,
        }}
      >
        {actions(answered)}
      </View>
    </View>
  );
}

/**
 * Слово в ответе загадки: иероглиф, пиньинь и (если есть) перевод; тап — озвучка.
 * right — правильный ответ: крупно, в зелёной рамке, чтобы не терялся рядом с ошибкой.
 * wrong — выбранное по ошибке: мельче и тише, красная полоска слева.
 */
function AnswerWord({
  word,
  translation,
  right = false,
  wrong = false,
  disabled,
  onSpeak,
}: {
  word: Word;
  translation?: string;
  right?: boolean;
  wrong?: boolean;
  disabled: boolean;
  onSpeak: () => void;
}) {
  const box = right
    ? "rounded-2xl border-2 border-primary bg-learned px-4 py-2"
    : wrong
      ? "border-l-2 border-wrongBorder pl-2"
      : "";
  return (
    <Pressable
      onPress={onSpeak}
      disabled={disabled}
      className={`gap-0.5 self-start active:opacity-70 ${box}`}
    >
      <View className="flex-row items-center gap-3">
        <Hanzi size={right ? "md" : "sm"}>{word.hanzi}</Hanzi>
        <Pinyin size={right ? "md" : "sm"}>{word.pinyin}</Pinyin>
      </View>
      {translation !== undefined && (
        <Text
          className={`font-nunito ${right ? "text-body text-text" : "text-small text-textSecondary"}`}
          numberOfLines={2}
        >
          {translation}
        </Text>
      )}
    </Pressable>
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
