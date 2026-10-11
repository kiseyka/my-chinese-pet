// src/components/writing/ReviewCard.tsx
//
// Карточка «Повторение»: сколько слов отмечено, сетка этих слов (приходит через children),
// подсказка, сколько из них попадёт в тренировку, и кнопка старта.

import ReviewIcon from "@/assets/images/icons/bookmark.svg";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

/** Внутренний отступ карточки (p-4) с двух сторон: на столько сетке внутри меньше места. */
export const REVIEW_CARD_INSET = 32;

/** 1 слово, 2 слова, 5 слов, 11 слов, 21 слово. */
function pluralWords(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "слово";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "слова";
  return "слов";
}

interface ReviewCardProps {
  /** Сколько слов отмечено для повтора. */
  total: number;
  /** Сколько слов берётся в одну тренировку. */
  lessonSize: number;
  onStart: () => void;
  /** Сетка отмеченных слов. */
  children: ReactNode;
}

export function ReviewCard({
  total,
  lessonSize,
  onStart,
  children,
}: ReviewCardProps) {
  const inLesson = Math.min(lessonSize, total);
  const hint =
    total > lessonSize
      ? `В тренировку попадут ${inLesson} случайных ${pluralWords(inLesson)} из ${total}`
      : `В тренировку попадут все ${total} ${pluralWords(total)}`;

  return (
    <View className="gap-4 rounded-2xl bg-surface p-4">
      {/* Шапка */}
      <View className="flex-row items-center gap-3">
        <View className="h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
          <ReviewIcon width={26} height={26} color="#78826D" />
        </View>

        <View className="flex-1 gap-1">
          <Text className="font-nunitoBold text-body text-text">
            Повторение
          </Text>
        </View>

        <View className="items-center">
          <Text className="font-nunitoBold text-title text-primary">
            {total}
          </Text>
          <Text className="font-nunito text-small text-primary">
            {pluralWords(total)}
          </Text>
        </View>
      </View>

      <View className="h-px bg-text/10" />

      {children}

      <View className="gap-2">
        <Text className="text-center font-nunito text-small text-textSecondary">
          {hint}
        </Text>
        <Pressable
          onPress={onStart}
          className="min-h-12 items-center justify-center rounded-2xl bg-primary px-4 py-3 active:opacity-80"
          accessibilityRole="button"
          accessibilityHint={hint}
        >
          <Text className="font-nunitoBold text-body text-white">
            Начать повторение
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
