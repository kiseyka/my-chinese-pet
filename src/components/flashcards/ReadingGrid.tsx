// src/components/flashcards/ReadingGrid.tsx
//
// Сетка слов для карточек: иероглиф, пиньинь и точки чтения. Перевод скрыт —
// тренировка как раз «иероглиф → перевод»; он показывается по тапу (WordSheet).
// 4 колонки. Ячейка занимает столько колонок, сколько нужно, чтобы влезли
// иероглифы и пиньинь: 2 иероглифа влезают в одну, 3–4 — в две. Ширина пиньиня
// считается по ширинам букв шрифта (utils/textWidth); длинный пиньинь сначала
// чуть уменьшается и только потом расширяет ячейку.

import { Hanzi } from "@/components/ui/Hanzi";
import { Pinyin } from "@/components/ui/Pinyin";
import { WritingDots } from "@/components/writing/home/WritingDots";
import type { Word } from "@/content/flashcards/types";
import { pinyinWidth } from "@/utils/textWidth";
import { memo } from "react";
import { Pressable, View, useWindowDimensions } from "react-native";

const COLUMNS = 4;
const GAP = 8;

interface ReadingGridProps {
  words: Word[];
  /** Точки чтения каждого слова, в том же порядке. */
  dots: number[];
  /** Без него ячейки не нажимаются (только просмотр). */
  onSelect?: (word: Word) => void;
  /** Сколько ширины экрана не достаётся сетке (все отступы по бокам вместе). */
  horizontalInset: number;
  /** Отмеченное слово (например, уже в наборе): зелёная рамка. */
  isMarked?: (word: Word) => boolean;
  /** Подсказка для чтения с экрана: что сделает тап. */
  actionHint?: string;
}

/** Размер пиньиня в ячейке (Pinyin size="sm"). */
const PINYIN_SIZE = 14;
/** Поля внутри ячейки по бокам (с запасом на рамку и крупный системный шрифт). */
const CELL_PADDING = 10;

/** Пиньинь можно чуть уменьшить, чтобы слово влезло в меньше колонок. */
const PINYIN_MIN_SIZE = 12;

/**
 * Сколько колонок нужно слову и каким размером писать пиньинь.
 * Если пиньинь не влезает обычным размером, сначала пробуем его уменьшить
 * (до PINYIN_MIN_SIZE) — и только потом расширяем ячейку.
 */
function layoutOf(
  word: Word,
  unit: number,
  hanziSize: number,
): { span: number; pinyinSize: number } {
  const chars = Array.from(word.hanzi).length;
  const spanFor = (width: number) => {
    // Ширина n колонок вместе с промежутками: n * unit + (n - 1) * GAP
    const span = Math.ceil((width + CELL_PADDING + GAP) / (unit + GAP));
    return Math.min(Math.max(span, 1), COLUMNS);
  };

  const hanziWidth = chars * hanziSize;
  const normal = spanFor(
    Math.max(hanziWidth, pinyinWidth(word.pinyin, PINYIN_SIZE)),
  );
  const byHanzi = spanFor(hanziWidth);
  if (normal === byHanzi) return { span: normal, pinyinSize: PINYIN_SIZE };

  // Пиньинь шире иероглифов: можно ли уложить его в ширину по иероглифам, уменьшив?
  const room = byHanzi * unit + (byHanzi - 1) * GAP - CELL_PADDING;
  for (let size = PINYIN_SIZE - 1; size >= PINYIN_MIN_SIZE; size -= 1) {
    if (pinyinWidth(word.pinyin, size) <= room) {
      return { span: byHanzi, pinyinSize: size };
    }
  }
  return { span: normal, pinyinSize: PINYIN_SIZE };
}

export const ReadingGrid = memo(function ReadingGrid({
  words,
  dots,
  onSelect,
  horizontalInset,
  isMarked,
  actionHint = "Показать перевод",
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
        const { span, pinyinSize } = layoutOf(word, unit, hanziSize);
        const marked = isMarked?.(word) ?? false;

        return (
          <Pressable
            key={word.vocabularyId}
            onPress={onSelect ? () => onSelect(word) : undefined}
            disabled={!onSelect}
            // Рамка есть у всех ячеек (у обычных прозрачная), чтобы содержимое не сдвигалось
            className={`items-center justify-center rounded-2xl border-2 pb-2 pt-1 active:bg-primary/10 ${
              marked ? "border-primary bg-primary/10" : "border-transparent"
            }`}
            style={{ width: unit * span + GAP * (span - 1) }}
            accessibilityRole="button"
            accessibilityLabel={`${word.hanzi}, ${word.pinyin}`}
            accessibilityState={isMarked ? { selected: marked } : undefined}
            accessibilityHint={actionHint}
          >
            <Hanzi
              size={hanziSize}
              numberOfLines={1}
              maxFontSizeMultiplier={1.2}
            >
              {word.hanzi}
            </Hanzi>
            <Pinyin
              size={pinyinSize}
              numberOfLines={1}
              maxFontSizeMultiplier={1.2}
            >
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
