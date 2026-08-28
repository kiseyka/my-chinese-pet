// components/game/MasteryBar.tsx
import { View } from "react-native";

type MasteryBarProps = {
  total: number;
  learningCount: number;
  masteredCount: number;
};

const colors = {
  new: "#E2D9CD",
  learning: "#A03927",
  mastered: "#B54230",
};

export const MasteryBar = ({
  total,
  learningCount,
  masteredCount,
}: MasteryBarProps) => {
  if (total === 0) return null;

  return (
    <View
      className="h-2 flex-row rounded-full overflow-hidden mt-2"
      style={{ backgroundColor: colors.new }}
    >
      {masteredCount > 0 && (
        <View
          style={{
            width: `${(masteredCount / total) * 100}%`,
            backgroundColor: colors.mastered,
          }}
        />
      )}
      {learningCount > 0 && (
        <View
          style={{
            width: `${(learningCount / total) * 100}%`,
            backgroundColor: colors.learning,
          }}
        />
      )}
    </View>
  );
};
