// components/ui/LevelDots.tsx

import { View } from "react-native";

export type WordLevel = 0 | 1 | 2 | 3;

export const LevelDots = ({
  level,
  className = "",
}: {
  level: WordLevel;
  className?: string;
}) => (
  <View
    className={`flex-row items-center justify-center gap-1 ${className}`}
    accessibilityLabel={`${level} / 3`}
  >
    {[0, 1, 2].map((i) => (
      <View
        key={i}
        className={`h-2 w-2 rounded-full border border-primary ${
          i < level ? "bg-primary" : "bg-transparent"
        }`}
      />
    ))}
  </View>
);
