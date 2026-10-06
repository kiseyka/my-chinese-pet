// src/content/writing/hanzi.ts

import type { HanziData } from "@/types/hanzi";
import rawData from "./hanziData.json";

const hanziData = rawData as unknown as Record<string, HanziData>;

/** Сторона квадрата, в котором лежат все координаты иероглифов. */
export const HANZI_BOX = 1024;

export function getHanzi(character: string): HanziData | undefined {
  return hanziData[character];
}

/** Иероглифы, для которых есть данные. */
export const writableCharacters: string[] = Object.keys(hanziData);
