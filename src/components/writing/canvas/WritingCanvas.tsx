// src/components/writing/canvas/WritingCanvas.tsx
//
// Холст для письма пальцем: контуры-подсказки, принятые черты и текущая линия.
// Проверку черт делает хук урока через onStroke.

import { HANZI_BOX } from "@/content/writing/hanzi";
import type { Point } from "@/utils/writing/strokeCheck";
import { useMemo, useRef, useState } from "react";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Svg, { Path } from "react-native-svg";
import {
  CANVAS_COLORS,
  HanziGuides,
  LINE_WIDTH,
  canvasFrameStyle,
  pointsToPath,
} from "./hanziSvg";

interface WritingCanvasProps {
  size: number;
  /** Контуры всех черт иероглифа по порядку. */
  strokes: string[];
  /** Какие черты показывать бледным контуром-подсказкой. */
  outlineIndices: number[];
  /** Какие черты уже приняты и показываются «выровненными» (залитыми). */
  snappedIndices: number[];
  /** Принятые линии пользователя, нарисованные как есть (без выравнивания). */
  rawStrokes: Point[][];
  /** Индекс черты, которую нужно подсветить как подсказку. */
  hintIndex: number | null;
  disabled?: boolean;
  /** Вызывается, когда палец оторван: точки в системе 1024×1024. */
  onStroke: (points: Point[]) => void;
}

export function WritingCanvas({
  size,
  strokes,
  outlineIndices,
  snappedIndices,
  rawStrokes,
  hintIndex,
  disabled = false,
  onStroke,
}: WritingCanvasProps) {
  const pointsRef = useRef<Point[]>([]);
  const [current, setCurrent] = useState<Point[]>([]);

  const toBox = (x: number, y: number): Point => ({
    x: (x / size) * HANZI_BOX,
    y: (y / size) * HANZI_BOX,
  });

  const pan = Gesture.Pan()
    .runOnJS(true)
    .minDistance(0)
    .enabled(!disabled)
    .onStart((e) => {
      pointsRef.current = [toBox(e.x, e.y)];
      setCurrent([...pointsRef.current]);
    })
    .onUpdate((e) => {
      pointsRef.current.push(toBox(e.x, e.y));
      setCurrent([...pointsRef.current]);
    })
    .onEnd((_e, success) => {
      const points = pointsRef.current;
      pointsRef.current = [];
      setCurrent([]);

      if (success && points.length > 0) {
        onStroke(points);
      }
    })
    .onFinalize(() => {
      pointsRef.current = [];
      setCurrent([]);
    });

  // Всё, что не зависит от движения пальца, не перерисовываем на каждый кадр
  const staticLayer = useMemo(
    () => (
      <>
        <HanziGuides />

        {outlineIndices.map((index) => (
          <Path
            key={`o${index}`}
            d={strokes[index]}
            fill={CANVAS_COLORS.outline}
            fillOpacity={0.1}
          />
        ))}

        {hintIndex !== null && strokes[hintIndex] && (
          <Path d={strokes[hintIndex]} fill={CANVAS_COLORS.hint} fillOpacity={0.55} />
        )}

        {snappedIndices.map((index) => (
          <Path key={`c${index}`} d={strokes[index]} fill={CANVAS_COLORS.ink} />
        ))}

        {rawStrokes.map((points, index) => (
          <Path
            key={`r${index}`}
            d={pointsToPath(points)}
            fill="none"
            stroke={CANVAS_COLORS.ink}
            strokeWidth={LINE_WIDTH}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </>
    ),
    [strokes, outlineIndices, snappedIndices, rawStrokes, hintIndex],
  );

  return (
    <GestureDetector gesture={pan}>
      <View style={canvasFrameStyle(size)}>
        <Svg
          width={size}
          height={size}
          viewBox={`0 0 ${HANZI_BOX} ${HANZI_BOX}`}
        >
          {staticLayer}

          {current.length > 0 && (
            <Path
              d={pointsToPath(current)}
              fill="none"
              stroke={CANVAS_COLORS.ink}
              strokeWidth={LINE_WIDTH}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </Svg>
      </View>
    </GestureDetector>
  );
}
