// src/components/flashcards/CustomSetCard.tsx
//
// Карточка набора во вкладке «Мои наборы»: название, сколько слов освоено
// (по чтению) и шкала прогресса.

import { ProgressBar } from "@/components/ui/ProgressBar";
import type { Word } from "@/content/flashcards/types";
import {
  getMasteryBucket,
  useWordProgressStore,
} from "@/store/wordProgressStore";
import { pluralWords } from "@/utils/writing/labels";
import { Pressable, Text, View } from "react-native";

interface CustomSetCardProps {
  title: string;
  words: Word[];
  onPress: () => void;
}

export function CustomSetCard({ title, words, onPress }: CustomSetCardProps) {
  const flashcardWords = useWordProgressStore((state) => state.flashcardWords);
  const vocabularyWords = useWordProgressStore(
    (state) => state.vocabularyWords,
  );

  const total = words.length;
  const masteredCount = words.filter(
    (word) =>
      getMasteryBucket(
        flashcardWords[word.vocabularyId],
        vocabularyWords[word.vocabularyId]?.isKnown ?? false,
        ["reading"],
      ) === "learned",
  ).length;

  const progress = total > 0 ? (masteredCount / total) * 100 : 0;

  return (
    <Pressable
      onPress={onPress}
      className="gap-3 rounded-2xl bg-surface p-5 active:opacity-70"
      accessibilityRole="button"
    >
      <View className="flex-row items-center justify-between gap-3">
        <Text
          numberOfLines={1}
          className="flex-1 font-nunitoBold text-lead text-text"
        >
          {title}
        </Text>
        <Text className="font-nunito text-small text-textSecondary">
          {total === 0
            ? "пока пусто"
            : `${masteredCount} из ${total} ${pluralWords(total)}`}
        </Text>
      </View>

      <ProgressBar progress={progress} />
    </Pressable>
  );
}
