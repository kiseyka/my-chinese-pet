// src/utils/listen/words.ts
//
// Какие слова звучат в уроке «Слушай и повторяй». Только слова с озвучкой
// (content/audio/zhAudio.ts — сейчас HSK 1).
//
//   learning — изучаемые: слова дня (перевод), потом начатые слова пути
//              (1–2 точки перевода), потом слова текущего этапа;
//   review   — выученные: 3 точки перевода, вперемешку.

import { ZH_AUDIO } from "@/content/audio/zhAudio";
import type { Word } from "@/content/flashcards/types";
import { findWords } from "@/content/words/vocabulary";
import { useDailyStore } from "@/store/dailyStore";
import { useWordProgressStore } from "@/store/wordProgressStore";
import {
  getPathProgress,
  getPathStages,
  getTrackDots,
} from "@/utils/path/stages";
import { LEARNED_DOTS } from "@/utils/writing/words";

export type ListenSource = "learning" | "review";

/** Слов в одном уроке: ~3–4 минуты в два круга. */
export const LISTEN_WORDS = 12;

export const hasAudio = (word: Word) => word.vocabularyId in ZH_AUDIO;

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function getListenWords(source: ListenSource): Word[] {
  const progress = useWordProgressStore.getState().flashcardWords;
  const pathWords = getPathStages().flatMap((stage) => stage.words);
  const dots = (word: Word) => getTrackDots(word, "reading", progress);

  if (source === "review") {
    const learned = pathWords.filter((w) => hasAudio(w) && dots(w) >= LEARNED_DOTS);
    return shuffle(unique(learned)).slice(0, LISTEN_WORDS);
  }

  const daily = findWords(Object.keys(useDailyStore.getState().pools.reading));
  const started = pathWords.filter((w) => {
    const d = dots(w);
    return d > 0 && d < LEARNED_DOTS;
  });
  const path = getPathProgress(progress);
  const current =
    path.currentIndex !== undefined
      ? path.stages[path.currentIndex].stage.words
      : [];

  return unique([...daily, ...started, ...current])
    .filter(hasAudio)
    .slice(0, LISTEN_WORDS);
}

function unique(words: Word[]): Word[] {
  const seen = new Set<string>();
  return words.filter((w) => {
    if (seen.has(w.vocabularyId)) return false;
    seen.add(w.vocabularyId);
    return true;
  });
}
