// src/utils/listen/script.ts
//
// Сценарий урока «Слушай и повторяй» — список шагов, который проигрывает
// hooks/useListenLesson.ts. Тапать ничего не нужно: слушаешь и повторяешь в паузах.
//
// Круг 1, по каждой фразе:
//   китайский → [перевод вслух] → пауза «повтори» → китайский → короткая пауза
// Круг 2 — те же фразы вперемешку, без перевода:
//   китайский → пауза «повтори» → китайский → короткая пауза
//
// Пауза «повтори» зависит от того, сколько звучала фраза (repeatPauseMs):
// длинную фразу дольше повторять, медленная скорость — длиннее пауза.

import type { ListenPhrase } from "@/content/listen/sets";

export type ListenStep =
  | { kind: "zh"; phrase: ListenPhrase }
  | { kind: "translation"; phrase: ListenPhrase }
  | { kind: "repeat"; phrase: ListenPhrase }
  | { kind: "gap"; phrase: ListenPhrase; ms: number };

/** Пауза, чтобы повторить: длина фразы и ещё полторы секунды, не меньше 2,5 с. */
export const repeatPauseMs = (spokenMs: number) =>
  Math.max(2500, Math.round(spokenMs + 1500));

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
  phrases: ListenPhrase[],
  withTranslation: boolean,
): ListenStep[] {
  const steps: ListenStep[] = [];

  for (const phrase of phrases) {
    steps.push({ kind: "zh", phrase });
    if (withTranslation) steps.push({ kind: "translation", phrase });
    steps.push({ kind: "repeat", phrase });
    steps.push({ kind: "zh", phrase });
    steps.push({ kind: "gap", phrase, ms: GAP_MS });
  }

  if (phrases.length > 1) {
    for (const phrase of shuffle(phrases)) {
      steps.push({ kind: "zh", phrase });
      steps.push({ kind: "repeat", phrase });
      steps.push({ kind: "zh", phrase });
      steps.push({ kind: "gap", phrase, ms: GAP_MS });
    }
  }

  return steps;
}
