// src/components/ui/Hanzi.tsx
//
// Иероглифы. Шрифт Noto Sans SC с явной высотой строки: по умолчанию у него очень высокая
// строка, и блок вытягивается. Размер — один из HANZI_SIZES или число (например, от ширины ячейки).

import type { ReactNode } from "react";
import { Text, type StyleProp, type TextStyle } from "react-native";

export const HANZI_SIZES = {
  sm: 28, // списки, сетка, кнопки выбора
  md: 40, // карточки слов, заголовок окна
  lg: 56, // крупный показ слова
  xl: 80, // слово на весь экран
} as const;

export type HanziSize = keyof typeof HANZI_SIZES;

const WEIGHTS = {
  regular: "font-chinese",
  medium: "font-chineseMedium",
  bold: "font-chineseBold",
} as const;

interface HanziProps {
  children: ReactNode;
  size?: HanziSize | number;
  weight?: keyof typeof WEIGHTS;
  /** Дополнительные классы, например цвет: «text-white». */
  className?: string;
  /**
   * Насколько можно увеличить при крупном системном шрифте. В ячейках фиксированной
   * ширины стоит ограничить (1.2), иначе иероглиф не влезет.
   */
  maxFontSizeMultiplier?: number;
  /** Ограничение по строкам (вместе с fitToWidth — в одну строку). */
  numberOfLines?: number;
  /**
   * Уменьшать шрифт, если слово не влезает по ширине (например, «你好» в узкой карточке).
   * Работает вместе с numberOfLines.
   */
  adjustsFontSizeToFit?: boolean;
  style?: StyleProp<TextStyle>;
}

export function Hanzi({
  children,
  size = "md",
  weight = "medium",
  className = "",
  maxFontSizeMultiplier,
  numberOfLines,
  adjustsFontSizeToFit,
  style,
}: HanziProps) {
  const fontSize = typeof size === "number" ? size : HANZI_SIZES[size];

  return (
    <Text
      className={`text-text ${WEIGHTS[weight]} ${className}`}
      style={[
        {
          fontSize,
          lineHeight: Math.round(fontSize * 1.2),
          includeFontPadding: false,
        },
        style,
      ]}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      numberOfLines={numberOfLines}
      adjustsFontSizeToFit={adjustsFontSizeToFit}
      accessibilityLanguage="zh-CN"
    >
      {children}
    </Text>
  );
}
