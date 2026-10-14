// src/components/flashcards/ReadingGrid.tsx
//
// Сетка слов для карточек: иероглиф, пиньинь и точки чтения. Перевод скрыт —
// тренировка как раз «иероглиф → перевод»; он показывается по тапу (WordSheet).
// 4 колонки; длинное слово занимает несколько: 2 иероглифа — 2 колонки,
// 3 — 3, 4 и больше — весь ряд.

import { Hanzi } from "@/components/ui/Hanzi";
import { Pinyin } from "@/components/ui/Pinyin";
import { WritingDots } from "@/components/writing/home/WritingDots";
import type { Word } from "@/content/flashcards/types";
import { memo } from "react";
import { Pressable, View, useWindowDimensions } from "react-native";

const COLUMNS = 4;
const GAP = 8;

interface ReadingGridProps {
  words: Word[];
  /** Точки чтения каждого слова, в том же порядке. */
  dots: number[];
  onSelect: (word: Word) => void;
  /** Сколько ширины экрана не достаётся сетке (все отступы по бокам вместе). */
  horizontalInset: number;
}

function spanOf(word: Word): number {
  return Math.min(Array.from(word.hanzi).length, COLUMNS);
}

export const ReadingGrid = memo(function ReadingGrid({
  words,
  dots,
  onSelect,
  horizontalInset,
}: ReadingGridProps) {
  const { width } = useWindowDimensions();
  const unit = Math.floor(
    (width - horizontalInset - GAP * (COLUMNS - 1)) / COLUMNS,
  );
  // Размер иероглифа одинаковый во всех ячейках, чтобы сетка выглядела ровно
  const hanziSize = Math.round(unit * 0.42);

  return (
    <View className="flex-row flex-wrap" style={{ gap: GAP }}>
      {words.map((word, index) => {
        const span = spanOf(word);

        return (
          <Pressable
            key={word.vocabularyId}
            onPress={() => onSelect(word)}
            className="items-center justify-center rounded-2xl pb-2 pt-1 active:bg-primary/10"
            style={{ width: unit * span + GAP * (span - 1) }}
            accessibilityRole="button"
            accessibilityLabel={`${word.hanzi}, ${word.pinyin}`}
            accessibilityHint="Показать перевод"
          >
            <Hanzi
              size={hanziSize}
              numberOfLines={1}
              adjustsFontSizeToFit
              maxFontSizeMultiplier={1.2}
            >
              {word.hanzi}
            </Hanzi>
            <Pinyin size="sm" numberOfLines={1} maxFontSizeMultiplier={1.2}>
              {word.pinyin}
            </Pinyin>
            <View className="mt-1">
              <WritingDots level={dots[index] ?? 0} />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
});
