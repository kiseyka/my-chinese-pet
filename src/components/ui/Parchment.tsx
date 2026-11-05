// src/components/ui/Parchment.tsx
//
// Плашка-пергамент поверх комнаты панды (шапка, нижняя панель, всплывашки):
// тёплая бумага чуть прозрачная и одна тонкая рамка цвета светлого дерева.
//
// Цвета бумаги заданы здесь стилями, а не классами tailwind: плашка должна выглядеть
// одинаково, даже если Metro ещё держит старый tailwind.config в кеше. Те же цвета
// есть в tailwind.config.js (parchment, parchmentBorder, parchmentLine, ink, seal).
//
// decor — веточки (assets/images/decor) ЗА плашкой: выглядывают из-за её края,
// текст и иконки не перекрывают, касания не ловят.

import type { ReactNode } from "react";
import {
  Image,
  View,
  type ImageSourcePropType,
  type ViewStyle,
} from "react-native";

export const PARCHMENT = {
  paper: "rgba(248, 241, 228, 0.97)",
  border: "#D8C6A8",
  line: "#E4D6BE",
  ink: "#5A4A3B",
  seal: "#C2553F",
};

/** Веточки (вырезаны из одной картинки, ширина файлов 420 px). */
export const DECOR = {
  plumLarge: { source: require("@/assets/images/decor/plum-large.png"), ratio: 437 / 420 },
  plumSmall: { source: require("@/assets/images/decor/plum-small.png"), ratio: 146 / 420 },
  bamboo: { source: require("@/assets/images/decor/bamboo.png"), ratio: 604 / 420 },
};

export interface DecorItem {
  sprig: keyof typeof DECOR;
  /** Ширина, px. */
  width: number;
  /** Где лежит: left / right / top / bottom относительно плашки (можно отрицательные). */
  position: Pick<ViewStyle, "left" | "right" | "top" | "bottom">;
  /** Отразить по горизонтали. */
  flip?: boolean;
  rotate?: number;
}

interface ParchmentProps {
  children: ReactNode;
  className?: string;
  /** Скругление, px. */
  radius?: number;
  decor?: DecorItem[];
  style?: ViewStyle;
}

export function Parchment({
  children,
  className = "",
  radius = 28,
  decor = [],
  style,
}: ParchmentProps) {
  const paper = (
    <View
      className={className}
      style={[
        {
          borderRadius: radius,
          borderWidth: 1,
          borderColor: PARCHMENT.border,
          backgroundColor: PARCHMENT.paper,
        },
        style,
      ]}
    >
      {children}
    </View>
  );

  if (decor.length === 0) return paper;

  // Веточки — слой под бумагой: видна только часть за краем плашки
  return (
    <View>
      <View
        pointerEvents="none"
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      >
        {decor.map(({ sprig, width, position, flip, rotate }, i) => (
          <Image
            key={i}
            source={DECOR[sprig].source as ImageSourcePropType}
            resizeMode="contain"
            style={{
              position: "absolute",
              width,
              height: width * DECOR[sprig].ratio,
              opacity: 0.9,
              ...position,
              transform: [
                ...(flip ? [{ scaleX: -1 }] : []),
                ...(rotate ? [{ rotate: `${rotate}deg` }] : []),
              ],
            }}
          />
        ))}
      </View>
      {paper}
    </View>
  );
}
