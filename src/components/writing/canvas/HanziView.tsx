// src/components/writing/canvas/HanziView.tsx
//
// Маленький неподвижный иероглиф на сетке: эталон (залитые черты)
// или написание пользователя (линии как есть). Для превью и сравнений.

import { HANZI_BOX } from "@/content/writing/hanzi";
import type { Point } from "@/utils/writing/strokeCheck";
import Svg, { Path } from "react-native-svg";
import {
  CANVAS_COLORS,
  HanziGuides,
  LINE_WIDTH,
  pointsToPath,
} from "./hanziSvg";

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
      <HanziGuides />

      {strokes?.map((d, index) => (
        <Path key={`s${index}`} d={d} fill={CANVAS_COLORS.ink} />
      ))}

      {rawStrokes?.map((points, index) => (
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
    </Svg>
  );
}
