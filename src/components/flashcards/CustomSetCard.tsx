// src/components/flashcards/CustomSetCard.tsx
//
// Карточка набора во вкладке «Мои наборы»: название, сколько слов освоено
// (по чтению), шкала прогресса и две кнопки:
//   «Открыть» — страница набора (слова, добавить, убрать);
//   «Тренировать» — сразу тренировка. Если слов меньше MIN_SET_WORDS,
//   вместо неё подсказка, сколько слов не хватает.
// Тап по самой карточке тоже открывает набор.

import { ProgressBar } from "@/components/ui/ProgressBar";
import type { Word } from "@/content/flashcards/types";
import { MIN_SET_WORDS } from "@/store/customSetsStore";
import {
  getMasteryBucket,
  useWordProgressStore,
} from "@/store/wordProgressStore";
import { pluralWords } from "@/utils/writing/labels";
import { Pressable, Text, View } from "react-native";

interface CustomSetCardProps {
  title: string;
  words: Word[];
  onOpen: () => void;
  onStart: () => void;
}

export function CustomSetCard({
  title,
  words,
  onOpen,
  onStart,
}: CustomSetCardProps) {
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
  const missing = Math.max(MIN_SET_WORDS - total, 0);

  return (
    <View className="gap-3 rounded-2xl bg-surface p-5">
      {/* Название и прогресс: тап открывает набор */}
      <Pressable
        onPress={onOpen}
        className="gap-3 active:opacity-70"
        accessibilityRole="button"
        accessibilityLabel={`${title}: освоено ${masteredCount} из ${total}`}
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

      <View className="flex-row gap-3">
        <Pressable
          onPress={onOpen}
          className="min-h-12 flex-1 items-center justify-center rounded-2xl border border-primary px-4 active:bg-primary/10"
          accessibilityRole="button"
          accessibilityLabel={`Открыть набор «${title}»`}
        >
          <Text className="font-nunitoBold text-body text-primary">
            Открыть
          </Text>
        </Pressable>

        {missing === 0 ? (
          <Pressable
            onPress={onStart}
            className="min-h-12 flex-1 items-center justify-center rounded-2xl bg-primary px-4 active:opacity-80"
            accessibilityRole="button"
            accessibilityLabel={`Тренировать набор «${title}»`}
          >
            <Text className="font-nunitoBold text-body text-white">
              Тренировать
            </Text>
          </Pressable>
        ) : (
          <View className="min-h-12 flex-1 items-center justify-center px-2">
            <Text className="text-center font-nunito text-small text-textSecondary">
              ещё {missing} {pluralWords(missing)} до тренировки
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
