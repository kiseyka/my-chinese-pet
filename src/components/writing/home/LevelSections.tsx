// src/components/writing/home/LevelSections.tsx
//
// Заголовки разделов HSK на экране «Написание»:
//   LevelHeader — название текущего раздела и «изучено / всего»;
//   LockedLevelCard — следующий раздел, пока он закрыт.

import { describeLevel, type WritingLevel } from "@/utils/writing/words";
import { Text, View } from "react-native";

export function LevelHeader({
  level,
  learned,
  total,
}: {
  level: WritingLevel;
  learned: number;
  total: number;
}) {
  return (
    <View className="flex-row items-baseline justify-between">
      <Text className="font-nunitoBold text-title text-text">
        {describeLevel(level)}
      </Text>
      <Text
        className="font-nunito text-small text-textSecondary"
        accessibilityLabel={`Изучено ${learned} из ${total}`}
      >
        {learned}/{total} изучено
      </Text>
    </View>
  );
}

export function LockedLevelCard({
  level,
  currentLevel,
}: {
  level: WritingLevel;
  /** Раздел, который нужно пройти, чтобы этот открылся. */
  currentLevel: WritingLevel;
}) {
  return (
    <View className="gap-1 rounded-2xl bg-surface/60 px-4 py-3">
      <Text className="font-nunito text-body text-text">
        {describeLevel(level)} · закрыт
      </Text>
      <Text className="font-nunito text-small text-text">
        Откроется, когда пройдёшь финалы всех ступеней{" "}
        {describeLevel(currentLevel)}.
      </Text>
    </View>
  );
}
