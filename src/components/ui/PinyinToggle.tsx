// components/game/PinyinToggle.tsx
// components/game/PinyinToggle.tsx
import EyeClosedSvg from "@/assets/images/icons/eye-closed.svg";
import EyeSvg from "@/assets/images/icons/eye.svg";
import { useSettingsStore } from "@/store/settingsStore";
import { colors } from "@/theme/colors";
import { TouchableOpacity } from "react-native";

/** Глазик пиньиня. Цвет — как у остальных иконок-кнопок (озвучка): приглушённый текст. */
export function PinyinToggle({
  size = 24,
  color = `${colors.text}99`,
}: {
  size?: number;
  color?: string;
} = {}) {
  const showPinyin = useSettingsStore((s) => s.showPinyin);
  const togglePinyin = useSettingsStore((s) => s.togglePinyin);

  return (
    <TouchableOpacity
      onPress={togglePinyin}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      className={showPinyin ? "" : "opacity-40"}
    >
      {/* color — настоящий цвет: строка вида "text-text/40" не цвет, svg рисовался чёрным */}
      {showPinyin ? (
        <EyeSvg width={size} height={size} color={color} />
      ) : (
        <EyeClosedSvg width={size} height={size} color={color} />
      )}
    </TouchableOpacity>
  );
}
