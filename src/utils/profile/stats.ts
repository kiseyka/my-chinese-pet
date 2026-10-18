// src/utils/profile/stats.ts
//
// Сводка для профиля — только из того, что уже хранится:
//   - слова по навыкам: начато (≥1 точки) и освоено (3 точки), сданные экзамены;
//   - «полностью изучено» — сданы все экзамены слова: перевод и, если слово
//     можно писать, письмо (то же правило, что у золотистой ячейки в «Словаре»);
//   - путь: этапы пройдены / освоены, текущий уровень HSK, разбивка по уровням.
// Считаем по всем словам словаря, включая «Другие слова».

import type { Word } from "@/content/flashcards/types";
import { allWords } from "@/content/words/vocabulary";
import type { WritingExamEntry } from "@/store/wordProgressStore";
import { getPathProgress, getTrackDots, type TrackId } from "@/utils/path/stages";
import {
  getWritableWords,
  LEARNED_DOTS,
  type ProgressMap,
} from "@/utils/writing/words";

type ExamMap = Record<string, WritingExamEntry>;

export interface SkillStats {
  /** Слов с хотя бы 1 точкой. */
  started: number;
  /** Слов с 3 точками. */
  learned: number;
  /** Сданных экзаменов. */
  examsPassed: number;
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
  /** Слова, у которых сданы все экзамены. */
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

let writableCache: Set<string> | null = null;

function writableIds(): Set<string> {
  if (!writableCache) {
    writableCache = new Set(
      getWritableWords(allWords).map((w) => w.vocabularyId),
    );
  }
  return writableCache;
}

function skillStats(
  words: Word[],
  track: TrackId,
  progress: ProgressMap,
  exams: ExamMap,
): SkillStats {
  let started = 0;
  let learned = 0;
  let examsPassed = 0;
  for (const word of words) {
    const dots = getTrackDots(word, track, progress);
    if (dots > 0) started += 1;
    if (dots >= LEARNED_DOTS) learned += 1;
    if (exams[word.vocabularyId]?.passedAt) examsPassed += 1;
  }
  return { started, learned, examsPassed };
}

export function getProfileStats(
  progress: ProgressMap,
  readingExams: ExamMap,
  writingExams: ExamMap,
): ProfileStats {
  const writable = writableIds();
  const writableWords = allWords.filter((w) => writable.has(w.vocabularyId));

  const fullyLearned = allWords.filter(
    (word) =>
      !!readingExams[word.vocabularyId]?.passedAt &&
      (!writable.has(word.vocabularyId) ||
        !!writingExams[word.vocabularyId]?.passedAt),
  ).length;

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
    reading: skillStats(allWords, "reading", progress, readingExams),
    writing: skillStats(writableWords, "writing", progress, writingExams),
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
