// src/components/writing/ReviewCard.tsx
//
// Карточка-вход «Повторение» на экране «Написание»: иконка, название и сколько слов отмечено.
// Сами слова и кнопка старта — в ReviewModal.

import ReviewIcon from "@/assets/images/icons/bookmark.svg";
import ArrowRight from "@/assets/images/icons/chevron-right.svg";
import { Pressable, Text, View } from "react-native";

/** 1 слово, 2 слова, 5 слов, 11 слов, 21 слово. */
export function pluralWords(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "слово";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "слова";
  return "слов";
}

interface ReviewCardProps {
  /** Сколько слов отмечено для повтора. */
  total: number;
  onPress: () => void;
}

export function ReviewCard({ total, onPress }: ReviewCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-4 rounded-2xl bg-surface px-4 py-4 active:opacity-70"
      accessibilityRole="button"
    >
      <View className="h-11 w-11 items-center justify-center rounded-xl bg-primary/15">
        <ReviewIcon width={22} height={22} color="#78826D" />
      </View>

      <View className="flex-1 gap-0.5">
        <Text className="font-nunitoBold text-lead text-text">Повторение</Text>
        <Text className="font-nunito text-small text-text opacity-70">
          {total} {pluralWords(total)}
        </Text>
      </View>

      <ArrowRight width={20} height={20} className="text-text" />
    </Pressable>
  );
}
