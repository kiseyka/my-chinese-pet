// src/components/game/SelfCheckQuestion.tsx
//
// Вопрос самопроверки: иероглиф и пиньинь (тап — озвучка), под ними место перевода.
// До ответа — три кнопки «Знаю» / «Сомневаюсь» / «Не знаю».
// После ответа — перевод, что ответил пользователь, «Добавить в повторение»
// (кроме «Знаю») и «Дальше».
// Иероглиф и место перевода не двигаются: меняется только низ экрана.

import ReviewIcon from "@/assets/images/icons/bookmark-plus.svg";
import { ToggleCard } from "@/components/word/ToggleCard";
import { useSpeakHanzi } from "@/hooks/useSpeakHanzi";
import { interopIconColor } from "@/lib/interopIcon";
import type { SelfCheckAnswer } from "@/store/gameStore";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, TouchableOpacity, View } from "react-native";

interopIconColor(ReviewIcon);

const ANSWERS: { key: SelfCheckAnswer; label: string }[] = [
  { key: "know", label: "Знаю" },
  { key: "unsure", label: "Сомневаюсь" },
  { key: "dont", label: "Не знаю" },
];

const ANSWER_LABEL: Record<SelfCheckAnswer, string> = {
  know: "Твой ответ: знаю",
  unsure: "Твой ответ: сомневаюсь",
  dont: "Твой ответ: не знаю",
};

// Размер шрифта по количеству иероглифов (индекс = длина) — как в выборе перевода
const HANZI_FONT_SIZES = [84, 84, 84, 68, 56, 46, 40];
const HANZI_MIN_FONT_SIZE = 34;
const HANZI_BLOCK_HEIGHT = 180;

interface SelfCheckQuestionProps {
  hanzi: string;
  pinyin: string;
  /** Ключ перевода. */
  translation: string;
  showPinyin: boolean;
  answer: SelfCheckAnswer | null;
  isLast: boolean;
  inReview: boolean;
  onToggleReview: () => void;
  onAnswer: (answer: SelfCheckAnswer) => void;
  onNext: () => void;
}

export function SelfCheckQuestion({
  hanzi,
  pinyin,
  translation,
  showPinyin,
  answer,
  isLast,
  inReview,
  onToggleReview,
  onAnswer,
  onNext,
}: SelfCheckQuestionProps) {
  const { t } = useTranslation(["sets"]);
  const { speak, speakForced } = useSpeakHanzi();

  const fontSize =
    HANZI_FONT_SIZES[Array.from(hanzi).length] ?? HANZI_MIN_FONT_SIZE;

  useEffect(() => {
    speak(hanzi);
  }, [hanzi, speak]);

  return (
    <View className="flex-1">
      {/* Слово */}
      <View
        style={{ height: HANZI_BLOCK_HEIGHT }}
        className="items-center justify-center"
      >
        <TouchableOpacity
          onPress={() => speakForced(hanzi)}
          activeOpacity={0.6}
          accessibilityRole="button"
          accessibilityLabel={`${hanzi}: послушать`}
        >
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.4}
            className="mb-4 mt-8 text-text"
            style={{
              lineHeight: fontSize * 1.2,
              fontSize,
              textAlign: "center",
              fontFamily: "NotoSansSC",
            }}
          >
            {hanzi}
          </Text>
        </TouchableOpacity>

        <Text
          className="text-center text-xl text-primary"
          style={{ opacity: showPinyin ? 1 : 0 }}
        >
          {pinyin}
        </Text>
      </View>

      {/* Перевод: место занято всегда, чтобы ничего не прыгало */}
      <View className="mt-6 min-h-24 items-center justify-center rounded-2xl bg-surface px-5 py-4">
        {answer ? (
          <>
            <Text
              className="text-center font-nunitoBold text-title text-text"
              numberOfLines={3}
              adjustsFontSizeToFit
            >
              {t(translation)}
            </Text>
            <Text className="mt-1 text-center font-nunito text-small text-textSecondary">
              {ANSWER_LABEL[answer]}
            </Text>
          </>
        ) : (
          <Text className="text-center font-nunito text-body text-textSecondary">
            Вспомни перевод — он появится после ответа
          </Text>
        )}
      </View>

      <View className="flex-1" />

      {/* Низ экрана */}
      {answer ? (
        <View className="gap-3 pb-2">
          {answer !== "know" && (
            <ToggleCard
              icon={
                <ReviewIcon width={26} height={26} className="text-primary" />
              }
              label={inReview ? "В повторении" : "Добавить в повторение"}
              checked={inReview}
              onPress={onToggleReview}
            />
          )}
          <Pressable
            onPress={onNext}
            className="min-h-14 items-center justify-center rounded-2xl bg-primary px-5 active:opacity-80"
            accessibilityRole="button"
          >
            <Text className="font-nunitoBold text-body text-white">
              {isLast ? "Завершить" : "Дальше"}
            </Text>
          </Pressable>
        </View>
      ) : (
        <View className="gap-3 pb-2">
          {ANSWERS.map(({ key, label }) => (
            <Pressable
              key={key}
              onPress={() => onAnswer(key)}
              className={`min-h-14 items-center justify-center rounded-2xl px-5 active:opacity-80 ${
                key === "know" ? "bg-primary" : "border border-primary/30 bg-surface"
              }`}
              accessibilityRole="button"
            >
              <Text
                className={`font-nunitoBold text-body ${
                  key === "know" ? "text-white" : "text-text"
                }`}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
