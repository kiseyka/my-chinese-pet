// components/SoundToggle.tsx
import VolumeOffIcon from "@/assets/images/icons/volume-off.svg";
import VolumeOnIcon from "@/assets/images/icons/volume.svg";
import { useSettingsStore } from "@/store/settingsStore";
import { TouchableOpacity } from "react-native";

export function SoundToggle() {
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const toggleSound = useSettingsStore((s) => s.toggleSound);

  const Icon = soundEnabled ? VolumeOnIcon : VolumeOffIcon;

  return (
    <TouchableOpacity
      onPress={toggleSound}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Icon width={24} height={24} color="#2C241E" />
    </TouchableOpacity>
  );
}
