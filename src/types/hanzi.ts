// src/types/hanzi.ts

export interface HanziEtymology {
  type: string;
  hint?: string;
  phonetic?: string;
  semantic?: string;
}

/** Часть иероглифа для поэтапного изучения. */
export interface HanziPart {
  /** Как часть выглядит в тексте (для подписи), например «女». */
  label: string;
  /** Индексы черт иероглифа, которые относятся к этой части, по порядку. */
  strokes: number[];
}

export interface HanziData {
  /** Контуры черт (SVG-пути) в квадрате 1024×1024, по порядку написания. */
  strokes: string[];
  /** Средние линии черт: точки [x, y] в том же квадрате. */
  medians: number[][][];
  radical?: string;
  decomposition?: string;
  etymology?: HanziEtymology;
  /** Части для поэтапного изучения. Нет у иероглифов, которые не делятся. */
  parts?: HanziPart[];
}
