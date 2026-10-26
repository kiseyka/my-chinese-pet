// src/components/path/PathNode.tsx
//
// Одна точка на карте пути: кружок с иероглифом этапа, одно кольцо общего прогресса
// вокруг него, подпись сбоку (название и навыки иконками: 文A перевод 5/8, ✎ письмо 2/8)
// и кусок тропинки от предыдущей точки к следующей.
//
// Состояния:
//   впереди  — белый кружок, серое кольцо (зелёная шкала — если слова уже начаты);
//   текущий  — единственный зелёный: залит primary, иероглиф белый, кольцо белое
//              с зелёной шкалой прогресса; чуть крупнее, мягкий пульс вокруг;
//   пройден  — белый кружок, кольцо заполнено зелёным;
//   освоен   — как пройден, плюс галочка в углу: у каждого слова 3 точки
//              и в переводе, и в письме. Галочка — только за освоение.
// Кольцо заполняется по всем дорожкам вместе (слова с хотя бы 1 точкой в каждом навыке).
// Навыки различаются иконками (文A — перевод, карандаш — письмо), а не цветом:
// цвет у всего пути один — primary.
//
// Навык на карточке — три вида, без плашек и заливок:
//   не пройден — серая иконка и «начато / всего» (сколько слов с хотя бы 1 точкой);
//   пройден    — зелёная иконка и ✓;
//   освоен     — зелёная иконка и галочка в кружке.
// Сколько слов уже освоено — на экране этапа.
//
// Название: « · » склеено неразрывными пробелами, чтобы «· 2» не отрывалось от темы.
//
// Тропинка: строка рисует линию от середины между прошлой и своей точкой (верх строки)
// через свою точку до середины между своей и следующей (низ строки) — соседние строки
// стыкуются в одну змейку. Пройденный путь — сплошной, дальше — пунктир того же
// зелёного (PATH_DASH_OPACITY): бледно-серый терялся на фоне.
// Пунктир рисуется кусками (у каждой строки свои), поэтому каждый кусок подгоняется
// под целое число черточек с полупромежутками на концах (evenDash): на стыках
// всегда обычный промежуток, без слипшихся или пропавших черточек.
// Подпись стоит с той стороны, где больше места.

import CheckIcon from "@/assets/images/icons/circle-check.svg";
import LanguagesIcon from "@/assets/images/icons/languages.svg";
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
  /** Слов с хотя бы 1 точкой. */
  started: number;
  /** Слов с 3 точками. */
  learned: number;
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

/** Пунктир непройденной тропинки: тот же зелёный, чуть прозрачнее сплошной. */
export const PATH_DASH_OPACITY = 0.75;
/** Черточка (с круглыми концами становится точкой) и промежуток пунктира. */
const DASH = 2;
const DASH_GAP = 12;

/**
 * Пунктир, подогнанный под длину куска: целое число черточек, на обоих концах —
 * половина промежутка. Тогда соседние куски стыкуются без сбоя ритма.
 */
export function evenDash(length: number): {
  strokeDasharray: string;
  strokeDashoffset: number;
} {
  const count = Math.max(1, Math.round(length / (DASH + DASH_GAP)));
  const gap = length / count - DASH;
  return {
    strokeDasharray: `${DASH} ${gap}`,
    // Начинаем с середины промежутка
    strokeDashoffset: DASH + gap / 2,
  };
}

/** Длина квадратичной кривой (численно, ломаной из 24 отрезков). */
function quadLength(
  x0: number, y0: number, cx: number, cy: number, x1: number, y1: number,
): number {
  let length = 0;
  let px = x0;
  let py = y0;
  for (let i = 1; i <= 24; i++) {
    const t = i / 24;
    const u = 1 - t;
    const qx = u * u * x0 + 2 * u * t * cx + t * t * x1;
    const qy = u * u * y0 + 2 * u * t * cy + t * t * y1;
    length += Math.hypot(qx - px, qy - py);
    px = qx;
    py = qy;
  }
  return length;
}

/** « · » в названии — неразрывными пробелами: «Я, ты, он · 2» не рвётся перед «· 2». */
function keepPartTogether(title: string): string {
  return title.replace(/ · /g, "\u00A0·\u00A0");
}

/** Как навык звучит для экранного диктора. */
function skillLabel(skill: PathSkill): string {
  const name = skill.id === "reading" ? "перевод" : "письмо";
  if (skill.total > 0 && skill.learned === skill.total) return `${name} освоен`;
  if (skill.total > 0 && skill.started === skill.total) return `${name} пройден`;
  return `${name} ${skill.started} из ${skill.total}`;
}

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
            from={[top, 0]}
            control={[top, y / 2]}
            to={[x, y]}
            active={reached}
          />
        )}
        {index < count - 1 && (
          <PathSegment
            from={[x, y]}
            control={[bottom, (y + PATH_ROW_HEIGHT) / 2]}
            to={[bottom, PATH_ROW_HEIGHT]}
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
          stroke={
            state === "current" ? colors.surface : colors.progress.inactive
          }
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
        accessibilityLabel={`${title}${state === "current" ? ", сейчас" : ""}${skills
          .map((skill) => `, ${skillLabel(skill)}`)
          .join("")}`}
      >
        <View
          style={{ width: outer * 2, height: outer * 2 }}
          className="items-center justify-center"
        >
          <View
            className={`items-center justify-center rounded-full ${
              state === "current" ? "bg-primary" : "bg-surface"
            }`}
            style={{ width: size, height: size }}
          >
            <Hanzi
              size={state === "current" ? 30 : 26}
              weight={state === "upcoming" ? "regular" : "medium"}
              className={
                state === "current"
                  ? "text-white"
                  : state === "passed"
                    ? "text-text"
                    : "text-textSecondary"
              }
              maxFontSizeMultiplier={1.2}
            >
              {glyph}
            </Hanzi>
          </View>

          {/* Угол: галочка — этап освоен (3 точки у каждого слова в обоих навыках) */}
          {mastered ? (
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
                state === "upcoming"
                  ? "font-nunito text-body text-text"
                  : "font-nunitoBold text-body text-text"
              }`}
            >
              {keepPartTogether(title)}
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

/**
 * Навык под названием, три вида — без плашек и заливок:
 *   не пройден — серая иконка и «начато / всего»;
 *   пройден    — зелёная иконка и ✓ (у каждого слова есть точка);
 *   освоен     — зелёная иконка и галочка в кружке (все слова на 3 точках).
 */
function SkillCount({ skill }: { skill: PathSkill }) {
  const Icon = skill.id === "reading" ? LanguagesIcon : PencilIcon;
  const mastered = skill.total > 0 && skill.learned === skill.total;
  const passed = skill.total > 0 && skill.started === skill.total;

  return (
    <View className="flex-row items-center gap-1 py-0.5">
      <Icon
        width={14}
        height={14}
        color={passed ? colors.primary : colors.textSecondary}
      />
      {mastered ? (
        <CheckIcon width={15} height={15} color={colors.primary} />
      ) : passed ? (
        <Text className="font-nunitoBold text-caption text-primary">✓</Text>
      ) : (
        <Text className="font-nunitoMedium text-caption text-textSecondary">
          {skill.started}/{skill.total}
        </Text>
      )}
    </View>
  );
}

type Point = [number, number];

function PathSegment({
  from,
  control,
  to,
  active,
}: {
  from: Point;
  control: Point;
  to: Point;
  active: boolean;
}) {
  const d = `M ${from[0]} ${from[1]} Q ${control[0]} ${control[1]} ${to[0]} ${to[1]}`;
  if (active) {
    return (
      <Path
        d={d}
        stroke={colors.progress.active}
        strokeWidth={6}
        strokeLinecap="round"
        fill="none"
      />
    );
  }
  const dash = evenDash(quadLength(...from, ...control, ...to));
  return (
    <Path
      d={d}
      stroke={colors.primary}
      strokeOpacity={PATH_DASH_OPACITY}
      strokeWidth={6}
      strokeDasharray={dash.strokeDasharray}
      strokeDashoffset={dash.strokeDashoffset}
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
