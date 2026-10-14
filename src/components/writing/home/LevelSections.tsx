// src/components/writing/home/LevelSections.tsx
//
// LockedLevelCard — раздел HSK на экране «Написание», пока он закрыт.

import { describeLevel, type WritingLevel } from "@/utils/writing/words";
import { Text, View } from "react-native";

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
