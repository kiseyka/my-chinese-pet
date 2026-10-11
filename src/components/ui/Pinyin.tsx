// src/components/ui/Pinyin.tsx
//
// Пиньинь. Знаки тонов — мелкие надстрочные значки, поэтому размер не меньше 14 и
// высота строки с запасом сверху (иначе значки над буквами обрезаются).

import type { ReactNode } from "react";
import { Text, type StyleProp, type TextStyle } from "react-native";

export const PINYIN_SIZES = {
  sm: 14, // под иероглифом в сетке и списках
  md: 18, // в карточках и окнах
  lg: 24, // крупно над холстом и в карточках слов
  xl: 30, // слово на весь экран
} as const;

export type PinyinSize = keyof typeof PINYIN_SIZES;

interface PinyinProps {
  children: ReactNode;
  size?: PinyinSize | number;
  /** Дополнительные классы, например цвет: «text-white». */
  className?: string;
  numberOfLines?: number;
  maxFontSizeMultiplier?: number;
  style?: StyleProp<TextStyle>;
}

export function Pinyin({
  children,
  size = "md",
  className = "",
  numberOfLines,
  maxFontSizeMultiplier,
  style,
}: PinyinProps) {
  const fontSize = typeof size === "number" ? size : PINYIN_SIZES[size];

  return (
    <Text
      className={`font-nunito text-primary ${className}`}
      style={[{ fontSize, lineHeight: Math.round(fontSize * 1.4) }, style]}
      numberOfLines={numberOfLines}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
    >
      {children}
    </Text>
  );
}
