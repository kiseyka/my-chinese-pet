// src/utils/panda/chatContext.ts
//
// Что панда знает о пользователе в чате: слова, которые он уже начал учить
// (хотя бы 1 точка перевода или письма), и текущий этап пути — тема разговора.

import { allWords } from "@/content/words/vocabulary";
import {
  getPathProgress,
  getTrackDots,
} from "@/utils/path/stages";
import type { ProgressMap } from "@/utils/writing/words";

/** Больше слов сервер всё равно не примет (и промпт станет дорогим). */
const MAX_KNOWN_WORDS = 150;

export interface ChatContext {
  known: string[];
  stage?: { title: string; words: string[] };
}

export function getChatContext(progress: ProgressMap): ChatContext {
  const known = new Set<string>();
  for (const word of allWords) {
    if (known.size >= MAX_KNOWN_WORDS) break;
    const started =
      getTrackDots(word, "reading", progress) > 0 ||
      getTrackDots(word, "writing", progress) > 0;
    if (started) known.add(word.hanzi);
  }

  const path = getPathProgress(progress);
  const current =
    path.currentIndex !== undefined ? path.stages[path.currentIndex] : undefined;

  return {
    known: Array.from(known),
    stage: current && {
      title: current.stage.title,
      words: current.stage.words.map((word) => word.hanzi),
    },
  };
}
