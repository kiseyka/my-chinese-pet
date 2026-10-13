// src/components/writing/WritingResultsList.tsx
//
// Итоги тренировки письма на экране статистики: все написанные слова — твоё написание,
// слово, написано ли без подсказок, точки «было → стало» (у слова и у его иероглифов)
// и переключатель «Повторение».
//
// Убрать слово из «Повторения» здесь = «чувствую, что знаю»: слово встаёт в очередь
// на экзамен (откроется через 24 часа). Поэтому снятие идёт через removeFromWritingReview,
// а добавление — через toggleWritingReview.

import { Hanzi } from "@/components/ui/Hanzi";
import { LevelDots, type WordLevel } from "@/components/ui/LevelDots";
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

const toLevel = (value: number) =>
  Math.min(3, Math.max(0, Math.round(value))) as WordLevel;

/** Точки «было → стало». Если ничего не изменилось — просто текущие точки. */
function LevelChange({ before, after }: { before: number; after: number }) {
  const from = toLevel(before);
  const to = toLevel(after);

  if (from === to) return <LevelDots level={to} />;

  return (
    <View className="flex-row items-center gap-2">
      <LevelDots level={from} />
      <Text className="font-nunito text-caption text-text">→</Text>
      <LevelDots level={to} />
    </View>
  );
}

interface WritingResultsListProps {
  results: WritingWordResult[];
}

export function WritingResultsList({ results }: WritingResultsListProps) {
  const { t } = useTranslation([WORDS_NAMESPACE]);

  const writingReview = useWordProgressStore((s) => s.writingReview);
  const toggleWritingReview = useWordProgressStore(
    (s) => s.toggleWritingReview,
  );
  const removeFromWritingReview = useWordProgressStore(
    (s) => s.removeFromWritingReview,
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
          ? "Если слово больше не вызывает трудностей, убери его из повторения — через сутки его можно будет сдать на экзамене."
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
                <View className="flex-row items-center justify-between gap-2">
                  <Text className="font-nunito text-caption text-text">
                    {item.isCorrect ? "Без подсказок ✓" : "С подсказками"}
                  </Text>
                  <LevelChange
                    before={item.levelBefore}
                    after={item.levelAfter}
                  />
                </View>
              </View>
            </View>

            {/* Иероглифы слова: каждый засчитывается как отдельное слово */}
            {item.characters.length > 0 && (
              <View className="gap-1 pl-2">
                {item.characters.map((char) => (
                  <View
                    key={char.vocabularyId}
                    className="flex-row items-center gap-2"
                  >
                    <Hanzi size={18}>{char.hanzi}</Hanzi>
                    <Pinyin size="sm">{char.pinyin}</Pinyin>
                    <View className="flex-1" />
                    <LevelChange
                      before={char.levelBefore}
                      after={char.levelAfter}
                    />
                  </View>
                ))}
              </View>
            )}

            <Pressable
              onPress={() =>
                inReview
                  ? removeFromWritingReview(item.vocabularyId)
                  : toggleWritingReview(item.vocabularyId)
              }
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
