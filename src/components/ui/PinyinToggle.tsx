// components/game/PinyinToggle.tsx
// components/game/PinyinToggle.tsx
import EyeClosedSvg from "@/assets/images/icons/eye-closed.svg";
import EyeSvg from "@/assets/images/icons/eye.svg";
import { useSettingsStore } from "@/store/settingsStore";
import { TouchableOpacity } from "react-native";

export function PinyinToggle() {
  const showPinyin = useSettingsStore((s) => s.showPinyin);
  const togglePinyin = useSettingsStore((s) => s.togglePinyin);

  return (
    <TouchableOpacity
      onPress={togglePinyin}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      className={showPinyin ? "" : "opacity-40"}
    >
      {showPinyin ? (
        <EyeSvg color="text-text/40" />
      ) : (
        <EyeClosedSvg color="text-text/40" />
      )}
    </TouchableOpacity>
  );
}
