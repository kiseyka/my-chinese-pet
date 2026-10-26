// src/components/learning/TransitionLine.tsx
//
// Подзаголовок раздела на экране итогов: откуда и куда перешли слова,
// например «Из повторения → В изученное · 4».

import { Text } from "react-native";

interface TransitionLineProps {
  from: string;
  to: string;
  /** Сколько слов так перешло. Без него — без числа. */
  count?: number;
}

export function TransitionLine({ from, to, count }: TransitionLineProps) {
  return (
    <Text className="font-nunito text-small text-textSecondary">
      {from} → {to}
      {count !== undefined ? ` · ${count}` : ""}
    </Text>
  );
}
