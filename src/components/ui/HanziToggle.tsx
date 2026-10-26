// components/ui/HanziToggle.tsx
//
// Показ иероглифов вкл/выкл (тоны). Того же вида, что глаз пиньиня и озвучка.
import EyeClosedSvg from "@/assets/images/icons/eye-closed.svg";
import EyeSvg from "@/assets/images/icons/eye.svg";
import { useSettingsStore } from "@/store/settingsStore";
import { colors } from "@/theme/colors";
import { TouchableOpacity } from "react-native";

export function HanziToggle({
  size = 24,
  color = colors.text,
}: {
  size?: number;
  color?: string;
} = {}) {
  const hanziEnabled = useSettingsStore((s) => s.hanziEnabled);
  const toggleHanzi = useSettingsStore((s) => s.toggleHanzi);

  return (
    <TouchableOpacity
      onPress={toggleHanzi}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      className={hanziEnabled ? "" : "opacity-40"}
      accessibilityRole="switch"
      accessibilityState={{ checked: hanziEnabled }}
      accessibilityLabel="Иероглифы"
    >
      {/* color — настоящий цвет: строка вида "text-text/40" не цвет, svg рисовался чёрным */}
      {hanziEnabled ? (
        <EyeSvg width={size} height={size} color={color} />
      ) : (
        <EyeClosedSvg width={size} height={size} color={color} />
      )}
    </TouchableOpacity>
  );
}
