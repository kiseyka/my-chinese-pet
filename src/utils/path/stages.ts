// src/utils/path/stages.ts
//
// ПУТЬ ИЗУЧЕНИЯ — один на всё приложение.
//
// Этап — точка на тропинке: тема из src/content/path/themes.ts или её часть
// (не больше 10 слов: «Числа», «Числа · 2»). Уровни без тем делятся по частоте
// («HSK 2 · 3»). Этапы всех разделов HSK идут подряд: HSK 1 → HSK 2 → …
// Слова без уровня HSK в путь не входят (они есть в «Словаре»).
//
// У этапа несколько дорожек — навыков. Сейчас их две, по порядку:
//   reading — перевод (карточки, 4 варианта): точки чтения;
//   writing — письмо: точки письма, только слова, которые можно писать.
// Новый навык = ещё одна запись в TRACKS и её правило точек.
//
// Правила:
//   дорожка пройдена — у каждого её слова хотя бы 1 точка;
//   дорожка освоена  — у каждого 3 точки;
//   этап пройден / освоен — пройдены / освоены все его дорожки;
//   текущий этап — первый непройденный. Ничего не закрыто: заниматься можно любым.
//   «Продолжить» ведёт в первую непройденную дорожку текущего этапа.
//   Раздел — все этапы одного уровня HSK (getPathSections): пройден / освоен,
//   когда пройдены / освоены все его этапы. Других делений нет.
//
// Прогресс общий с остальным приложением: точки хранятся у слов, поэтому слово,
// выученное в «Карточках» или «Написании», засчитывается и здесь.

import type { Word } from "@/content/flashcards/types";
import { pathThemes } from "@/content/path/themes";
import { getWordFrequency } from "@/content/words/hsk";
import { allWords } from "@/content/words/vocabulary";
import { getWordLevel } from "@/store/wordProgressStore";
import {
  chunkSteps,
  orderLevelWords,
  splitEvenly,
  STEP_SIZE,
} from "@/utils/writing/steps";
import {
  getWordHskLevel,
  getWordWritingDots,
  getWritableWords,
  LEARNED_DOTS,
  NO_HSK_LEVEL,
  type ProgressMap,
} from "@/utils/writing/words";

// ── Дорожки ──────────────────────────────────────────────────────────────────

export type TrackId = "reading" | "writing";

export interface TrackInfo {
  id: TrackId;
  title: string;
}

/** Дорожки этапа в том порядке, в каком их советуем проходить. */
export const TRACKS: TrackInfo[] = [
  { id: "reading", title: "Перевод" },
  { id: "writing", title: "Письмо" },
];

// ── Этапы ────────────────────────────────────────────────────────────────────

export interface PathStage {
  /** Номер этапа на всём пути (0, 1, 2…). */
  index: number;
  /** Стабильный ключ: «1:0» — HSK 1, первый этап раздела. */
  id: string;
  level: number;
  title: string;
  /** Иероглиф на точке карты. */
  glyph: string;
  /** Все слова этапа (для перевода). */
  words: Word[];
  /** Слова, которые можно писать (до 2 иероглифов, есть данные о чертах). */
  writable: Word[];
}

/** Меньше слов карточкам не хватает на 4 варианта ответа. */
const MIN_STAGE_WORDS = 4;

function frequencyOf(word: Word): number {
  return getWordFrequency(word.vocabularyId) ?? Number.MAX_SAFE_INTEGER;
}

/** Иероглиф этапа: первое слово из одного иероглифа или первый иероглиф первого слова. */
function glyphOf(words: Word[]): string {
  const single = words.find((word) => Array.from(word.hanzi).length === 1);
  return single?.hanzi ?? Array.from(words[0]?.hanzi ?? "")[0] ?? "";
}

/** Слова одного раздела, разбитые на этапы с названиями. */
function buildLevel(
  level: number,
  known: Set<string>,
): { title: string; words: Word[] }[] {
  const levelWords = allWords.filter((word) => getWordHskLevel(word) === level);
  const result: { title: string; words: Word[] }[] = [];

  const add = (words: Word[], title: (part: number) => string) => {
    const ordered = orderLevelWords(words, known, frequencyOf);
    for (const word of ordered) {
      for (const char of Array.from(word.hanzi)) known.add(char);
    }
    splitEvenly(ordered).forEach((part, i) =>
      result.push({ title: title(i), words: part }),
    );
  };

  const themes = pathThemes.filter((theme) => theme.level === level);

  if (themes.length > 0) {
    const byHanzi = new Map<string, Word>();
    for (const word of levelWords) {
      if (!byHanzi.has(word.hanzi)) byHanzi.set(word.hanzi, word);
    }
    const used = new Set<string>();

    for (const theme of themes) {
      const words = theme.words
        .split(/\s+/)
        .map((hanzi) => byHanzi.get(hanzi))
        .filter((word): word is Word => !!word && !used.has(word.vocabularyId));
      for (const word of words) used.add(word.vocabularyId);
      add(words, (i) => (i === 0 ? theme.title : `${theme.title} · ${i + 1}`));
    }

    add(
      levelWords.filter((word) => !used.has(word.vocabularyId)),
      (i) => (i === 0 ? "Ещё слова" : `Ещё слова · ${i + 1}`),
    );
    return result;
  }

  // Темы ещё не составлены: по частоте, по 10 слов
  const steps = chunkSteps(
    orderLevelWords(levelWords, known, frequencyOf),
    STEP_SIZE,
  );
  const last = steps[steps.length - 1];
  if (steps.length > 1 && last.length < MIN_STAGE_WORDS) {
    steps.pop();
    steps[steps.length - 1] = [...steps[steps.length - 1], ...last];
  }
  for (const words of steps) {
    for (const word of words) {
      for (const char of Array.from(word.hanzi)) known.add(char);
    }
  }
  steps.forEach((words, i) =>
    result.push({ title: `HSK ${level} · ${i + 1}`, words }),
  );
  return result;
}

let stagesCache: PathStage[] | null = null;

/** Все этапы пути по порядку. Считаются один раз. */
export function getPathStages(): PathStage[] {
  if (stagesCache) return stagesCache;

  const levels = Array.from(
    new Set(allWords.map(getWordHskLevel).filter((l) => l !== NO_HSK_LEVEL)),
  ).sort((a, b) => a - b);

  const known = new Set<string>();
  const stages: PathStage[] = [];

  for (const level of levels) {
    buildLevel(level, known).forEach(({ title, words }, i) => {
      stages.push({
        index: stages.length,
        id: `${level}:${i}`,
        level,
        title,
        glyph: glyphOf(words),
        words,
        writable: getWritableWords(words),
      });
    });
  }

  stagesCache = stages;
  return stages;
}

export function findPathStage(id: string): PathStage | undefined {
  return getPathStages().find((stage) => stage.id === id);
}

// ── Прогресс ─────────────────────────────────────────────────────────────────

/** Точки слова по навыку (0–3). Отметка «знаю» из словаря здесь не учитывается. */
export function getTrackDots(
  word: Word,
  track: TrackId,
  progress: ProgressMap,
): number {
  return track === "writing"
    ? getWordWritingDots(word, progress)
    : getWordLevel(progress[word.vocabularyId], false, ["reading"]);
}

export interface TrackProgress {
  id: TrackId;
  title: string;
  /** Слов с хотя бы 1 точкой. */
  started: number;
  /** Слов с 3 точками. */
  learned: number;
  total: number;
  passed: boolean;
  mastered: boolean;
}

export interface StageProgress {
  stage: PathStage;
  /** Только дорожки, в которых есть слова (у этапа без «писабельных» слов нет письма). */
  tracks: TrackProgress[];
  passed: boolean;
  mastered: boolean;
  /** Первая непройденная дорожка (если пройдены все — undefined). */
  next?: TrackId;
}

function trackWords(stage: PathStage, track: TrackId): Word[] {
  return track === "writing" ? stage.writable : stage.words;
}

export function getStageProgress(
  stage: PathStage,
  progress: ProgressMap,
): StageProgress {
  const tracks = TRACKS.flatMap(({ id, title }) => {
    const words = trackWords(stage, id);
    if (words.length === 0) return [];

    const dots = words.map((word) => getTrackDots(word, id, progress));
    const started = dots.filter((d) => d > 0).length;
    const learned = dots.filter((d) => d >= LEARNED_DOTS).length;
    return [
      {
        id,
        title,
        started,
        learned,
        total: words.length,
        passed: started === words.length,
        mastered: learned === words.length,
      },
    ];
  });

  return {
    stage,
    tracks,
    passed: tracks.every((t) => t.passed),
    mastered: tracks.every((t) => t.mastered),
    next: tracks.find((t) => !t.passed)?.id,
  };
}

export interface PathProgress {
  stages: StageProgress[];
  /** Текущий этап: первый непройденный (если пройдены все — undefined). */
  currentIndex?: number;
}

export function getPathProgress(progress: ProgressMap): PathProgress {
  const stages = getPathStages().map((stage) =>
    getStageProgress(stage, progress),
  );
  const current = stages.findIndex((s) => !s.passed);
  return { stages, currentIndex: current === -1 ? undefined : current };
}

/** Куда ведёт «Продолжить»: этап и дорожка. */
export function getContinueTarget(
  path: PathProgress,
): { stage: PathStage; track: TrackId } | null {
  if (path.currentIndex !== undefined) {
    const current = path.stages[path.currentIndex];
    return { stage: current.stage, track: current.next ?? "reading" };
  }
  // Всё пройдено — первый не освоенный целиком
  const unmastered = path.stages.find((s) => !s.mastered);
  if (!unmastered) return null;
  const track =
    unmastered.tracks.find((t) => !t.mastered)?.id ?? "reading";
  return { stage: unmastered.stage, track };
}

// ── Тренировка этапа ─────────────────────────────────────────────────────────

/** id тренировки карточек для этапа: «path:1:0». */
export const PATH_TRAINING_PREFIX = "path:";

export function pathTrainingId(stage: PathStage): string {
  return `${PATH_TRAINING_PREFIX}${stage.id}`;
}

/** Слова и название тренировки карточек этапа по её id. null — это не этап. */
export function findPathTraining(
  id: string,
): { title: string; words: Word[] } | null {
  if (!id.startsWith(PATH_TRAINING_PREFIX)) return null;
  const stage = findPathStage(id.slice(PATH_TRAINING_PREFIX.length));
  if (!stage || stage.words.length < MIN_STAGE_WORDS) return null;
  return { title: stage.title, words: stage.words };
}

// ── Разделы HSK ──────────────────────────────────────────────────────────────

/** Раздел пути — все этапы одного уровня HSK. */
export interface PathSection {
  level: number;
  /** Номер первого этапа раздела на всём пути. */
  firstIndex: number;
  total: number;
  passed: number;
  mastered: number;
}

/** Разделы по порядку уровней: сколько этапов пройдено и освоено. */
export function getPathSections(path: PathProgress): PathSection[] {
  const sections: PathSection[] = [];
  for (const item of path.stages) {
    let section = sections[sections.length - 1];
    if (!section || section.level !== item.stage.level) {
      section = {
        level: item.stage.level,
        firstIndex: item.stage.index,
        total: 0,
        passed: 0,
        mastered: 0,
      };
      sections.push(section);
    }
    section.total += 1;
    if (item.passed) section.passed += 1;
    if (item.mastered) section.mastered += 1;
  }
  return sections;
}
