// src/components/writing/canvas/DemoCanvas.tsx
//
// Показ порядка и направления черт. Черты рисуются по очереди:
//   - до своей очереди черта не рисуется вообще;
//   - во время своей очереди «дорисовывается» по средней линии, а контур самой черты
//     работает как маска, чтобы форма была настоящей;
//   - после своей очереди показывается залитым контуром.
// Прогресс считается в обычном состоянии React, без reanimated: так черта
// не может оказаться нарисованной раньше своей очереди.

import { HANZI_BOX } from "@/content/writing/hanzi";
import { useEffect, useState } from "react";
import { View } from "react-native";
import Svg, { ClipPath, Defs, G, Path } from "react-native-svg";
import { CANVAS_COLORS, HanziGuides, canvasFrameStyle } from "./hanziSvg";

/** Сколько миллисекунд рисуется одна черта. */
const STROKE_DURATION = 700;

/** Запас на длину линии, чтобы кончик черты дорисовывался полностью. */
const LENGTH_PADDING = 40;

/** Толщина «кисти», которая рисуется внутри маски. */
const BRUSH_WIDTH = 150;

function medianToPath(median: number[][]): string {
  return median
    .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`)
    .join(" ");
}

function medianLength(median: number[][]): number {
  let total = 0;
  for (let i = 1; i < median.length; i++) {
    total += Math.hypot(
      median[i][0] - median[i - 1][0],
      median[i][1] - median[i - 1][1],
    );
  }
  return total + LENGTH_PADDING;
}

interface DemoCanvasProps {
  size: number;
  /** Контуры всех черт иероглифа. */
  strokes: string[];
  /** Средние линии всех черт иероглифа. */
  medians: number[][][];
  /** Какие черты показывать (по порядку). */
  strokeIndices: number[];
  /** Меняется, чтобы запустить показ заново. */
  replayKey: number;
}

export function DemoCanvas({
  size,
  strokes,
  medians,
  strokeIndices,
  replayKey,
}: DemoCanvasProps) {
  // Общий прогресс показа: от 0 до числа черт. Черта номер k рисуется при прогрессе от k до k + 1
  const [progress, setProgress] = useState(0);
  const indicesKey = strokeIndices.join(",");

  useEffect(() => {
    const total = strokeIndices.length;
    const startedAt = Date.now();
    let frame = 0;

    setProgress(0);

    const tick = () => {
      const value = Math.min((Date.now() - startedAt) / STROKE_DURATION, total);
      setProgress(value);

      if (value < total) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
    // indicesKey вместо массива: массив создаётся заново при каждой перерисовке
  }, [replayKey, indicesKey]);

  return (
    <View style={canvasFrameStyle(size)}>
      <Svg width={size} height={size} viewBox={`0 0 ${HANZI_BOX} ${HANZI_BOX}`}>
        <HanziGuides />

        {/* Бледный контур показываемых черт */}
        {strokeIndices.map((index) => (
          <Path
            key={`o${index}`}
            d={strokes[index]}
            fill={CANVAS_COLORS.outline}
            fillOpacity={0.08}
          />
        ))}

        {strokeIndices.map((index, order) => {
          const local = progress - order;

          // Очередь ещё не дошла
          if (local <= 0) return null;

          // Черта уже нарисована целиком
          if (local >= 1) {
            return (
              <Path key={`d${index}`} d={strokes[index]} fill={CANVAS_COLORS.ink} />
            );
          }

          // Черта рисуется прямо сейчас
          const length = medianLength(medians[index]);
          const clipId = `demo-clip-${index}`;

          return (
            <G key={`d${index}`}>
              <Defs>
                <ClipPath id={clipId}>
                  <Path d={strokes[index]} />
                </ClipPath>
              </Defs>

              <Path
                d={medianToPath(medians[index])}
                fill="none"
                stroke={CANVAS_COLORS.ink}
                strokeWidth={BRUSH_WIDTH}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={`${length} ${length}`}
                strokeDashoffset={length * (1 - local)}
                clipPath={`url(#${clipId})`}
              />
            </G>
          );
        })}
      </Svg>
    </View>
  );
}
