// components/game/GameHeader.tsx
import BackIcon from "@/assets/images/icons/arrow-left.svg";
import { HanziToggle } from "@/components/ui/HanziToggle";
import { PinyinToggle } from "@/components/ui/PinyinToggle";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SoundToggle } from "@/components/ui/SoundToggle";
import { TouchableOpacity, View } from "react-native";

interface GameHeaderProps {
  progress: number;
  onExit: () => void;
  showPinyin?: boolean;
  showSound?: boolean;
  showHanzi?: boolean;
}

export function GameHeader({
  progress,
  onExit,
  showPinyin = true,
  showSound = true,
  showHanzi = false,
}: GameHeaderProps) {
  return (
    <View className="flex-col gap-5 w-full">
      <View className="flex-row items-center justify-between w-full gap-5">
        <ProgressBar progress={progress} />
      </View>

      <View className="flex-row items-center justify-between w-full">
        <TouchableOpacity onPress={onExit}>
          <BackIcon width={28} height={28} color="#2C241E" />
        </TouchableOpacity>

        <View className="flex-row items-center gap-5">
          {showHanzi && <HanziToggle />}
          {showPinyin && <PinyinToggle />}
          {showSound && <SoundToggle />}
        </View>
      </View>
    </View>
  );
}
