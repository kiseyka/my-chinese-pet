// src/components/writing/home/WritingDots.tsx
//
// Три маленькие точки письма под ячейкой сетки и в окне слова:
// закрашено столько, сколько точек у слова. (LevelDots из ui — крупнее, с обводкой.)

import { View } from "react-native";

interface WritingDotsProps {
  level: number;
}

export function WritingDots({ level }: WritingDotsProps) {
  return (
    <View className="flex-row gap-1">
      {[0, 1, 2].map((index) => (
        <View
          key={index}
          className={`h-1.5 w-1.5 rounded-full ${
            index < level ? "bg-primary" : "bg-primary/20"
          }`}
        />
      ))}
    </View>
  );
}
