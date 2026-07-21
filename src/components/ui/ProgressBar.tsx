import { View } from "react-native";
interface ProgressBarProps {
  progress: number;
}
export const ProgressBar = ({ progress }: ProgressBarProps) => {
  return (
    <View className="flex-1 h-3 w-full bg-[#E2D9CD] rounded-full overflow-hidden relative">
      <View
        style={{
          width: `${progress}%`,
          height: "100%",
          backgroundColor: "#A03927",
        }}
        className="rounded-full"
      />
    </View>
  );
};
