// src/types/hanzi.ts

export interface HanziEtymology {
  type: string;
  hint?: string;
  phonetic?: string;
  semantic?: string;
}

export interface HanziData {
  /** Контуры черт (SVG-пути) в квадрате 1024×1024, по порядку написания. */
  strokes: string[];
  /** Средние линии черт: точки [x, y] в том же квадрате. */
  medians: number[][][];
  radical?: string;
  decomposition?: string;
  /** matches[i] — путь компонента, которому принадлежит черта i (null — не разбивается). */
  matches?: (number[] | null)[];
  etymology?: HanziEtymology;
}
