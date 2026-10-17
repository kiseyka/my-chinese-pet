// src/components/path/PathNode.tsx
//
// Одна точка на карте пути: кружок с иероглифом этапа, кольца прогресса вокруг него
// (по одному на дорожку: снаружи перевод, внутри письмо), подпись сбоку и кусок
// тропинки от предыдущей точки к следующей.
//
// Состояния:
//   пройден  — кружок залит primary, иероглиф белый;
//   текущий  — крупнее, рамка primary и мягкий пульс вокруг;
//   впереди  — светлый кружок с бледным иероглифом (открыть тоже можно);
//   освоен   — как пройден, плюс маленькая печать в углу.
// Кольцо дорожки заполняется по словам с хотя бы 1 точкой: полное кольцо = дорожка пройдена.
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

export interface PathRing {
  /** Доля заполнения (0–1). */
  share: number;
  color: string;
}

/** Высота строки карты; центр кружка — посередине строки. */
export const PATH_ROW_HEIGHT = 112;

/** Насколько точки отходят от центра влево-вправо. */
const SWING = 64;

const NODE_SIZE = 54;
const CURRENT_SIZE = 64;
/** Кольца прогресса: зазор от кружка (и между кольцами) и толщина. */
const RING_GAP = 3;
const RING_WIDTH = 4;
/** Отступ подписи от колец. */
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
  /** Строка под названием: «перевод 5/8 · письмо 2/8». */
  caption?: string;
  state: PathNodeState;
  mastered: boolean;
  /** Следующая точка уже достигнута (пройдена или текущая): хвост вниз цветной. */
  nextReached: boolean;
  /** Кольца от внутреннего к внешнему. */
  rings: PathRing[];
  onPress: (index: number) => void;
}

export const PathNode = memo(function PathNode({
  index,
  count,
  width,
  glyph,
  title,
  caption,
  state,
  mastered,
  nextReached,
  rings,
  onPress,
}: PathNodeProps) {
  const center = width / 2;
  const x = center + pathOffset(index);
  const y = PATH_ROW_HEIGHT / 2;
  const top = center + (pathOffset(index - 1) + pathOffset(index)) / 2;
  const bottom = center + (pathOffset(index) + pathOffset(index + 1)) / 2;

  const reached = state !== "upcoming";
  const size = state === "current" ? CURRENT_SIZE : NODE_SIZE;
  const ringRadius = (i: number) =>
    size / 2 + RING_GAP + RING_WIDTH / 2 + i * (RING_WIDTH + RING_GAP);
  const outer = ringRadius(rings.length - 1) + RING_WIDTH / 2;

  // Подпись — с той стороны, где больше места
  const labelOnRight = x <= center;
  const labelWidth = labelOnRight
    ? width - (x + outer + LABEL_GAP)
    : x - outer - LABEL_GAP;

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

        {/* Фон под кольцами, чтобы тропинка не просвечивала */}
        <Circle cx={x} cy={y} r={outer} fill={colors.background} />

        {/* Кольца: дорожка и заполненная часть (начинается сверху) */}
        {rings.map((ring, i) => {
          const r = ringRadius(i);
          const length = 2 * Math.PI * r;
          return [
            <Circle
              key={`track-${i}`}
              cx={x}
              cy={y}
              r={r}
              stroke={colors.progress.inactive}
              strokeWidth={RING_WIDTH}
              fill="none"
            />,
            ring.share > 0 ? (
              <Circle
                key={`fill-${i}`}
                cx={x}
                cy={y}
                r={r}
                stroke={ring.color}
                strokeWidth={RING_WIDTH}
                strokeLinecap="round"
                strokeDasharray={`${length * Math.min(ring.share, 1)} ${length}`}
                fill="none"
                transform={`rotate(-90 ${x} ${y})`}
              />
            ) : null,
          ];
        })}
      </Svg>

      {state === "current" && <Pulse x={x} y={y} size={outer * 2} />}

      <Pressable
        onPress={() => onPress(index)}
        className="absolute items-center active:opacity-70"
        style={{
          top: y - outer,
          height: outer * 2,
          left: labelOnRight ? x - outer : x - outer - LABEL_GAP - labelWidth,
          width: outer * 2 + LABEL_GAP + labelWidth,
          flexDirection: labelOnRight ? "row" : "row-reverse",
        }}
        accessibilityRole="button"
        accessibilityLabel={`${title}${caption ? `: ${caption}` : ""}`}
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
              size={state === "current" ? 30 : 26}
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

          {mastered && (
            <View
              className="absolute items-center justify-center rounded-md border-2 border-seal bg-surface"
              style={{ right: 0, top: 0, width: 22, height: 22 }}
            >
              <Text className="font-nunitoBold text-caption text-seal">印</Text>
            </View>
          )}
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
            <Text
              numberOfLines={1}
              className="font-nunito text-caption text-textSecondary"
            >
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

  return (
    <Animated.View
      pointerEvents="none"
      className="absolute rounded-full bg-primary"
      style={{
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        opacity: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0.25, 0],
        }),
        transform: [
          {
            scale: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.35],
            }),
          },
        ],
      }}
    />
  );
}
