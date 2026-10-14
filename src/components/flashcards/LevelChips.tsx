// src/components/flashcards/LevelChips.tsx
//
// Выбор раздела HSK: ряд чипсов, листается вбок. На экране всегда один раздел.

import { Pressable, ScrollView, Text } from "react-native";

interface LevelChip<K> {
  key: K;
  label: string;
}

interface LevelChipsProps<K extends number> {
  chips: LevelChip<K>[];
  value: K;
  onChange: (key: K) => void;
}

export function LevelChips<K extends number>({
  chips,
  value,
  onChange,
}: LevelChipsProps<K>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8 }}
      // Чипсы не должны растягиваться по высоте вместе с экраном
      style={{ flexGrow: 0 }}
    >
      {chips.map((chip) => {
        const active = chip.key === value;

        return (
          <Pressable
            key={chip.key}
            onPress={() => onChange(chip.key)}
            className={`min-h-10 justify-center rounded-full px-4 py-2 ${
              active ? "bg-primary" : "bg-surface active:opacity-70"
            }`}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            <Text
              className={`text-body ${
                active ? "font-nunitoBold text-white" : "font-nunito text-text"
              }`}
            >
              {chip.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
