// src/components/ui/Parchment.tsx
//
// Плашка-пергамент поверх комнаты панды (шапка, нижняя панель, всплывашки):
// тёплая бумага чуть прозрачная, рамка цвета светлого дерева и вторая тонкая линия
// внутри — как край листа. sprigs — веточки (assets/images/bamboo.png) по нижним
// углам: левая как есть, правая зеркально. Они выходят за край плашки и не ловят
// касания. Цвета — parchment / parchmentBorder / parchmentLine в tailwind.config.js.

import { Image, View, type ViewStyle } from "react-native";
import type { ReactNode } from "react";

const sprig = require("@/assets/images/bamboo.png");
/** Пропорции картинки веточки (628 × 522). */
const SPRIG_RATIO = 522 / 628;

interface ParchmentProps {
  children: ReactNode;
  className?: string;
  /** Скругление, px: у панели и шапки — как у пилюли. */
  radius?: number;
  /** Веточки по нижним углам, ширина в px (0 — без них). */
  sprigs?: number;
  style?: ViewStyle;
}

export function Parchment({
  children,
  className = "",
  radius = 28,
  sprigs = 0,
  style,
}: ParchmentProps) {
  const sprigHeight = sprigs * SPRIG_RATIO;

  return (
    <View
      className={`border border-parchmentBorder bg-parchment/95 ${className}`}
      style={[{ borderRadius: radius }, style]}
    >
      {/* Внутренняя линия — край листа */}
      <View
        pointerEvents="none"
        className="absolute border border-parchmentLine"
        style={{ top: 3, left: 3, right: 3, bottom: 3, borderRadius: radius - 3 }}
      />

      {sprigs > 0 && (
        <View pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
          <Image
            source={sprig}
            style={{
              position: "absolute",
              width: sprigs,
              height: sprigHeight,
              left: -sprigs * 0.25,
              bottom: -sprigHeight * 0.15,
              opacity: 0.85,
            }}
          />
          <Image
            source={sprig}
            style={{
              position: "absolute",
              width: sprigs,
              height: sprigHeight,
              right: -sprigs * 0.25,
              bottom: -sprigHeight * 0.15,
              opacity: 0.85,
              transform: [{ scaleX: -1 }],
            }}
          />
        </View>
      )}

      {children}
    </View>
  );
}
