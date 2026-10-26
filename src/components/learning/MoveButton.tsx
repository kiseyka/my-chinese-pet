// src/components/learning/MoveButton.tsx
//
// Кнопка на экране итогов у слова, которое перешло в «Изученное» или вернулось
// в «Повторение»: отменить переход. Такие слова всегда со всеми точками, поэтому
// «убрать из повторения» = «в изученные». Надпись — что сделает нажатие сейчас.
// Ширина фиксирована: смена текста не сдвигает строку.

import type { Word } from "@/content/flashcards/types";
import { useWordProgressStore } from "@/store/wordProgressStore";
import { Pressable, Text } from "react-native";

export function MoveButton({ word }: { word: Word }) {
  const id = word.vocabularyId;
  const inReview = useWordProgressStore((s) => !!s.review[id]);
  const toggleReview = useWordProgressStore((s) => s.toggleReview);

  const label = inReview ? "В изученные" : "В повторение";

  return (
    <Pressable
      onPress={() => toggleReview(id)}
      hitSlop={4}
      className="min-h-10 w-32 items-center justify-center rounded-full border border-primary px-2 active:bg-primary/10"
      accessibilityRole="button"
      accessibilityLabel={`${word.hanzi}: ${label.toLowerCase()}`}
    >
      <Text numberOfLines={1} className="font-nunitoBold text-small text-primary">
        {label}
      </Text>
    </Pressable>
  );
}
