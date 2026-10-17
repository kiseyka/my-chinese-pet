// src/components/path/PathNode.tsx
//
// Одна точка на карте пути: кружок с иероглифом этапа, одно кольцо общего прогресса
// вокруг него, подпись сбоку (название и навыки иконками: 📖 перевод 5/8, ✎ письмо 2/8)
// и кусок тропинки от предыдущей точки к следующей.
//
// Состояния:
//   пройден  — кружок залит primary, иероглиф белый, галочка в углу;
//   текущий  — крупнее, мягкий пульс вокруг;
//   впереди  — светлый кружок с бледным иероглифом (открыть тоже можно);
//   освоен   — как пройден, но в углу печать 印 вместо галочки.
// Кольцо заполняется по всем дорожкам вместе (слова с хотя бы 1 точкой в каждом навыке).
// Навыки различаются иконками, а не цветом: цвет у всего пути один — primary.
//
// Тропинка: строка рисует линию от середины между прошлой и своей точкой (верх строки)
// через свою точку до середины между своей и следующей (низ строки) — соседние строки
// стыкуются в одну змейку. Пройденный путь — сплошной цветной, дальше — пунктир.
// Подпись стоит с той стороны, где больше места.

import BookIcon from "@/assets/images/icons/book-open.svg";
import CheckIcon from "@/assets/images/icons/circle-check.svg";
import PencilIcon from "@/assets/images/icons/pencil.svg";
import { Hanzi } from "@/components/ui/Hanzi";
import { colors } from "@/theme/colors";
import { memo, useEffect, useRef } from "react";
import { Animated, Easing, Pressable, Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

export type PathNodeState = "passed" | "current" | "upcoming";

/** Навык этапа для подписи: иконка и «5/8». */
export interface PathSkill {
  id: "reading" | "writing";
  started: number;
  total: number;
}

/** Высота строки карты; центр кружка — посередине строки. */
export const PATH_ROW_HEIGHT = 112;

/** Насколько точки отходят от центра влево-вправо. */
const SWING = 64;

const NODE_SIZE = 56;
const CURRENT_SIZE = 66;
/** Кольцо прогресса: зазор от кружка и толщина. */
const RING_GAP = 5;
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
  state: PathNodeState;
  mastered: boolean;
  /** Следующая точка уже достигнута (пройдена или текущая): хвост вниз цветной. */
  nextReached: boolean;
  /** Общий прогресс этапа (0–1) — заполнение кольца. */
  share: number;
  /** Навыки под названием; пусто — подписи нет (этап ещё не начат). */
  skills: PathSkill[];
  onPress: (index: number) => void;
}

export const PathNode = memo(function PathNode({
  index,
  count,
  width,
  glyph,
  title,
  state,
  mastered,
  nextReached,
  share,
  skills,
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
  const outer = ringRadius + RING_WIDTH / 2;

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

        {/* Фон под кольцом, чтобы тропинка не просвечивала */}
        <Circle cx={x} cy={y} r={outer} fill={colors.background} />

        {/* Кольцо: дорожка и заполненная часть (начинается сверху) */}
        <Circle
          cx={x}
          cy={y}
          r={ringRadius}
          stroke={colors.progress.inactive}
          strokeWidth={RING_WIDTH}
          fill="none"
        />
        {share > 0 && (
          <Circle
            cx={x}
            cy={y}
            r={ringRadius}
            stroke={colors.primary}
            strokeWidth={RING_WIDTH}
            strokeLinecap="round"
            strokeDasharray={`${ringLength * Math.min(share, 1)} ${ringLength}`}
            fill="none"
            transform={`rotate(-90 ${x} ${y})`}
          />
        )}
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
        accessibilityLabel={`${title}${skills
          .map(
            (skill) =>
              `, ${skill.id === "reading" ? "перевод" : "письмо"} ${skill.started} из ${skill.total}`,
          )
          .join("")}`}
      >
        <View
          style={{ width: outer * 2, height: outer * 2 }}
          className="items-center justify-center"
        >
          <View
            className={`items-center justify-center rounded-full ${
              state === "passed" ? "bg-primary" : "bg-surface"
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

          {/* Угол: печать — освоен, галочка — пройден */}
          {mastered ? (
            <View
              className="absolute items-center justify-center rounded-md border-2 border-seal bg-surface"
              style={{ right: 0, top: 0, width: 22, height: 22 }}
            >
              <Text className="font-nunitoBold text-caption text-seal">印</Text>
            </View>
          ) : state === "passed" ? (
            <View
              className="absolute rounded-full bg-background"
              style={{ right: 0, top: 0 }}
            >
              <CheckIcon width={22} height={22} color={colors.primary} />
            </View>
          ) : null}
        </View>

        <View
          style={{ width: labelWidth, marginHorizontal: LABEL_GAP }}
          className={labelOnRight ? "items-start" : "items-end"}
        >
          {/* Карточка подписи: непрозрачная, чтобы текст читался поверх рисунка фона */}
          <View
            className={`rounded-2xl border border-border bg-surface px-3 py-1.5 ${
              labelOnRight ? "items-start" : "items-end"
            }`}
          >
          <Text
              numberOfLines={2}
              className={`${labelOnRight ? "text-left" : "text-right"} ${
                state === "current"
                  ? "font-nunitoBold text-lead text-text"
                  : state === "passed"
                    ? "font-nunitoBold text-body text-text"
                    : "font-nunito text-body text-text"
              }`}
            >
              {title}
            </Text>
            {skills.length > 0 && (
              <View className="mt-1 flex-row gap-3">
                {skills.map((skill) => (
                  <SkillCount key={skill.id} skill={skill} />
                ))}
              </View>
            )}
          </View>
        </View>
      </Pressable>
    </View>
  );
});

/** Навык под названием: иконка и «5/8»; пройденный — цветом primary. */
function SkillCount({ skill }: { skill: PathSkill }) {
  const done = skill.total > 0 && skill.started === skill.total;
  const color = done ? colors.primary : colors.textSecondary;
  const Icon = skill.id === "reading" ? BookIcon : PencilIcon;

  return (
    <View className="flex-row items-center gap-1">
      <Icon width={14} height={14} color={color} />
      <Text
        className={`font-nunitoMedium text-caption ${
          done ? "text-primary" : "text-textSecondary"
        }`}
      >
        {skill.started}/{skill.total}
      </Text>
    </View>
  );
}

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
