// src/components/word/ActionChip.tsx
//
// Компактная кнопка панели слова: значок и подпись, залитая — когда включена
// («Повторение», «В набор», «Спросить панду»).

import { colors } from "@/theme/colors";
import type { ComponentType } from "react";
import { Pressable, Text } from "react-native";

type IconProps = { width: number; height: number; color: string };

export function ActionChip({
  Icon,
  label,
  active,
  onPress,
}: {
  Icon: ComponentType<IconProps>;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`min-h-16 flex-1 items-center justify-center gap-1 rounded-2xl px-1 py-2 active:opacity-70 ${
        active ? "bg-primary" : "border border-primary/30 bg-surface"
      }`}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
    >
      <Icon
        width={20}
        height={20}
        color={active ? "#FFFFFF" : colors.primary}
      />
      <Text
        numberOfLines={1}
        className={`font-nunitoBold text-caption ${
          active ? "text-white" : "text-text"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
