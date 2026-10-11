// src/utils/writingStages.ts
//
// Строит этапы урока для слова (из одного или нескольких иероглифов).
//
// Полный формат (новое слово):
//   Иероглиф, который делится на части (графемы):
//     каждая часть: показ → контур → память
//     (у иероглифов из 3+ частей между ними ещё «первые части вместе», по памяти),
//     затем иероглиф целиком: контур → память, без показа.
//   Иероглиф, который не делится: показ → контур → память.
//
//   Слово из нескольких иероглифов: так проходится каждый иероглиф
//   (повторяющийся, как в 画画, — один раз), в конце всё слово по памяти.
//
// Последний этап всегда «по памяти» и содержит весь иероглиф или всё слово:
// он определяет результат слова и даёт линии для экрана сравнения.
//
// Облегчённый формат: целиком показ → контур → память.
// Быстрый формат (повторение): целиком контур → память, без показа.

import type { HanziData } from "@/types/hanzi";

/**
 * full — новое слово: части, затем сборка иероглифа.
 * light — знакомство без частей: целиком показ → контур → сам.
 * quick — повторение: целиком контур → сам.
 */
export type LessonFormat = "full" | "light" | "quick";

export type StageMode = "demo" | "outline" | "memory";

/**
 * Что пишем в ячейке: часть иероглифа (показываем её знак)
 * или иероглиф целиком (показываем пиньинь, чтобы не подсказывать написание).
 */
export type StageTarget =
  | {
      kind: "part";
      /** Знак части или нескольких частей подряд, например «亻» или «亻尔». */
      label: string;
    }
  | { kind: "character" };

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
  /** Что именно пишем: часть или иероглиф целиком. */
  target: StageTarget;
}

export interface WritingStage {
  id: string;
  kind: "component" | "character" | "word";
  mode: StageMode;
  slots: StageSlot[];
  /** Последний этап слова: именно он определяет, получилось ли слово без подсказок. */
  isFinal: boolean;
}

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
    target: { kind: "character" },
  });

  const add = (
    id: string,
    kind: WritingStage["kind"],
    mode: StageMode,
    slots: StageSlot[],
    isFinal = false,
  ) => {
    stages.push({ id, kind, mode, slots, isFinal });
  };

  /**
   * Лесенка на одном масштабе: (показ →) контур → память.
   * finalMemory — этап «память» последний в слове и определяет результат.
   */
  const ladder = (
    idPrefix: string,
    kind: WritingStage["kind"],
    slots: StageSlot[],
    { withDemo = true, finalMemory = false } = {},
  ) => {
    if (withDemo) add(`${idPrefix}-demo`, kind, "demo", slots);
    add(`${idPrefix}-outline`, kind, "outline", slots);
    add(`${idPrefix}-memory`, kind, "memory", slots, finalMemory);
  };

  /** Части иероглифа по очереди: показ → контур → память для каждой. */
  const partsLadder = (charIndex: number) => {
    const parts = chars[charIndex].parts ?? [];

    parts.forEach((part, partIndex) => {
      ladder(`char-${charIndex}-part-${partIndex}`, "component", [
        {
          charIndex,
          strokeIndices: part.strokes,
          revealGroups: part.strokes.map((i) => [i]),
          target: { kind: "part", label: part.label },
        },
      ]);

      // Первые k частей вместе, по памяти (только у иероглифов из 3+ частей:
      // последний шаг — иероглиф целиком — идёт отдельно)
      const together = partIndex + 1;
      if (together >= 2 && together < parts.length) {
        const first = parts.slice(0, together);
        const groups = first.map((p) => p.strokes);

        add(`char-${charIndex}-together-${together}`, "component", "memory", [
          {
            charIndex,
            strokeIndices: sortedUnion(groups),
            revealGroups: groups,
            target: {
              kind: "part",
              label: first.map((p) => p.label).join(""),
            },
          },
        ]);
      }
    });
  };

  const allSlots = chars.map((_, index) => wholeSlot(index));

  if (format === "full") {
    const seen = new Set<string>();

    chars.forEach((data, index) => {
      const character = characters[index] ?? `#${index}`;
      if (seen.has(character)) return;
      seen.add(character);

      // У одиночного иероглифа его «память» и есть итоговый этап
      const finalMemory = !isWord;

      if (data.parts) {
        // Графемы, затем сборка иероглифа: контур → память, без показа
        partsLadder(index);
        ladder(`char-${index}`, "character", [wholeSlot(index)], {
          withDemo: false,
          finalMemory,
        });
      } else {
        // Иероглиф без частей: показ → контур → память
        ladder(`char-${index}`, "character", [wholeSlot(index)], {
          finalMemory,
        });
      }
    });

    // Слово: в конце всё целиком по памяти
    if (isWord) {
      add("whole-memory", "word", "memory", allSlots, true);
    }

    return stages;
  }

  const finalKind = isWord ? "word" : "character";

  ladder("whole", finalKind, allSlots, {
    withDemo: format === "light",
    finalMemory: true,
  });

  return stages;
}
