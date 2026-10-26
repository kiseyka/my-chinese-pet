// src/utils/profile/stats.ts
//
// Сводка для профиля — только из того, что уже хранится:
//   - слова по навыкам: начато (≥1 точки) и освоено (3 точки);
//   - «изучено» — слова в «Изученном» (wordProgressStore.learned);
//   - путь: этапы пройдены / освоены, текущий уровень HSK, разбивка по уровням.
// Считаем по всем словам словаря, включая «Другие слова».

import type { Word } from "@/content/flashcards/types";
import { allWords } from "@/content/words/vocabulary";
import { getWritableIds } from "@/utils/learning";
import { findAnyWords } from "@/utils/wordSource";
import { getPathProgress, getTrackDots, type TrackId } from "@/utils/path/stages";
import {
  LEARNED_DOTS,
  type ProgressMap,
} from "@/utils/writing/words";

export interface SkillStats {
  /** Слов с хотя бы 1 точкой. */
  started: number;
  /** Слов с 3 точками. */
  learned: number;
}

export interface LevelStats {
  level: number;
  stagesTotal: number;
  stagesPassed: number;
  stagesMastered: number;
}

export interface ProfileStats {
  reading: SkillStats;
  writing: SkillStats;
  /** Слов в «Изученном». */
  fullyLearned: number;
  stagesTotal: number;
  stagesPassed: number;
  stagesMastered: number;
  /** Уровень HSK текущего этапа пути (null — путь пройден целиком). */
  currentLevel: number | null;
  /** Текущий этап пути: первый непройденный (null — пройдены все). */
  currentStage: { id: string; title: string; level: number } | null;
  levels: LevelStats[];
}

function skillStats(
  words: Word[],
  track: TrackId,
  progress: ProgressMap,
): SkillStats {
  let started = 0;
  let learned = 0;
  for (const word of words) {
    const dots = getTrackDots(word, track, progress);
    if (dots > 0) started += 1;
    if (dots >= LEARNED_DOTS) learned += 1;
  }
  return { started, learned };
}

/** Слова из «Изученного»: последние добавленные — первыми. */
export function getLearnedWords(
  learned: Record<string, { addedAt: number }>,
): Word[] {
  return findAnyWords(
    Object.entries(learned)
      .sort(([, a], [, b]) => b.addedAt - a.addedAt)
      .map(([id]) => id),
  );
}

export function getProfileStats(
  progress: ProgressMap,
  learned: Record<string, { addedAt: number }>,
): ProfileStats {
  const writable = getWritableIds();
  const writableWords = allWords.filter((w) => writable.has(w.vocabularyId));

  const fullyLearned = Object.keys(learned).length;

  const path = getPathProgress(progress);
  const current =
    path.currentIndex === undefined
      ? null
      : path.stages[path.currentIndex].stage;
  const levels = new Map<number, LevelStats>();
  for (const { stage, passed, mastered } of path.stages) {
    const entry = levels.get(stage.level) ?? {
      level: stage.level,
      stagesTotal: 0,
      stagesPassed: 0,
      stagesMastered: 0,
    };
    entry.stagesTotal += 1;
    if (passed) entry.stagesPassed += 1;
    if (mastered) entry.stagesMastered += 1;
    levels.set(stage.level, entry);
  }
  const levelList = [...levels.values()].sort((a, b) => a.level - b.level);

  return {
    reading: skillStats(allWords, "reading", progress),
    writing: skillStats(writableWords, "writing", progress),
    fullyLearned,
    stagesTotal: path.stages.length,
    stagesPassed: levelList.reduce((sum, l) => sum + l.stagesPassed, 0),
    stagesMastered: levelList.reduce((sum, l) => sum + l.stagesMastered, 0),
    currentLevel: current ? current.level : null,
    currentStage: current
      ? { id: current.id, title: current.title, level: current.level }
      : null,
    levels: levelList,
  };
}
