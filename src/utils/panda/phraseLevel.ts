// src/utils/panda/phraseLevel.ts
//
// УРОВЕНЬ ФРАЗЫ ПАНДЫ ПО HSK. Фразы открываются не по точкам слов, а по уровню:
//   уровень фразы — HSK, к которому относится большая часть её слов (точнее: самый
//   низкий уровень, до которого включительно набирается больше половины слов). Считаются
//   слова фразы, вариантов ответа и реакций панды — всё, что пользователь прочитает.
//   Слова без уровня HSK (HSK 5–9 и свои) считаются уровнем OTHER_LEVEL; слова из
//   глоссария панды (имя, 仙人掌) не считаются.
//   Фраза открыта, если её уровень не выше текущего уровня пользователя + 1: на HSK 1 —
//   фразы HSK 1 и 2, на HSK 2 — до HSK 3, на HSK 3 — до HSK 4. Текущий уровень — HSK
//   текущего этапа пути (первого непройденного); путь пройден целиком — открыто всё.

import type { PandaPhrase, PhraseLine } from "@/content/panda/thoughtPhrases";
import { getWordHsk } from "@/content/words/hsk";
import { useWordProgressStore } from "@/store/wordProgressStore";
import { getPathProgress } from "@/utils/path/stages";
import { getPhraseWords } from "./phraseSegments";

/** Уровень слов без HSK (HSK 5–9 и свои слова). */
const OTHER_LEVEL = 5;

const levelCache = new Map<string, number>();

/** Уровень фразы по HSK (1–5). */
export function getPhraseLevel(phrase: PandaPhrase): number {
  const cached = levelCache.get(phrase.id);
  if (cached !== undefined) return cached;

  const lines: PhraseLine[] = [phrase];
  for (const reply of phrase.replies ?? []) {
    lines.push(reply);
    if (reply.reaction) lines.push(reply.reaction);
  }
  // Каждое слово один раз: 喜欢 в вопросе и во всех ответах не перевешивает остальные
  const ids = new Set(
    lines.flatMap((line) => getPhraseWords(line) ?? []).map((w) => w.vocabularyId),
  );
  const levels = [...ids]
    .map((id) => getWordHsk(id) ?? OTHER_LEVEL)
    .sort((a, b) => a - b);

  // Самый низкий уровень, на котором набирается больше половины слов
  const level = levels.length > 0 ? levels[Math.floor(levels.length / 2)] : 1;
  levelCache.set(phrase.id, level);
  return level;
}

/** Текущий уровень пользователя: HSK текущего этапа пути (всё пройдено — Infinity). */
export function getUserHskLevel(): number {
  const progress = useWordProgressStore.getState().flashcardWords;
  const path = getPathProgress(progress);
  if (path.currentIndex === undefined) return Infinity;
  return path.stages[path.currentIndex].stage.level;
}

/** Фраза открыта: её уровень не выше текущего уровня пользователя + 1. */
export function isPhraseUnlocked(phrase: PandaPhrase, userLevel: number): boolean {
  return getPhraseLevel(phrase) <= userLevel + 1;
}
