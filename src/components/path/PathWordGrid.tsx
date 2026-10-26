// src/components/path/PathWordGrid.tsx
//
// Сетка слов этапа на экране этапа: иероглиф и под ним две строки точек —
// перевод (зелёные) и письмо (тёмные, как тушь; только у слов, которые можно писать).
// 4 колонки. Слово из 1–2 иероглифов — одна ячейка (два знака чуть мельче),
// из 3 и больше — две ячейки: иначе длинные слова съедают ряд.
//
// getStatus (в «Словаре»): слово в «Повторении» — зелёная рамка,
// в «Изученном» — фон шалфея (не серый: серый читается как «выключено»).

import { Hanzi } from "@/components/ui/Hanzi";
import type { Word } from "@/content/flashcards/types";
import type { WordStatus } from "@/store/gameStore";
import type { TrackId } from "@/utils/path/stages";
import { memo } from "react";
import { Pressable, View, useWindowDimensions } from "react-native";

const COLUMNS = 4;
const GAP = 6;

/** Цвет точек дорожки (классы tailwind): заполненная и пустая. */
export const TRACK_DOT_CLASSES: Record<TrackId, [string, string]> = {
  reading: ["bg-primary", "bg-primary/20"],
  writing: ["bg-text", "bg-text/20"],
};

interface PathWordGridProps {
  words: Word[];
  /** Точки слова по дорожке; undefined — у слова нет этой дорожки. */
  getDots: (word: Word, track: TrackId) => number | undefined;
  onSelect: (word: Word) => void;
  /** Сколько ширины экрана не достаётся сетке (все отступы по бокам вместе). */
  horizontalInset: number;
  /** Где слово: в «Повторении», «Изученном» или ещё учится. Без него — без отметок. */
  getStatus?: (word: Word) => WordStatus;
}

const STATUS_CELL: Record<WordStatus, string> = {
  learning: "border-transparent",
  review: "border-primary",
  learned: "border-learnedBorder bg-learned",
};

// memo: в «Словаре» сотни сеток — перерисовываются только те, у которых что-то поменялось
export const PathWordGrid = memo(function PathWordGrid({
  words,
  getDots,
  onSelect,
  horizontalInset,
  getStatus,
}: PathWordGridProps) {
  const { width } = useWindowDimensions();
  const unit = Math.floor(
    (width - horizontalInset - GAP * (COLUMNS - 1)) / COLUMNS,
  );

  return (
    <View className="flex-row flex-wrap" style={{ gap: GAP }}>
      {words.map((word) => {
        const length = Array.from(word.hanzi).length;
        const span = length >= 3 ? 2 : 1;
        const cellWidth = unit * span + GAP * (span - 1);
        // Размер знака: чтобы слово влезло в ячейку с небольшими полями
        const fontSize = Math.min(
          28,
          Math.floor((cellWidth - 8) / Math.max(length, span === 1 ? 1 : 2)),
        );

        const readingDots = getDots(word, "reading");
        const writingDots = getDots(word, "writing");

        return (
          <Pressable
            key={word.vocabularyId}
            onPress={() => onSelect(word)}
            className={`items-center gap-1 rounded-xl border py-2 active:bg-primary/10 ${
              STATUS_CELL[getStatus?.(word) ?? "learning"]
            }`}
            style={{ width: cellWidth }}
            accessibilityRole="button"
            accessibilityLabel={word.hanzi}
          >
            <Hanzi
              size={fontSize}
              numberOfLines={1}
              adjustsFontSizeToFit
              maxFontSizeMultiplier={1.2}
            >
              {word.hanzi}
            </Hanzi>
            <SkillDots track="reading" level={readingDots} />
            <SkillDots track="writing" level={writingDots} />
          </Pressable>
        );
      })}
    </View>
  );
});

function SkillDots({
  track,
  level,
}: {
  track: TrackId;
  level: number | undefined;
}) {
  const [filled, empty] = TRACK_DOT_CLASSES[track];

  // Нет дорожки — пустое место той же высоты, чтобы ячейки не прыгали
  if (level === undefined) return <View className="h-1.5" />;

  return (
    <View className="flex-row gap-1">
      {[0, 1, 2].map((index) => (
        <View
          key={index}
          className={`h-1.5 w-1.5 rounded-full ${index < level ? filled : empty}`}
        />
      ))}
    </View>
  );
}
