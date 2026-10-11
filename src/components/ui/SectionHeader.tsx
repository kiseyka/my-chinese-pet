// src/components/ui/SectionHeader.tsx
//
// Шапка сворачиваемой секции: название слева, подпись и стрелка справа.

import { Pressable, Text, View } from "react-native";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  expanded: boolean;
  onPress: () => void;
}

export function SectionHeader({
  title,
  subtitle,
  expanded,
  onPress,
}: SectionHeaderProps) {
  return (
    <Pressable
      onPress={onPress}
      className="min-h-12 flex-row items-center justify-between rounded-2xl bg-surface px-4 py-3 active:opacity-70"
      accessibilityRole="button"
      accessibilityState={{ expanded }}
    >
      <Text className="font-nunito text-body text-text">{title}</Text>
      <View className="flex-row items-center gap-2">
        {subtitle !== undefined && (
          <Text className="font-nunito text-small text-textSecondary">
            {subtitle}
          </Text>
        )}
        <Text className="font-nunito text-body text-textSecondary">
          {expanded ? "▴" : "▾"}
        </Text>
      </View>
    </Pressable>
  );
}
