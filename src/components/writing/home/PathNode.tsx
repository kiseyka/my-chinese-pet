// src/components/writing/home/PathNode.tsx
//
// Одна точка на карте пути «Написания»: кружок с иероглифом темы, кольцо прогресса
// вокруг него, подпись сбоку и кусок тропинки от предыдущей точки к следующей.
//
// Состояния:
//   пройдена  — кружок залит primary, иероглиф белый, под названием «изучено N из M»;
//   текущая   — крупнее, рамка primary и мягкий пульс вокруг, «начато N из M»;
//   впереди   — светлый кружок с бледным иероглифом (открыть тоже можно).
// Кольцо вокруг кружка заполняется по изученным словам (3 точки): видно, какие темы
// уже освоены целиком, а какие только начаты.
//
// Тропинка: строка рисует линию от середины между прошлой и своей точкой (верх строки)
// через свою точку до середины между своей и следующей (низ строки) — соседние строки
// стыкуются в одну змейку. Пройденный путь — сплошной цветной, дальше — пунктир.
// Подпись стоит с той стороны, где больше места.

import { Hanzi } from "@/components/ui/Hanzi";
import { colors } from "@/theme/colors";
import { memo, useEffect, useRef } from "react";
import { Animated, Easing, Pressable, Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

export type PathNodeState = "passed" | "current" | "upcoming";

/** Высота строки карты; центр кружка — посередине строки. */
export const PATH_ROW_HEIGHT = 104;

/** Насколько точки отходят от центра влево-вправо. */
const SWING = 64;

const NODE_SIZE = 56;
const CURRENT_SIZE = 68;
/** Кольцо прогресса: зазор от кружка и толщина. */
const RING_GAP = 5;
const RING_WIDTH = 4;
/** Отступ подписи от кольца. */
const LABEL_GAP = 10;

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
  /** Следующая точка уже достигнута (пройдена или текущая): хвост вниз цветной. */
  nextReached: boolean;
  started: number;
  learned: number;
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
  nextReached,
  started,
  learned,
  total,
  onPress,
}: PathNodeProps) {
  const center = width / 2;
  const x = center + pathOffset(index);
  const y = PATH_ROW_HEIGHT / 2;
  const top = center + (pathOffset(index - 1) + pathOffset(index)) / 2;
  const bottom = center + (pathOffset(index) + pathOffset(index + 1)) / 2;

  const reached = state !== "upcoming";
  const size = state === "current" ? CURRENT_SIZE : NODE_SIZE;
  const ringRadius = size / 2 + RING_GAP + RING_WIDTH / 2;
  const ringLength = 2 * Math.PI * ringRadius;
  const share = total > 0 ? learned / total : 0;
  const outer = ringRadius + RING_WIDTH / 2;

  // Подпись — с той стороны, где больше места
  const labelOnRight = x <= center;
  const labelWidth = labelOnRight
    ? width - (x + outer + LABEL_GAP)
    : x - outer - LABEL_GAP;

  const caption =
    state === "current"
      ? `начато ${started} из ${total}`
      : state === "passed"
        ? `изучено ${learned} из ${total}`
        : null;

  return (
    <View style={{ height: PATH_ROW_HEIGHT, width }}>
      <Svg
        width={width}
        height={PATH_ROW_HEIGHT}
        style={{ position: "absolute", left: 0, top: 0 }}
        pointerEvents="none"
      >
        {index > 0 && (
          <PathSegment
            d={`M ${top} 0 Q ${top} ${y / 2} ${x} ${y}`}
            active={reached}
          />
        )}
        {index < count - 1 && (
          <PathSegment
            d={`M ${x} ${y} Q ${bottom} ${(y + PATH_ROW_HEIGHT) / 2} ${bottom} ${PATH_ROW_HEIGHT}`}
            active={nextReached}
          />
        )}

        {/* Кольцо прогресса: дорожка и изученная часть (начинается сверху) */}
        <Circle
          cx={x}
          cy={y}
          r={ringRadius}
          stroke={colors.progress.inactive}
          strokeWidth={RING_WIDTH}
          fill={colors.background}
        />
        {share > 0 && (
          <Circle
            cx={x}
            cy={y}
            r={ringRadius}
            stroke={colors.primary}
            strokeWidth={RING_WIDTH}
            strokeLinecap="round"
            strokeDasharray={`${ringLength * share} ${ringLength}`}
            fill="none"
            transform={`rotate(-90 ${x} ${y})`}
          />
        )}
      </Svg>

      {state === "current" && <Pulse x={x} y={y} size={size} />}

      <Pressable
        onPress={() => onPress(index)}
        className="absolute flex-row items-center active:opacity-70"
        style={{
          top: y - outer,
          height: outer * 2,
          left: labelOnRight ? x - outer : x - outer - LABEL_GAP - labelWidth,
          width: outer * 2 + LABEL_GAP + labelWidth,
          flexDirection: labelOnRight ? "row" : "row-reverse",
        }}
        accessibilityRole="button"
        accessibilityLabel={`${title}: изучено ${learned} из ${total}`}
      >
        <View
          style={{ width: outer * 2, height: outer * 2 }}
          className="items-center justify-center"
        >
          <View
            className={`items-center justify-center rounded-full ${
              state === "passed"
                ? "bg-primary"
                : state === "current"
                  ? "border-[3px] border-primary bg-surface"
                  : "border-2 border-border bg-surface"
            }`}
            style={{ width: size, height: size }}
          >
            <Hanzi
              size={state === "current" ? 32 : 26}
              weight={state === "upcoming" ? "regular" : "medium"}
              className={
                state === "passed"
                  ? "text-white"
                  : state === "current"
                    ? "text-text"
                    : "text-textSecondary"
              }
              maxFontSizeMultiplier={1.2}
            >
              {glyph}
            </Hanzi>
          </View>
        </View>

        <View
          style={{ width: labelWidth, marginHorizontal: LABEL_GAP }}
          className={labelOnRight ? "items-start" : "items-end"}
        >
          <Text
            numberOfLines={2}
            className={`${labelOnRight ? "text-left" : "text-right"} ${
              state === "current"
                ? "font-nunitoBold text-lead text-text"
                : state === "passed"
                  ? "font-nunitoBold text-body text-text"
                  : "font-nunito text-body text-textSecondary"
            }`}
          >
            {title}
          </Text>
          {caption && (
            <Text className="font-nunito text-caption text-textSecondary">
              {caption}
            </Text>
          )}
        </View>
      </Pressable>
    </View>
  );
});

function PathSegment({ d, active }: { d: string; active: boolean }) {
  return (
    <Path
      d={d}
      stroke={active ? colors.progress.active : colors.progress.inactive}
      strokeWidth={6}
      strokeDasharray={active ? undefined : "2 12"}
      strokeLinecap="round"
      fill="none"
    />
  );
}

// ── Пульс вокруг текущей точки ───────────────────────────────────────────────

function Pulse({ x, y, size }: { x: number; y: number; size: number }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 1800,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [progress]);

  const pulseSize = size + RING_GAP * 2 + RING_WIDTH * 2;

  return (
    <Animated.View
      pointerEvents="none"
      className="absolute rounded-full bg-primary"
      style={{
        left: x - pulseSize / 2,
        top: y - pulseSize / 2,
        width: pulseSize,
        height: pulseSize,
        opacity: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0.28, 0],
        }),
        transform: [
          {
            scale: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.45],
            }),
          },
        ],
      }}
    />
  );
}
