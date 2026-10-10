// src/components/writing/WritingResultsList.tsx
//
// Итоги тренировки письма на экране статистики: все написанные слова — твоё написание,
// слово, написано ли без подсказок, и переключатель «Повторение».

import { Hanzi } from "@/components/ui/Hanzi";
import { Pinyin } from "@/components/ui/Pinyin";
import { HanziView } from "@/components/writing/HanziView";
import type { WritingWordResult } from "@/store/gameStore";
import { useWordProgressStore } from "@/store/wordProgressStore";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

/** Набор переводов, где лежат переводы слов (как на экране урока). */
const WORDS_NAMESPACE = "sets";

/** Размер превью твоего написания одного иероглифа. */
const PREVIEW_SIZE = 56;

interface WritingResultsListProps {
  results: WritingWordResult[];
}

export function WritingResultsList({ results }: WritingResultsListProps) {
  const { t } = useTranslation([WORDS_NAMESPACE]);

  const writingReview = useWordProgressStore((s) => s.writingReview);
  const toggleWritingReview = useWordProgressStore(
    (s) => s.toggleWritingReview,
  );

  // Одно слово может встретиться дважды (например, 画画 в уроке) — показываем один раз
  const unique = results.filter(
    (item, index) =>
      results.findIndex((other) => other.vocabularyId === item.vocabularyId) ===
      index,
  );

  const hasReviewWords = unique.some(
    (item) => writingReview[item.vocabularyId],
  );

  return (
    <View className="gap-3">
      <Text className="font-nunito text-body text-text">
        {hasReviewWords
          ? "Если слово больше не вызывает трудностей, убери его из повторения."
          : "Трудные слова можно добавить на повторение."}
      </Text>

      {unique.map((item) => {
        const inReview = !!writingReview[item.vocabularyId];

        return (
          <View
            key={item.vocabularyId}
            className="gap-3 rounded-2xl bg-surface px-4 py-3"
          >
            <View className="flex-row items-center gap-3">
              {/* Твоё написание */}
              <View className="flex-row gap-1">
                {item.raws.map((raw, index) => (
                  <HanziView key={index} size={PREVIEW_SIZE} rawStrokes={raw} />
                ))}
              </View>

              <View className="flex-1">
                <View className="flex-row items-baseline gap-2">
                  <Hanzi size={24}>{item.hanzi}</Hanzi>
                  <Pinyin size="sm">{item.pinyin}</Pinyin>
                </View>
                <Text
                  className="font-nunito text-small text-text"
                  numberOfLines={1}
                >
                  {t(item.translation)}
                </Text>
                <Text className="font-nunito text-caption text-text">
                  {item.isCorrect ? "Без подсказок ✓" : "С подсказками"}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => toggleWritingReview(item.vocabularyId)}
              className={`min-h-11 items-center justify-center rounded-xl px-4 py-2 active:opacity-70 ${
                inReview ? "bg-primary/20" : "border border-primary"
              }`}
              accessibilityRole="switch"
              accessibilityState={{ checked: inReview }}
            >
              <Text className="font-nunito text-body text-text">
                {inReview
                  ? "На повторении ✓ · убрать"
                  : "Добавить на повторение"}
              </Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}
