// src/components/results/ResultActions.tsx
//
// Две кнопки справа у слова на экране итогов (перевод, письмо, переносы):
//   закладка — «Повторение» сразу, без панели (заполненная — слово в повторении);
//   наборы — панель слова (onOpenWord): наборы, новый набор, озвучка.

import ReviewIcon from "@/assets/images/icons/bookmark.svg";
import LayersIcon from "@/assets/images/icons/layers.svg";
import type { Word } from "@/content/flashcards/types";
import { useWordProgressStore } from "@/store/wordProgressStore";
import { colors } from "@/theme/colors";
import { Pressable, View } from "react-native";

interface ResultActionsProps {
  word: Word;
  onOpenWord: (word: Word) => void;
}

export function ResultActions({ word, onOpenWord }: ResultActionsProps) {
  const id = word.vocabularyId;
  const inReview = useWordProgressStore((s) => !!s.review[id]);
  const toggleReview = useWordProgressStore((s) => s.toggleReview);

  return (
    <View className="flex-row items-center">
      <Pressable
        onPress={() => toggleReview(id)}
        hitSlop={4}
        className={`h-11 w-11 items-center justify-center rounded-full ${
          inReview ? "bg-primary/15" : "active:bg-text/10"
        }`}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: inReview }}
        accessibilityLabel={`${word.hanzi}: ${
          inReview ? "убрать из повторения" : "добавить в повторение"
        }`}
      >
        <ReviewIcon
          width={22}
          height={22}
          color={inReview ? colors.primary : colors.textSecondary}
        />
      </Pressable>

      <Pressable
        onPress={() => onOpenWord(word)}
        hitSlop={4}
        className="h-11 w-11 items-center justify-center rounded-full active:bg-primary/10"
        accessibilityRole="button"
        accessibilityLabel={`${word.hanzi}: наборы`}
      >
        <LayersIcon width={22} height={22} color={colors.primary} />
      </Pressable>
    </View>
  );
}
