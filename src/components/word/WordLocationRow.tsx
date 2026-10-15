// src/components/word/WordLocationRow.tsx
//
// Строка «где лежит слово» в панели слова: «HSK 2 · Ступень 7» и «Показать».
// Показывается только для слова, открытого из поиска: у слова из ступени место и так видно.

import { Pressable, Text, View } from "react-native";

interface WordLocationRowProps {
  /** «HSK 2 · Ступень 7». */
  location: string;
  /** Если передан — справа кнопка «Показать». */
  onShow?: () => void;
  className?: string;
}

export function WordLocationRow({
  location,
  onShow,
  className = "",
}: WordLocationRowProps) {
  return (
    <View
      className={`min-h-12 flex-row items-center justify-between gap-3 rounded-2xl bg-surface px-4 py-2 ${className}`}
    >
      <Text className="flex-1 font-nunito text-body text-text">{location}</Text>
      {onShow && (
        <Pressable
          onPress={onShow}
          hitSlop={8}
          className="min-h-10 justify-center active:opacity-60"
          accessibilityRole="button"
          accessibilityLabel={`Показать: ${location}`}
        >
          <Text className="font-nunitoBold text-small text-primary">
            Показать
          </Text>
        </Pressable>
      )}
    </View>
  );
}
