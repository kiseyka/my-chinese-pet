// src/components/writing/HanziGrid.tsx
//
// Сетка слов для письма: иероглиф, пиньинь и точки по написанию под каждой ячейкой.
// Двусложное слово занимает две колонки, точки у него общие (за всё слово целиком).
//
// Состояния ячейки:
//   без фона и рамки                 — обычное слово (освоенность видна по точкам);
//   рамка border-primary             — слово на «Повторении»;
//   красная печать 印 в углу         — слово готово к экзамену;
//   галочка в углу + PASSED_BG       — экзамен по слову сдан.
// Рамка есть у всех ячеек (у обычных прозрачная), чтобы содержимое не сдвигалось.

import CheckIcon from "@/assets/images/icons/circle-check.svg";
import { Hanzi } from "@/components/ui/Hanzi";
import { Pinyin } from "@/components/ui/Pinyin";
import type { Word } from "@/content/flashcards/types";
import { cssInterop } from "nativewind";
import { Pressable, View, useWindowDimensions } from "react-native";
import { SealMark } from "./SealMark";

cssInterop(CheckIcon, {
  className: { target: "style", nativeStyleToProp: { color: true } },
});

/** Колонок в сетке; двусложное слово занимает две. */
const COLUMNS = 4;
const GAP = 8;

/** Фон ячейки слова, по которому сдан экзамен. */
const PASSED_BG = "bg-primary/10";

/** Размер метки в углу: у одиночной ячейки меньше, чтобы не наезжать на иероглиф. */
const MARK_SIZE_SINGLE = 14;
const MARK_SIZE_WIDE = 18;

/** Метка экзамена на ячейке: готово к сдаче или сдано. */
export type ExamMark = "ready" | "passed" | null;

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
  /** Метка экзамена: печать — готово к сдаче, галочка — сдано. */
  getExamMark?: (word: Word) => ExamMark;
  /** Сколько ширины экрана не достаётся сетке (все отступы по бокам вместе). */
  horizontalInset?: number;
}

export function HanziGrid({
  words,
  getLevel,
  onSelect,
  isMarked,
  getExamMark,
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
        const examMark = getExamMark?.(word) ?? null;
        const isWide = span > 1;
        const markSize = isWide ? MARK_SIZE_WIDE : MARK_SIZE_SINGLE;

        const examLabel =
          examMark === "ready"
            ? ", готово к экзамену"
            : examMark === "passed"
              ? ", экзамен сдан"
              : "";

        return (
          <Pressable
            key={word.vocabularyId}
            onPress={() => onSelect(word)}
            className={`items-center justify-center rounded-2xl border-2 pb-2 pt-1 active:opacity-70 ${
              examMark === "passed" ? PASSED_BG : ""
            } ${marked ? "border-primary" : "border-transparent"}`}
            style={{ width: unit * span + GAP * (span - 1) }}
            accessibilityRole="button"
            accessibilityLabel={`${word.hanzi}, ${word.pinyin}${
              marked ? ", на повторении" : ""
            }${examLabel}`}
          >
            {examMark && (
              <View
                className={`absolute ${
                  isWide ? "right-1.5 top-1.5" : "right-1 top-1"
                }`}
              >
                {examMark === "ready" ? (
                  <SealMark size={markSize} />
                ) : (
                  <CheckIcon
                    width={markSize}
                    height={markSize}
                    className="text-primary"
                  />
                )}
              </View>
            )}

            <Hanzi size={Math.round(unit * 0.45)} maxFontSizeMultiplier={1.2}>
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
