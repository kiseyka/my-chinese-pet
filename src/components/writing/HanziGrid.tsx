// src/components/writing/HanziGrid.tsx
//
// Сетка слов для письма: иероглиф, пиньинь и точки по написанию под каждой ячейкой.
// Двусложное слово занимает две колонки, точки у него общие (за всё слово целиком).
//
// Состояния ячейки:
//   заливка bg-primary/20 — слово освоено (3 точки);
//   рамка border-primary  — слово на «Повторении».
// Рамка есть у всех ячеек (у обычных прозрачная), чтобы содержимое не сдвигалось.

import { Hanzi } from "@/components/ui/Hanzi";
import { Pinyin } from "@/components/ui/Pinyin";
import type { Word } from "@/content/flashcards/types";
import { Pressable, View, useWindowDimensions } from "react-native";

/** Колонок в сетке; двусложное слово занимает две. */
const COLUMNS = 5;
const GAP = 8;

interface WritingDotsProps {
  level: number;
}

/** Три точки прогресса: закрашено столько, сколько точек у слова. */
export function WritingDots({ level }: WritingDotsProps) {
  return (
    <View className="flex-row gap-1">
      {[0, 1, 2].map((index) => (
        <View
          key={index}
          className={`h-1.5 w-1.5 rounded-full ${
            index < level ? "bg-primary" : "bg-primary/20"
          }`}
        />
      ))}
    </View>
  );
}

interface HanziGridProps {
  words: Word[];
  /** Точки слова по письму (0–3). */
  getLevel: (word: Word) => number;
  onSelect: (word: Word) => void;
  /** Слово в «Повторении»: ячейка обведена акцентной рамкой. */
  isMarked?: (word: Word) => boolean;
  /** Отступы по бокам у контейнера сетки (чтобы посчитать ширину ячейки). */
  horizontalInset?: number;
}

export function HanziGrid({
  words,
  getLevel,
  onSelect,
  isMarked,
  horizontalInset = 32,
}: HanziGridProps) {
  const { width } = useWindowDimensions();
  const unit = Math.floor(
    (width - horizontalInset - GAP * (COLUMNS - 1)) / COLUMNS,
  );

  return (
    <View className="flex-row flex-wrap" style={{ gap: GAP }}>
      {words.map((word) => {
        const span = Math.min(Array.from(word.hanzi).length, 2);
        const level = getLevel(word);
        const marked = isMarked?.(word) ?? false;

        return (
          <Pressable
            key={word.vocabularyId}
            onPress={() => onSelect(word)}
            className={`items-center justify-center rounded-2xl border-2 pb-2 pt-1 active:opacity-70 ${
              level >= 3 ? "bg-primary/20" : "bg-surface"
            } ${marked ? "border-primary" : "border-transparent"}`}
            style={{ width: unit * span + GAP * (span - 1) }}
            accessibilityRole="button"
            accessibilityLabel={`${word.hanzi}, ${word.pinyin}${
              marked ? ", на повторении" : ""
            }`}
          >
            <Hanzi size={Math.round(unit * 0.5)} maxFontSizeMultiplier={1.2}>
              {word.hanzi}
            </Hanzi>
            <Pinyin size="sm" numberOfLines={1} maxFontSizeMultiplier={1.2}>
              {word.pinyin}
            </Pinyin>
            <View className="mt-1">
              <WritingDots level={level} />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
