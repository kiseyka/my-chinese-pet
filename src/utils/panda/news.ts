// src/utils/panda/news.ts
//
// Новости панды. Панда больше не выскакивает после каждой тренировки: важные события
// (вехи пути и экзамены) копятся в pandaStore.news, у панды появляется значок,
// и по тапу она рассказывает всё одной репликой.
//
// Откуда новости:
//   - после каждой тренировки (finishTraining) и экзамена — новые вехи пути
//     (см. milestones.ts): раздел HSK пройден, этап освоен, этап пройден,
//     слово изучено полностью;
//   - после экзамена — его итог (сдано / не сдано по навыку).
//
// Как рассказывает (buildNewsText): одна новость — одна фраза; несколько — список,
// важное сверху, повторы склеены (три экзамена → одна строка), не больше
// MAX_LINES строк, остальное — «и ещё немного хорошего». Тексты — i18n, раздел «panda».

import type { Word } from "@/content/flashcards/types";
import { allWords } from "@/content/words/vocabulary";
import { usePandaStore } from "@/store/pandaStore";
import { useWordProgressStore } from "@/store/wordProgressStore";
import { findPathStage, getPathProgress } from "@/utils/path/stages";
import i18n from "i18next";
import { collectNewMilestones } from "./milestones";

export type ExamSkill = "reading" | "writing";

export type PandaNews =
  | { kind: "level"; level: number }
  | { kind: "stageMastered"; stageId: string }
  | { kind: "stagePassed"; stageId: string }
  | { kind: "wordLearned"; wordId: string }
  | { kind: "exam"; skill: ExamSkill; passed: number; failed: number };

/** Сколько строк в сводке, остальное — «и ещё немного хорошего». */
const MAX_LINES = 5;
/** Сколько иероглифов перечислить в строке про изученные слова. */
const MAX_WORDS = 6;

const t = (key: string, options?: Record<string, unknown>) =>
  i18n.t(key, { ns: "panda", ...options });

// ── Сбор ─────────────────────────────────────────────────────────────────────

/** Новые вехи пути → новости. Снимок вех сразу обновляется. */
function collectMilestoneNews(): PandaNews[] {
  const panda = usePandaStore.getState();
  // Снимка ещё нет (стор не успел загрузиться) — вехи не считаем, снимок сделает
  // useMilestoneBaseline
  if (!panda.milestones) return [];

  const { milestones, snapshot } = collectNewMilestones(panda.milestones);
  panda.setMilestones(snapshot);

  return [
    ...milestones.passedLevels.map((level): PandaNews => ({ kind: "level", level })),
    ...milestones.masteredStages.map(
      (stage): PandaNews => ({ kind: "stageMastered", stageId: stage.id }),
    ),
    ...milestones.passedStages.map(
      (stage): PandaNews => ({ kind: "stagePassed", stageId: stage.id }),
    ),
    ...milestones.learnedWords.map(
      (word): PandaNews => ({ kind: "wordLearned", wordId: word.vocabularyId }),
    ),
  ];
}

/** После любой тренировки: запомнить новые вехи пути. */
export function reportTrainingToPanda() {
  usePandaStore.getState().addNews(collectMilestoneNews());
}

/** После экзамена: итог экзамена и новые вехи (например, слово изучено полностью). */
export function reportExamToPanda(
  skill: ExamSkill,
  outcomes: Array<{ verdict: string }>,
) {
  const passed = outcomes.filter((o) => o.verdict === "passed").length;
  const exam: PandaNews = {
    kind: "exam",
    skill,
    passed,
    failed: outcomes.length - passed,
  };
  usePandaStore.getState().addNews([exam, ...collectMilestoneNews()]);
}

// ── Рассказ ──────────────────────────────────────────────────────────────────

const wordsById = new Map<string, Word>();
function findWord(id: string): Word | undefined {
  if (wordsById.size === 0) {
    for (const word of allWords) wordsById.set(word.vocabularyId, word);
  }
  return wordsById.get(id);
}

/** Текущий этап пути (куда идти дальше). */
function currentStageTitle(): string | undefined {
  const path = getPathProgress(useWordProgressStore.getState().flashcardWords);
  return path.currentIndex === undefined
    ? undefined
    : path.stages[path.currentIndex].stage.title;
}

const unique = <T,>(items: T[]) => Array.from(new Set(items));

/** Строки новостей по важности; повторы склеены. */
function buildLines(news: PandaNews[]): string[] {
  const levels = unique(
    news.flatMap((n) => (n.kind === "level" ? [n.level] : [])),
  ).sort((a, b) => a - b);
  const mastered = unique(
    news.flatMap((n) => (n.kind === "stageMastered" ? [n.stageId] : [])),
  );
  // Освоенный этап уже упомянут — «пройден» про него не повторяем
  const passed = unique(
    news.flatMap((n) => (n.kind === "stagePassed" ? [n.stageId] : [])),
  ).filter((id) => !mastered.includes(id));
  const learned = unique(
    news.flatMap((n) => (n.kind === "wordLearned" ? [n.wordId] : [])),
  );

  const title = (id: string) => findPathStage(id)?.title ?? id;
  const lines: string[] = [];

  for (const level of levels) lines.push(t("news.levelPassed", { level }));

  for (const id of mastered) {
    lines.push(t("news.stageMastered", { stage: title(id) }));
  }

  if (passed.length > 0) {
    const next = currentStageTitle();
    if (passed.length === 1) {
      lines.push(
        next
          ? t("news.stagePassed", { stage: title(passed[0]), next })
          : t("news.stagePassedLast", { stage: title(passed[0]) }),
      );
    } else {
      lines.push(
        next
          ? t("news.stagesPassed", { count: passed.length, next })
          : t("news.stagesPassedLast", { count: passed.length }),
      );
    }
  }

  if (learned.length > 0) {
    const hanzi = learned
      .slice(0, MAX_WORDS)
      .map((id) => findWord(id)?.hanzi)
      .filter(Boolean)
      .join("、");
    const more = learned.length > MAX_WORDS ? "…" : "";
    lines.push(
      t("news.wordsLearned", { count: learned.length, words: hanzi + more }),
    );
  }

  for (const skill of ["writing", "reading"] as const) {
    const exams = news.filter(
      (n): n is Extract<PandaNews, { kind: "exam" }> =>
        n.kind === "exam" && n.skill === skill,
    );
    if (exams.length === 0) continue;
    const passedCount = exams.reduce((sum, e) => sum + e.passed, 0);
    const skillName = t(skill === "writing" ? "news.skillWriting" : "news.skillReading");
    lines.push(
      passedCount > 0
        ? t("news.examPassed", { count: passedCount, skill: skillName })
        : t("news.examRetry", { skill: skillName }),
    );
  }

  return lines;
}

/** Текст реплики панды по накопленным новостям. null — рассказывать нечего. */
export function buildNewsText(news: PandaNews[]): string | null {
  const lines = buildLines(news);
  if (lines.length === 0) return null;
  if (lines.length === 1) return lines[0];

  const shown = lines.slice(0, MAX_LINES).map((line) => `— ${line}`);
  if (lines.length > MAX_LINES) shown.push(t("news.more"));
  return [t("news.intro"), ...shown].join("\n");
}
