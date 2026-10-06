// src/components/writing/HanziView.tsx

import { HANZI_BOX } from "@/content/writing/hanzi";
import type { Point } from "@/utils/strokeCheck";
import Svg, { Line, Path, Rect } from "react-native-svg";

// Цвета для SVG (в нём нельзя использовать классы nativewind) — подставь цвета своей темы
export const INK_COLOR = "#3A2F2A";
export const HINT_COLOR = "#F59E0B";
export const OUTLINE_COLOR = "#3A2F2A";
const GRID_COLOR = "#CFC6B8";

/** Толщина линии пальца в единицах 1024. */
export const LINE_WIDTH = 28;

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
export function HanziGrid() {
  const dashed = {
    stroke: GRID_COLOR,
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
        stroke={GRID_COLOR}
        strokeWidth={8}
      />
      <Line x1={512} y1={0} x2={512} y2={HANZI_BOX} {...dashed} />
      <Line x1={0} y1={512} x2={HANZI_BOX} y2={512} {...dashed} />
      <Line x1={0} y1={0} x2={HANZI_BOX} y2={HANZI_BOX} {...dashed} />
      <Line x1={HANZI_BOX} y1={0} x2={0} y2={HANZI_BOX} {...dashed} />
    </>
  );
}

interface HanziViewProps {
  size: number;
  /** Контуры эталонных черт — рисуются залитыми («выровненный» вариант). */
  strokes?: string[];
  /** Сырые линии пользователя — рисуются как есть, без выравнивания. */
  rawStrokes?: Point[][];
}

export function HanziView({ size, strokes, rawStrokes }: HanziViewProps) {
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${HANZI_BOX} ${HANZI_BOX}`}>
      <HanziGrid />

      {strokes?.map((d, index) => (
        <Path key={`s${index}`} d={d} fill={INK_COLOR} />
      ))}

      {rawStrokes?.map((points, index) => (
        <Path
          key={`r${index}`}
          d={pointsToPath(points)}
          fill="none"
          stroke={INK_COLOR}
          strokeWidth={LINE_WIDTH}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </Svg>
  );
}
