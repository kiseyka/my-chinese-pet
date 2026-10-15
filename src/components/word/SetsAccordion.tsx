// src/components/word/SetsAccordion.tsx
//
// «Добавить в набор» одной строкой, которая раскрывается (окно слова в «Написании»):
// свёрнутая — «Добавить в набор» или «В наборах: 2» и стрелка;
// раскрытая — под ней свои наборы и «Новый набор» (SetToggleList).
// Так окно почти не растёт, пока наборы не нужны.

import ChevronIcon from "@/assets/images/icons/chevron-right.svg";
import SetsIcon from "@/assets/images/icons/layers.svg";
import type { Word } from "@/content/flashcards/types";
import { interopIconColor } from "@/lib/interopIcon";
import { useCustomSetsStore } from "@/store/customSetsStore";
import { Pressable, Text, View } from "react-native";
import { SetToggleList } from "./SetToggleList";
import { IconSlot } from "./ToggleCard";

interopIconColor(ChevronIcon, SetsIcon);

interface SetsAccordionProps {
  word: Word;
  expanded: boolean;
  onToggle: () => void;
  className?: string;
}

export function SetsAccordion({
  word,
  expanded,
  onToggle,
  className = "",
}: SetsAccordionProps) {
  const inSets = useCustomSetsStore(
    (state) =>
      state.sets.filter((set) => set.wordIds.includes(word.vocabularyId))
        .length,
  );

  const label = inSets > 0 ? `В наборах: ${inSets}` : "Добавить в набор";

  return (
    <View className={className}>
      <Pressable
        onPress={onToggle}
        className="flex-row items-center gap-3 rounded-2xl bg-surface p-4 active:opacity-70"
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={label}
      >
        <IconSlot>
          <SetsIcon width={26} height={26} className="text-primary" />
        </IconSlot>
        <Text className="flex-1 font-nunitoBold text-body text-text">
          {label}
        </Text>
        {/* Стрелка: вправо — свёрнуто, вниз — раскрыто */}
        <IconSlot>
          <View
            style={{ transform: [{ rotate: expanded ? "90deg" : "0deg" }] }}
          >
            <ChevronIcon
              width={24}
              height={24}
              strokeWidth={2.5}
              className="text-primary"
            />
          </View>
        </IconSlot>
      </Pressable>

      {expanded && (
        <SetToggleList word={word} showTitle={false} className="mt-2 pl-4" />
      )}
    </View>
  );
}
