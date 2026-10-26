// components/game/GameHeader.tsx
//
// Шапка тренировки: шкала прогресса, ниже «назад» и переключатели.
// Все иконки одного цвета (colors.text); выключенный переключатель приглушён.
import BackIcon from "@/assets/images/icons/arrow-left.svg";
import { HanziToggle } from "@/components/ui/HanziToggle";
import { PinyinToggle } from "@/components/ui/PinyinToggle";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SoundToggle } from "@/components/ui/SoundToggle";
import { colors } from "@/theme/colors";
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
        <TouchableOpacity
          onPress={onExit}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Выйти из тренировки"
        >
          <BackIcon width={28} height={28} color={colors.text} />
        </TouchableOpacity>

        <View className="flex-row items-center gap-5">
          {showHanzi && <HanziToggle />}
          {showPinyin && <PinyinToggle color={colors.text} />}
          {showSound && <SoundToggle />}
        </View>
      </View>
    </View>
  );
}
