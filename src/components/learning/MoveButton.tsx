// src/components/learning/MoveButton.tsx
//
// Кнопка переноса слова между «Изученным» и «Повторением». Что сделает нажатие,
// зависит от того, где слово сейчас: в «Изученном» — «В повторение», иначе —
// «В изученные». Ширина фиксирована: смена текста не сдвигает строку.

import type { Word } from "@/content/flashcards/types";
import { useWordProgressStore } from "@/store/wordProgressStore";
import { Pressable, Text } from "react-native";

export function MoveButton({ word }: { word: Word }) {
  const id = word.vocabularyId;
  const inLearned = useWordProgressStore((s) => !!s.learned[id]);
  const addToReview = useWordProgressStore((s) => s.addToReview);
  const markLearned = useWordProgressStore((s) => s.markLearned);

  const label = inLearned ? "В повторение" : "В изученные";

  return (
    <Pressable
      onPress={() => (inLearned ? addToReview([id]) : markLearned([id]))}
      hitSlop={4}
      className="min-h-10 w-32 items-center justify-center rounded-full border border-primary px-2 active:bg-primary/10"
      accessibilityRole="button"
      accessibilityLabel={`${word.hanzi}: ${label.toLowerCase()}`}
    >
      <Text
        numberOfLines={1}
        className="font-nunitoBold text-small text-primary"
      >
        {label}
      </Text>
    </Pressable>
  );
}
