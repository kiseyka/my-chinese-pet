// components/ui/SoundToggle.tsx
//
// Озвучка вкл/выкл. Выключенная — значок «без звука» и приглушённая,
// как глаз пиньиня: в шапке тренировки все переключатели одного вида.
import VolumeOffIcon from "@/assets/images/icons/volume-off.svg";
import VolumeOnIcon from "@/assets/images/icons/volume.svg";
import { useSettingsStore } from "@/store/settingsStore";
import { colors } from "@/theme/colors";
import { TouchableOpacity } from "react-native";

export function SoundToggle({
  size = 24,
  color = colors.text,
}: {
  size?: number;
  color?: string;
} = {}) {
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const toggleSound = useSettingsStore((s) => s.toggleSound);

  const Icon = soundEnabled ? VolumeOnIcon : VolumeOffIcon;

  return (
    <TouchableOpacity
      onPress={toggleSound}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      className={soundEnabled ? "" : "opacity-40"}
      accessibilityRole="switch"
      accessibilityState={{ checked: soundEnabled }}
      accessibilityLabel="Озвучка"
    >
      <Icon width={size} height={size} color={color} />
    </TouchableOpacity>
  );
}
