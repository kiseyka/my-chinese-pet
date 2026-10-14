// src/components/flashcards/FlashcardResultsList.tsx
//
// Итоги тренировки карточками на экране статистики: все слова тренировки,
// сначала ошибки. У каждого слова — точки чтения и переключатель «Повторение».
// Сверху — «Добавить ошибки в повторение» одним нажатием.
// Так же, как в письме: решение, что повторять, принимается здесь, после тренировки.

import ReviewIcon from "@/assets/images/icons/bookmark.svg";
import { Hanzi } from "@/components/ui/Hanzi";
import { LevelDots } from "@/components/ui/LevelDots";
import { Pinyin } from "@/components/ui/Pinyin";
import type { FlashcardQuestionResult } from "@/store/gameStore";
import { getWordLevel, useWordProgressStore } from "@/store/wordProgressStore";
import { colors } from "@/theme/colors";
import { pluralWords } from "@/utils/writing/labels";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

interface FlashcardResultsListProps {
  results: FlashcardQuestionResult[];
}

export function FlashcardResultsList({ results }: FlashcardResultsListProps) {
  const { t } = useTranslation();

  const flashcardWords = useWordProgressStore((s) => s.flashcardWords);
  const vocabularyWords = useWordProgressStore((s) => s.vocabularyWords);
  const readingReview = useWordProgressStore((s) => s.readingReview);
  const toggleReadingReview = useWordProgressStore(
    (s) => s.toggleReadingReview,
  );
  const addToReadingReview = useWordProgressStore((s) => s.addToReadingReview);

  // Одно слово — одна строка; ошибка, если хоть раз ответили неверно
  const byId = new Map<string, FlashcardQuestionResult>();
  for (const item of results) {
    const previous = byId.get(item.vocabularyId);
    if (!previous || (previous.isCorrect && !item.isCorrect)) {
      byId.set(item.vocabularyId, item);
    }
  }
  const unique = Array.from(byId.values()).sort(
    (a, b) => Number(a.isCorrect) - Number(b.isCorrect),
  );

  const mistakesNotInReview = unique
    .filter((item) => !item.isCorrect && !readingReview[item.vocabularyId])
    .map((item) => item.vocabularyId);

  return (
    <View className="gap-3">
      {mistakesNotInReview.length > 0 && (
        <Pressable
          onPress={() => addToReadingReview(mistakesNotInReview)}
          className="min-h-12 flex-row items-center justify-center gap-2 rounded-2xl border border-primary px-4 py-3 active:bg-primary/10"
          accessibilityRole="button"
        >
          <ReviewIcon width={20} height={20} color={colors.primary} />
          <Text className="font-nunitoBold text-body text-primary">
            Ошибки в повторение · {mistakesNotInReview.length}{" "}
            {pluralWords(mistakesNotInReview.length)}
          </Text>
        </Pressable>
      )}

      {unique.map((item) => {
        const inReview = !!readingReview[item.vocabularyId];
        const level = getWordLevel(
          flashcardWords[item.vocabularyId],
          vocabularyWords[item.vocabularyId]?.isKnown ?? false,
          ["reading"],
        );

        return (
          <View
            key={item.vocabularyId}
            className="flex-row items-center gap-3 rounded-2xl bg-surface py-3 pl-4 pr-2"
          >
            <View className="min-w-0 flex-1 gap-0.5">
              <View className="flex-row flex-wrap items-baseline gap-x-2">
                <Hanzi size={24}>{item.hanzi}</Hanzi>
                <Pinyin size="sm">{item.pinyin}</Pinyin>
              </View>
              <Text
                className="font-nunito text-small text-text"
                numberOfLines={2}
              >
                {t(item.translation)}
              </Text>
              <View className="mt-1 flex-row items-center gap-2">
                <LevelDots level={level} />
                <Text
                  className={`font-nunito text-caption ${
                    item.isCorrect ? "text-textSecondary" : "text-error"
                  }`}
                >
                  {item.isCorrect ? "верно" : "ошибка"}
                </Text>
              </View>
            </View>

            {/* Повторение: добавить или убрать */}
            <Pressable
              onPress={() => toggleReadingReview(item.vocabularyId)}
              hitSlop={6}
              className={`min-h-10 flex-row items-center gap-1.5 rounded-full px-3 ${
                inReview
                  ? "bg-primary/15 active:opacity-70"
                  : "border border-textSecondary/50 active:bg-text/10"
              }`}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: inReview }}
              accessibilityLabel={`${item.hanzi}: повторение`}
            >
              <ReviewIcon
                width={16}
                height={16}
                color={inReview ? colors.primary : colors.textSecondary}
              />
              <Text
                className={`font-nunitoBold text-small ${
                  inReview ? "text-primary" : "text-text"
                }`}
              >
                {inReview ? "В повторении" : "Повторять"}
              </Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}
