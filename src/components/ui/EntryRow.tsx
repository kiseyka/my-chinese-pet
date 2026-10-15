// src/components/ui/EntryRow.tsx
//
// Компактная строка-вход над чипсами HSK: «Повторение» (карточки и «Написание»)
// и «Экзамен» («Написание»). Одна строка: значок, название, справа число и стрелка.
// Открывает панель с подробностями (слова, кнопка старта).

import ArrowRight from "@/assets/images/icons/chevron-right.svg";
import { interopIconColor } from "@/lib/interopIcon";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

interopIconColor(ArrowRight);

interface EntryRowProps {
  /** Значок слева, квадрат до 32px. */
  icon: ReactNode;
  title: string;
  /** Короткое значение справа: «8 слов», «через 5 ч». */
  value: string;
  onPress: () => void;
}

export function EntryRow({ icon, title, value, onPress }: EntryRowProps) {
  return (
    <Pressable
      onPress={onPress}
      className="min-h-14 flex-row items-center gap-3 rounded-2xl bg-surface px-4 py-2.5 active:opacity-70"
      accessibilityRole="button"
      accessibilityLabel={`${title}: ${value}`}
    >
      <View className="h-8 w-8 items-center justify-center">{icon}</View>

      <Text className="flex-1 font-nunitoBold text-body text-text">
        {title}
      </Text>

      <Text className="font-nunito text-small text-textSecondary">{value}</Text>

      <ArrowRight width={18} height={18} className="text-text" />
    </Pressable>
  );
}
