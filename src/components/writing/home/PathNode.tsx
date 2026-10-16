// src/components/writing/home/PathNode.tsx
//
// Одна точка на карте пути «Написания»: кружок с иероглифом темы и подпись под ним,
// плюс кусок тропинки (пунктир) от предыдущей точки и к следующей.
//
// Состояния кружка:
//   пройдена  — залит primary, иероглиф белый (её можно открыть и тренировать);
//   текущая   — крупнее, толстое кольцо primary, под подписью «начато N из M»;
//   впереди   — пунктирное кольцо, бледный иероглиф (открыть тоже можно).
//
// Тропинка: строка рисует пунктир от середины между прошлой и своей точкой (верх строки)
// через свою точку до середины между своей и следующей (низ строки). Соседние строки
// стыкуются ровно, поэтому линия получается сплошной змейкой.

import { Hanzi } from "@/components/ui/Hanzi";
import { colors } from "@/theme/colors";
import { memo } from "react";
import { Pressable, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

export type PathNodeState = "passed" | "current" | "upcoming";

/** Высота строки карты; центр кружка — посередине строки. */
export const PATH_ROW_HEIGHT = 124;

/** Насколько точки отходят от центра влево-вправо. */
const SWING = 72;

const NODE_SIZE = 60;
const CURRENT_SIZE = 76;

/** Сдвиг точки от центра: плавная змейка (0, вправо, ещё вправо, обратно, влево…). */
export function pathOffset(index: number): number {
  return Math.round(Math.sin((index * Math.PI) / 4) * SWING);
}

interface PathNodeProps {
  index: number;
  /** Сколько точек всего: у последней нет хвоста вниз. */
  count: number;
  /** Ширина строки (ширина экрана без отступов). */
  width: number;
  glyph: string;
  title: string;
  state: PathNodeState;
  started: number;
  total: number;
  onPress: (index: number) => void;
}

export const PathNode = memo(function PathNode({
  index,
  count,
  width,
  glyph,
  title,
  state,
  started,
  total,
  onPress,
}: PathNodeProps) {
  const center = width / 2;
  const x = center + pathOffset(index);
  const y = PATH_ROW_HEIGHT / 2 - 14; // кружок чуть выше середины: под ним подпись
  const top = center + (pathOffset(index - 1) + pathOffset(index)) / 2;
  const bottom = center + (pathOffset(index) + pathOffset(index + 1)) / 2;

  const segments = [
    index > 0 ? `M ${top} 0 Q ${top} ${y / 2} ${x} ${y}` : `M ${x} ${y}`,
    index < count - 1
      ? `Q ${bottom} ${(y + PATH_ROW_HEIGHT) / 2} ${bottom} ${PATH_ROW_HEIGHT}`
      : "",
  ].join(" ");

  const size = state === "current" ? CURRENT_SIZE : NODE_SIZE;

  const circleClass =
    state === "passed"
      ? "bg-primary"
      : state === "current"
        ? "bg-surface border-4 border-primary"
        : "border-2 border-dashed border-accentOlive";

  const glyphClass =
    state === "passed"
      ? "text-white"
      : state === "current"
        ? "text-text"
        : "text-textSecondary";

  return (
    <View style={{ height: PATH_ROW_HEIGHT, width }}>
      <Svg
        width={width}
        height={PATH_ROW_HEIGHT}
        style={{ position: "absolute", left: 0, top: 0 }}
        pointerEvents="none"
      >
        <Path
          d={segments}
          stroke={colors.accentOlive}
          strokeWidth={3}
          strokeDasharray="6 8"
          strokeLinecap="round"
          fill="none"
        />
      </Svg>

      <Pressable
        onPress={() => onPress(index)}
        hitSlop={8}
        className="absolute items-center active:opacity-70"
        style={{ left: x - 80, width: 160, top: y - size / 2 }}
        accessibilityRole="button"
        accessibilityLabel={`${title}: начато ${started} из ${total}`}
      >
        <View
          className={`items-center justify-center rounded-full ${circleClass}`}
          style={{
            width: size,
            height: size,
            // Пунктирной точке нужен фон, иначе сквозь неё видна тропинка
            backgroundColor: state === "upcoming" ? colors.background : undefined,
          }}
        >
          <Hanzi
            size={state === "current" ? 34 : 28}
            className={glyphClass}
            maxFontSizeMultiplier={1.2}
          >
            {glyph}
          </Hanzi>
        </View>

        <Text
          numberOfLines={1}
          className={`mt-1 text-center text-small ${
            state === "current"
              ? "font-nunitoBold text-text"
              : state === "passed"
                ? "font-nunitoMedium text-text"
                : "font-nunito text-textSecondary"
          }`}
        >
          {title}
        </Text>
        {state === "current" && (
          <Text className="font-nunito text-caption text-textSecondary">
            начато {started} из {total}
          </Text>
        )}
      </Pressable>
    </View>
  );
});
