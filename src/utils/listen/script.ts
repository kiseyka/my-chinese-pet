// src/utils/listen/script.ts
//
// Сценарий урока «Слушай и повторяй» — список шагов, который проигрывает
// hooks/useListenLesson.ts. Тапать ничего не нужно: слушаешь и повторяешь в паузах.
//
// Круг 1, по каждому слову:
//   китайский → [перевод вслух] → пауза «повтори» → китайский → короткая пауза
// Круг 2 — те же слова вперемешку, без перевода:
//   китайский → пауза «повтори» → китайский → короткая пауза
//
// Пауза «повтори» зависит от длины только что прозвучавшего слова
// (repeatPauseMs) — длинное слово дольше повторять.

import type { Word } from "@/content/flashcards/types";

export type ListenStep =
  | { kind: "zh"; word: Word }
  | { kind: "translation"; word: Word }
  | { kind: "repeat"; word: Word }
  | { kind: "gap"; word: Word; ms: number };

/** Пауза, чтобы повторить: полторы длины слова плюс секунда, не меньше 2 с. */
export const repeatPauseMs = (clipMs: number) =>
  Math.max(2000, Math.round(clipMs * 1.5 + 1000));

const GAP_MS = 900;

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function buildListenScript(
  words: Word[],
  withTranslation: boolean,
): ListenStep[] {
  const steps: ListenStep[] = [];

  for (const word of words) {
    steps.push({ kind: "zh", word });
    if (withTranslation) steps.push({ kind: "translation", word });
    steps.push({ kind: "repeat", word });
    steps.push({ kind: "zh", word });
    steps.push({ kind: "gap", word, ms: GAP_MS });
  }

  if (words.length > 1) {
    for (const word of shuffle(words)) {
      steps.push({ kind: "zh", word });
      steps.push({ kind: "repeat", word });
      steps.push({ kind: "zh", word });
      steps.push({ kind: "gap", word, ms: GAP_MS });
    }
  }

  return steps;
}
