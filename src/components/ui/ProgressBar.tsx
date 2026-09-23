import { View } from "react-native";

interface ProgressBarProps {
  progress: number;
}

export const ProgressBar = ({ progress }: ProgressBarProps) => {
  return (
    <View className="flex-1 h-3 w-full bg-progress-inactive rounded-full overflow-hidden relative">
      <View
        style={{ width: `${progress}%` }}
        className="h-full rounded-full bg-progress-active"
      />
    </View>
  );
};
