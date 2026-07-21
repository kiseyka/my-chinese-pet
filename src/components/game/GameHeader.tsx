// components/game/GameHeader.tsx

import BackIcon from "@/assets/images/icons/arrow-left.svg";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Text, TouchableOpacity, View } from "react-native";

interface GameHeaderProps {
  progress: number;
  currentQuestion: number;
  totalQuestions: number;
  onExit: () => void;
}

export function GameHeader({
  progress,
  currentQuestion,
  totalQuestions,
  onExit,
}: GameHeaderProps) {
  return (
    <View className="flex-row items-center justify-between w-full gap-5 px-4">
      <TouchableOpacity onPress={onExit} className="p-2">
        <BackIcon width={32} height={32} color="#2C241E" />
      </TouchableOpacity>

      <ProgressBar progress={progress} />

      <Text className="text-text font-['NunitoBold'] text-lg min-w-[35px] text-right">
        {currentQuestion}/{totalQuestions}
      </Text>
    </View>
  );
}
