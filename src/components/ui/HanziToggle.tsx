// components/ui/HanziToggle.tsx
import EyeClosedSvg from "@/assets/images/icons/eye-closed.svg";
import EyeSvg from "@/assets/images/icons/eye.svg";
import { useSettingsStore } from "@/store/settingsStore";
import { TouchableOpacity } from "react-native";
export function HanziToggle() {
  const hanziEnabled = useSettingsStore((s) => s.hanziEnabled);
  const toggleHanzi = useSettingsStore((s) => s.toggleHanzi);

  return (
    <TouchableOpacity
      onPress={toggleHanzi}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      className={hanziEnabled ? "" : "opacity-40"}
    >
      {hanziEnabled ? (
        <EyeSvg color="text-text/40" />
      ) : (
        <EyeClosedSvg color="text-text/40" />
      )}
    </TouchableOpacity>
  );
}
