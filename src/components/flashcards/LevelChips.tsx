// src/components/flashcards/LevelChips.tsx
//
// Выбор раздела HSK: ряд чипсов, листается вбок. На экране всегда один раздел.
//
// shared + active: у каждого раздела на «Ступенях» своя копия чипсов (в шапке своего
// списка). Они делят одну прокрутку вбок, чтобы при смене раздела полоса не скакала.

import { useSyncedScroll, type SharedScroll } from "@/hooks/useSharedLevelScroll";
import { memo, useRef } from "react";
import { Pressable, ScrollView, Text } from "react-native";

interface LevelChip<K> {
  key: K;
  label: string;
}

interface LevelChipsProps<K extends number> {
  chips: LevelChip<K>[];
  value: K;
  onChange: (key: K) => void;
  /** Общая прокрутка копий чипсов (на «Ступенях»). */
  shared?: SharedScroll;
  /** Эта копия сейчас на экране. */
  active?: boolean;
}

function LevelChipsInner<K extends number>({
  chips,
  value,
  onChange,
  shared,
  active = true,
}: LevelChipsProps<K>) {
  const ref = useRef<ScrollView>(null);
  const scroll = useSyncedScroll(ref, active, shared, "x");

  return (
    <ScrollView
      ref={ref}
      {...scroll}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8 }}
      // Чипсы не должны растягиваться по высоте вместе с экраном
      style={{ flexGrow: 0 }}
    >
      {chips.map((chip) => {
        const selected = chip.key === value;

        return (
          <Pressable
            key={chip.key}
            onPress={() => onChange(chip.key)}
            className={`min-h-10 justify-center rounded-full px-4 py-2 ${
              selected ? "bg-primary" : "bg-surface active:opacity-70"
            }`}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
          >
            <Text
              className={`text-body ${
                selected ? "font-nunitoBold text-white" : "font-nunito text-text"
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

/** memo: чипсы не перерисовываются, пока не сменился выбранный раздел. */
export const LevelChips = memo(LevelChipsInner) as typeof LevelChipsInner;
