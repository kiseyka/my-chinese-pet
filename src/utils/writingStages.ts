// src/utils/writingStages.ts
//
// Строит этапы урока для одного иероглифа.
//
// Полный формат (новое слово). На каждом масштабе одна и та же последовательность:
//   показ написания → по контуру → сам по памяти.
//   Сначала так проходится каждая часть иероглифа (если он делится на части),
//   затем иероглиф целиком. Последний этап — по памяти, он определяет результат слова.
//
// Быстрый формат (повторение): иероглиф целиком, по контуру → по памяти, без показа.

import type { HanziData } from "@/types/hanzi";
import { getComponents } from "./hanziComponents";

export type LessonFormat = "full" | "quick";

export type StageMode = "demo" | "outline" | "memory";

export interface WritingStage {
  id: string;
  kind: "component" | "whole";
  mode: StageMode;
  /** Какие черты иероглифа пишем (или показываем) на этом этапе, по порядку. */
  strokeIndices: number[];
  /**
   * Группы черт, которые раскрываются контуром, если пользователь застрял.
   * Нужны только для этапов «по памяти».
   */
  revealGroups: number[][];
  title: string;
  modeLabel: string;
  /** Последний этап слова: именно он определяет, получилось ли слово без подсказок. */
  isFinal: boolean;
}

const MODE_LABELS: Record<StageMode, string> = {
  demo: "смотри, как пишется",
  outline: "обведи по контуру",
  memory: "напиши сам",
};

export function buildStages(
  data: HanziData,
  format: LessonFormat,
): WritingStage[] {
  const stages: WritingStage[] = [];
  const allStrokes = Array.from({ length: data.strokes.length }, (_, i) => i);
  const parts = getComponents(data.decomposition, data.matches);

  // Если иероглиф делится на части, при подсказке раскрывается вся часть, иначе одна черта
  const wholeGroups = parts
    ? parts.map((part) => part.strokeIndices)
    : allStrokes.map((i) => [i]);

  const add = (
    id: string,
    kind: WritingStage["kind"],
    mode: StageMode,
    strokeIndices: number[],
    revealGroups: number[][],
    title: string,
    isFinal = false,
  ) => {
    stages.push({
      id,
      kind,
      mode,
      strokeIndices,
      revealGroups,
      title,
      modeLabel: MODE_LABELS[mode],
      isFinal,
    });
  };

  if (format === "full" && parts) {
    parts.forEach((part, index) => {
      const title = `Часть ${index + 1} из ${parts.length}: ${part.label}`;
      const single = part.strokeIndices.map((i) => [i]);

      add(
        `part-${index}-demo`,
        "component",
        "demo",
        part.strokeIndices,
        [],
        title,
      );
      add(
        `part-${index}-outline`,
        "component",
        "outline",
        part.strokeIndices,
        [],
        title,
      );
      add(
        `part-${index}-memory`,
        "component",
        "memory",
        part.strokeIndices,
        single,
        title,
      );
    });
  }

  const wholeTitle = parts && format === "full" ? "Весь иероглиф" : "Иероглиф";

  if (format === "full") {
    add("whole-demo", "whole", "demo", allStrokes, [], wholeTitle);
  }

  add("whole-outline", "whole", "outline", allStrokes, [], wholeTitle);
  add(
    "whole-memory",
    "whole",
    "memory",
    allStrokes,
    wholeGroups,
    wholeTitle,
    true,
  );

  return stages;
}
