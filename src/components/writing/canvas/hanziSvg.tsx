// src/components/writing/canvas/hanziSvg.tsx
//
// Общее для всех холстов письма (HanziView, WritingCanvas, DemoCanvas):
// цвета SVG, толщина линии, перевод точек в путь, сетка «тянь цзы гэ» и рамка холста.
//
// В SVG нельзя использовать классы nativewind, поэтому цвета здесь — константы.
// Это единственное место, где они заданы.

import { HANZI_BOX } from "@/content/writing/hanzi";
import type { Point } from "@/utils/writing/strokeCheck";
import type { ViewStyle } from "react-native";
import { Line, Rect } from "react-native-svg";

export const CANVAS_COLORS = {
  /** Линии пользователя и залитые эталонные черты. */
  ink: "#3A2F2A",
  /** Бледный контур-подсказка (рисуется с прозрачностью). */
  outline: "#3A2F2A",
  /** Подсветка нужной черты. */
  hint: "#F59E0B",
  /** Пунктир сетки «тянь цзы гэ». */
  grid: "#CFC6B8",
  /** Фон холста для письма и показа. */
  paper: "#FFFBF5",
} as const;

/** Толщина линии пальца в единицах 1024. */
export const LINE_WIDTH = 28;

/** Линия пользователя (точки) → SVG-путь. */
export function pointsToPath(points: Point[]): string {
  if (points.length === 0) return "";

  if (points.length === 1) {
    const { x, y } = points[0];
    return `M ${x.toFixed(1)} ${y.toFixed(1)} L ${(x + 0.1).toFixed(1)} ${y.toFixed(1)}`;
  }

  return points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
}

/** Сетка «тянь цзы гэ»: рамка, вертикаль, горизонталь и диагонали. */
export function HanziGuides() {
  const dashed = {
    stroke: CANVAS_COLORS.grid,
    strokeWidth: 4,
    strokeDasharray: "16 16",
  };

  return (
    <>
      <Rect
        x={4}
        y={4}
        width={HANZI_BOX - 8}
        height={HANZI_BOX - 8}
        fill="none"
        stroke={CANVAS_COLORS.grid}
        strokeWidth={8}
      />
      <Line x1={512} y1={0} x2={512} y2={HANZI_BOX} {...dashed} />
      <Line x1={0} y1={512} x2={HANZI_BOX} y2={512} {...dashed} />
      <Line x1={0} y1={0} x2={HANZI_BOX} y2={HANZI_BOX} {...dashed} />
      <Line x1={HANZI_BOX} y1={0} x2={0} y2={HANZI_BOX} {...dashed} />
    </>
  );
}

/**
 * Стиль рамки большого холста: скруглённый квадрат на «бумажном» фоне.
 * Именно стиль, а не компонент: у WritingCanvas прямым ребёнком GestureDetector
 * должна быть обычная View.
 */
export function canvasFrameStyle(size: number): ViewStyle {
  return {
    width: size,
    height: size,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: CANVAS_COLORS.paper,
  };
}
