// src/components/writing/SealMark.tsx
//
// Печать 印 — значок экзамена по письму: иконка раздела «Экзамен»
// и метка «слово готово к сдаче». Сданное слово помечается галочкой, не печатью.
// Цвет — токен `seal` из tailwind.config.js.

import { Text, View } from "react-native";

interface SealMarkProps {
  /** Сторона квадрата печати. */
  size?: number;
}

export function SealMark({ size = 32 }: SealMarkProps) {
  return (
    <View
      style={{ width: size, height: size }}
      className="items-center justify-center rounded-md border-2 border-seal bg-seal/10"
    >
      <Text
        style={{ fontSize: size * 0.58, lineHeight: size * 0.75 }}
        className="font-nunitoBold text-seal"
      >
        印
      </Text>
    </View>
  );
}
