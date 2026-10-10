// src/utils/writingStages.ts
//
// Строит этапы урока для слова (из одного или нескольких иероглифов).
//
// Полный формат (новое слово). На каждом масштабе одна и та же последовательность:
//   показ написания → по контуру → сам по памяти.
//
//   Иероглиф, который делится на части, изучается поэтапно:
//     часть 1 (показ, контур, сам) → часть 2 (показ, контур, сам) → части 1–2 вместе (сам) →
//     часть 3 ... → в конце иероглиф целиком.
//   Иероглиф, который не делится, сразу проходит «показ → контур → сам».
//
//   Слово из нескольких иероглифов: сначала так проходится каждый (повторяющийся иероглиф,
//   как в 画画, — один раз), затем слово целиком: показ → контур → сам.
//
// Последний этап — «сам по памяти», он определяет результат слова.
//
// Быстрый формат (повторение): слово целиком, по контуру → по памяти, без показа.

import type { HanziData } from "@/types/hanzi";

/**
 * full — новое слово: части, показ, контур, сам.
 * light — знакомство без частей: целиком показ → контур → сам.
 * quick — повторение: целиком контур → сам.
 */
export type LessonFormat = "full" | "light" | "quick";

export type StageMode = "demo" | "outline" | "memory";

/** Один иероглиф внутри этапа: этап слова из двух иероглифов состоит из двух ячеек. */
export interface StageSlot {
  /** Номер иероглифа в слове. */
  charIndex: number;
  /** Какие черты этого иероглифа пишем (или показываем), по порядку. */
  strokeIndices: number[];
  /**
   * Группы черт, которые раскрываются контуром, если пользователь застрял.
   * Нужны только для этапов «по памяти».
   */
  revealGroups: number[][];
}

export interface WritingStage {
  id: string;
  kind: "component" | "character" | "word";
  mode: StageMode;
  slots: StageSlot[];
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

const range = (count: number) => Array.from({ length: count }, (_, i) => i);

const sortedUnion = (groups: number[][]) =>
  Array.from(new Set(groups.flat())).sort((a, b) => a - b);

export function buildStages(
  chars: HanziData[],
  format: LessonFormat,
  /** Сами иероглифы слова: нужны, чтобы не повторять этапы для одинаковых иероглифов (画画). */
  characters: string[] = [],
): WritingStage[] {
  const stages: WritingStage[] = [];
  const isWord = chars.length > 1;

  // Группы для подсказки: части иероглифа или отдельные черты
  const groupsOf = (data: HanziData): number[][] =>
    data.parts
      ? data.parts.map((part) => part.strokes)
      : range(data.strokes.length).map((i) => [i]);

  const wholeSlot = (charIndex: number): StageSlot => ({
    charIndex,
    strokeIndices: range(chars[charIndex].strokes.length),
    revealGroups: groupsOf(chars[charIndex]),
  });

  const add = (
    id: string,
    kind: WritingStage["kind"],
    mode: StageMode,
    slots: StageSlot[],
    title: string,
    isFinal = false,
  ) => {
    stages.push({
      id,
      kind,
      mode,
      slots,
      title,
      modeLabel: MODE_LABELS[mode],
      isFinal,
    });
  };

  const ladder = (
    idPrefix: string,
    kind: WritingStage["kind"],
    slots: StageSlot[],
    title: string,
  ) => {
    add(`${idPrefix}-demo`, kind, "demo", slots, title);
    add(`${idPrefix}-outline`, kind, "outline", slots, title);
    add(`${idPrefix}-memory`, kind, "memory", slots, title);
  };

  /**
   * Этапы одного иероглифа. Если он делится на части, иероглиф «собирается» по кусочкам.
   * Последний шаг («иероглиф целиком») добавляется отдельно, если он нужен как итоговый.
   * Возвращает true, если иероглиф целиком уже пройден (иначе его нужно пройти снаружи).
   */
  const characterLadder = (
    charIndex: number,
    prefix: string,
    titlePrefix: string,
  ) => {
    const data = chars[charIndex];
    const parts = data.parts;

    if (!parts) return false;

    parts.forEach((part, partIndex) => {
      ladder(
        `${prefix}-part-${partIndex}`,
        "component",
        [
          {
            charIndex,
            strokeIndices: part.strokes,
            revealGroups: part.strokes.map((i) => [i]),
          },
        ],
        `${titlePrefix}Часть ${partIndex + 1} из ${parts.length}: ${part.label}`,
      );

      // Первые k частей вместе (последний шаг — иероглиф целиком — делается отдельно)
      const together = partIndex + 1;
      if (together >= 2 && together < parts.length) {
        const groups = parts.slice(0, together).map((p) => p.strokes);

        add(
          `${prefix}-together-${together}`,
          "component",
          "memory",
          [
            {
              charIndex,
              strokeIndices: sortedUnion(groups),
              revealGroups: groups,
            },
          ],
          `${titlePrefix}Части 1–${together} вместе`,
        );
      }
    });

    return true;
  };

  if (format === "full") {
    if (!isWord) {
      characterLadder(0, "char-0", "");
    } else {
      // Слово: каждый уникальный иероглиф отдельно
      const seen = new Set<string>();

      chars.forEach((data, index) => {
        const character = characters[index] ?? `#${index}`;
        if (seen.has(character)) return;
        seen.add(character);

        const titlePrefix = `Иероглиф ${index + 1} из ${chars.length} · `;
        const hasParts = characterLadder(index, `char-${index}`, titlePrefix);

        if (hasParts) {
          // Иероглиф собран из частей: целиком — только «сам» (части вместе)
          add(
            `char-${index}-whole-memory`,
            "character",
            "memory",
            [wholeSlot(index)],
            `Иероглиф ${index + 1} из ${chars.length} целиком`,
          );
        } else {
          ladder(
            `char-${index}`,
            "character",
            [wholeSlot(index)],
            `Иероглиф ${index + 1} из ${chars.length}`,
          );
        }
      });
    }
  }

  const allSlots = chars.map((_, index) => wholeSlot(index));
  const singleHasParts = !isWord && chars[0].parts !== undefined;

  const finalTitle = isWord
    ? "Всё слово"
    : singleHasParts && format === "full"
      ? "Весь иероглиф"
      : "Иероглиф";
  const finalKind = isWord ? "word" : "character";

  if (format !== "quick") {
    add("whole-demo", finalKind, "demo", allSlots, finalTitle);
  }

  add("whole-outline", finalKind, "outline", allSlots, finalTitle);
  add("whole-memory", finalKind, "memory", allSlots, finalTitle, true);

  return stages;
}
