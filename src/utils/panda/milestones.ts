// src/utils/panda/milestones.ts
//
// Вехи обучения, на которые реагирует панда:
//   - этап пути пройден (у всех слов ≥1 точки во всех дорожках);
//   - этап освоен (все слова на 3 точках) — печать 印;
//   - раздел HSK пройден целиком (все его этапы пройдены);
//   - слово изучено полностью (сданы все его экзамены).
//
// Как узнать, что веха новая: панда помнит «снимок» — что уже было отмечено
// (pandaStore.milestones). После тренировки сравниваем текущее состояние со снимком,
// новое — повод для реплики, и снимок сразу обновляется (празднуем один раз).
// При первом запуске снимок делается без реплик (useMilestoneBaseline),
// иначе панда отпраздновала бы всё, что пройдено до обновления.

import type { Word } from "@/content/flashcards/types";
import { useWordProgressStore } from "@/store/wordProgressStore";
import { getPathProgress, type PathStage } from "@/utils/path/stages";
import { getFullyLearnedWords } from "@/utils/profile/stats";

export interface MilestoneSnapshot {
  passedStages: string[];
  masteredStages: string[];
  passedLevels: number[];
  learnedWords: string[];
}

export interface NewMilestones {
  passedStages: PathStage[];
  masteredStages: PathStage[];
  passedLevels: number[];
  learnedWords: Word[];
  /** Следующий непройденный этап (после всех изменений). */
  nextStage?: PathStage;
}

/** Текущее состояние вех из сторов. */
export function takeMilestoneSnapshot(): MilestoneSnapshot & {
  stages: ReturnType<typeof getPathProgress>;
  learned: Word[];
} {
  const { flashcardWords, readingExams, writingExams } =
    useWordProgressStore.getState();
  const path = getPathProgress(flashcardWords);
  const learned = getFullyLearnedWords(readingExams, writingExams);

  const levels = new Map<number, boolean>();
  for (const { stage, passed } of path.stages) {
    levels.set(stage.level, (levels.get(stage.level) ?? true) && passed);
  }

  return {
    stages: path,
    learned,
    passedStages: path.stages.filter((s) => s.passed).map((s) => s.stage.id),
    masteredStages: path.stages
      .filter((s) => s.mastered)
      .map((s) => s.stage.id),
    passedLevels: [...levels].filter(([, ok]) => ok).map(([level]) => level),
    learnedWords: learned.map((w) => w.vocabularyId),
  };
}

/** Только сам снимок — для сохранения. */
export function toSnapshot(full: MilestoneSnapshot): MilestoneSnapshot {
  return {
    passedStages: full.passedStages,
    masteredStages: full.masteredStages,
    passedLevels: full.passedLevels,
    learnedWords: full.learnedWords,
  };
}

/**
 * Что появилось с прошлого снимка. Возвращает и новый снимок, который надо
 * сохранить. Если прошлого снимка нет, новых вех нет (это базовая точка).
 */
export function collectNewMilestones(previous: MilestoneSnapshot | null): {
  milestones: NewMilestones;
  snapshot: MilestoneSnapshot;
} {
  const current = takeMilestoneSnapshot();
  const snapshot = toSnapshot(current);

  const empty: NewMilestones = {
    passedStages: [],
    masteredStages: [],
    passedLevels: [],
    learnedWords: [],
  };
  if (!previous) return { milestones: empty, snapshot };

  const had = {
    passed: new Set(previous.passedStages),
    mastered: new Set(previous.masteredStages),
    levels: new Set(previous.passedLevels),
    words: new Set(previous.learnedWords),
  };

  const path = current.stages;
  const nextIndex = path.currentIndex;

  return {
    snapshot,
    milestones: {
      passedStages: path.stages
        .filter((s) => s.passed && !had.passed.has(s.stage.id))
        .map((s) => s.stage),
      masteredStages: path.stages
        .filter((s) => s.mastered && !had.mastered.has(s.stage.id))
        .map((s) => s.stage),
      passedLevels: current.passedLevels.filter((l) => !had.levels.has(l)),
      learnedWords: current.learned.filter(
        (w) => !had.words.has(w.vocabularyId),
      ),
      nextStage:
        nextIndex === undefined ? undefined : path.stages[nextIndex].stage,
    },
  };
}
