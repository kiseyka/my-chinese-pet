// src/components/flashcards/ReadingGrid.tsx
//
// Сетка слов для карточек: иероглиф, пиньинь и точки чтения. Перевод скрыт —
// тренировка как раз «иероглиф → перевод»; он показывается по тапу (WordSheet).
// 4 колонки. Ячейка занимает столько колонок, сколько нужно, чтобы влезли
// иероглифы и пиньинь: 2 иероглифа обычно влезают в одну, 3–4 — в две.

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

/** Примерная ширина буквы пиньиня (размер sm, 14 pt) — с запасом. */
const PINYIN_CHAR_WIDTH = 7.5;
/** Поля внутри ячейки по бокам. */
const CELL_PADDING = 8;

/** Сколько колонок нужно слову. */
function spanOf(word: Word, unit: number, hanziSize: number): number {
  const chars = Array.from(word.hanzi).length;

  const needed =
    Math.max(chars * hanziSize, word.pinyin.length * PINYIN_CHAR_WIDTH) +
    CELL_PADDING;

  // Ширина n колонок вместе с промежутками: n * unit + (n - 1) * GAP
  const span = Math.ceil((needed + GAP) / (unit + GAP));
  return Math.min(Math.max(span, 1), COLUMNS);
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
        const span = spanOf(word, unit, hanziSize);

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
