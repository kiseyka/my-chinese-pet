// src/components/path/PathWordGrid.tsx
//
// Сетка слов этапа на экране этапа: иероглиф и под ним две строки точек —
// перевод (зелёные) и письмо (тёмные, как тушь; только у слов, которые можно писать).
// 4 колонки; слово из нескольких иероглифов занимает несколько колонок (до 4).

import { Hanzi } from "@/components/ui/Hanzi";
import type { Word } from "@/content/flashcards/types";
import type { TrackId } from "@/utils/path/stages";
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
}

export function PathWordGrid({
  words,
  getDots,
  onSelect,
  horizontalInset,
}: PathWordGridProps) {
  const { width } = useWindowDimensions();
  const unit = Math.floor(
    (width - horizontalInset - GAP * (COLUMNS - 1)) / COLUMNS,
  );

  return (
    <View className="flex-row flex-wrap" style={{ gap: GAP }}>
      {words.map((word) => {
        const span = Math.min(Array.from(word.hanzi).length, COLUMNS);
        const cellWidth = unit * span + GAP * (span - 1);

        return (
          <Pressable
            key={word.vocabularyId}
            onPress={() => onSelect(word)}
            className="items-center gap-1 rounded-xl py-2 active:bg-primary/10"
            style={{ width: cellWidth }}
            accessibilityRole="button"
            accessibilityLabel={word.hanzi}
          >
            <Hanzi
              size={Math.min(28, unit * 0.5)}
              numberOfLines={1}
              adjustsFontSizeToFit
              maxFontSizeMultiplier={1.2}
            >
              {word.hanzi}
            </Hanzi>
            <SkillDots track="reading" level={getDots(word, "reading")} />
            <SkillDots track="writing" level={getDots(word, "writing")} />
          </Pressable>
        );
      })}
    </View>
  );
}

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
