// src/utils/pandaDialog.ts

import { allWords } from "@/content/words/vocabulary";
import { pandaPhrases } from "@/content/panda/phrases";
import {
  scenarios,
  type DialogReply,
  type ScenarioId,
} from "@/content/panda/scenarios";
import {
  usePandaStore,
  type PandaTrainingResult,
  type WordChange,
} from "@/store/pandaStore";
import { getWordLevel, useWordProgressStore } from "@/store/wordProgressStore";
import type { Word } from "@/content/flashcards/types";
import type { NewMilestones } from "@/utils/panda/milestones";
import { shuffle } from "@/utils/shuffle";
import i18n from "i18next";

/** Название набора переводов с персональными фразами (см. i18n-конфиг). */
const PHRASES_NAMESPACE = "pandaPhrases";

/** Сколько монет даётся за верный ответ в квизе. */
export const QUIZ_REWARD_COINS = 2;

/** Шанс квиза вместо «ошибки», когда есть и то и другое. */
const QUIZ_CHANCE = 0.5;

export interface DialogPhrase {
  hanzi: string;
  pinyin: string;
  /** Пустая строка — перевод скрыт (вопрос квиза). */
  translation: string;
}

export interface DialogStep {
  text: string;
  /** Персональная фраза, показывается отдельным блоком под текстом. */
  phrase?: DialogPhrase;
  replies: DialogReply[];
}

export interface PandaDialog {
  scenarioId: ScenarioId;
  /** Слово, о котором речь (у этапов и разделов его нет). */
  word?: WordChange;
  /** Подстановки помимо слова: {stage}, {next}, {level}, {skill}, {count}. */
  vars?: Record<string, string>;
  /** Полная фраза (с переводом), даже если на экране перевод скрыт. */
  phrase?: DialogPhrase;
  step: DialogStep;
}

interface BuildContext {
  recentWordIds: string[];
  /** Новые вехи пути с прошлой тренировки (этапы, разделы, изученные слова). */
  milestones?: NewMilestones;
  /** Можно ли сейчас показывать кнопки выбора. */
  allowChoices: boolean;
}

// Индекс последней показанной реплики по ключу — чтобы не повторять подряд
const lastLineIndex: Record<string, number> = {};

function pickLine(key: string, lines: string[]): string {
  if (lines.length === 1) return lines[0];

  let index = Math.floor(Math.random() * lines.length);
  if (index === lastLineIndex[key]) {
    index = (index + 1) % lines.length;
  }
  lastLineIndex[key] = index;

  return lines[index];
}

export function fillTemplate(
  template: string,
  word?: WordChange,
  vars: Record<string, string> = {},
): string {
  const values: Record<string, string> = {
    ...vars,
    ...(word && {
      hanzi: word.hanzi,
      pinyin: word.pinyin,
      translation: word.translation,
    }),
  };
  return template.replace(/\{(\w+)\}/g, (match, key) => values[key] ?? match);
}

/** Слово базы в виде WordChange (для подстановок и «Скажи вслух»). */
export function toWordChange(word: Word): WordChange {
  return {
    vocabularyId: word.vocabularyId,
    hanzi: word.hanzi,
    pinyin: word.pinyin,
    // В слове базы перевод — ключ i18n («words:…»)
    translation: i18n.t(word.translation),
    levelBefore: 3,
    levelAfter: 3,
    isCorrect: true,
  };
}

/** Собирает диалог по сценарию: строка из пула, кнопки — если выбор разрешён. */
function simpleDialog(
  scenarioId: ScenarioId,
  lines: string[],
  lineKey: string,
  context: BuildContext,
  word?: WordChange,
  vars?: Record<string, string>,
): PandaDialog {
  return {
    scenarioId,
    word,
    vars,
    step: {
      text: fillTemplate(pickLine(lineKey, lines), word, vars),
      replies: context.allowChoices ? scenarios[scenarioId].replies : [],
    },
  };
}

/** Вехи пути: самая крупная из новых. null — новых вех нет. */
function buildMilestoneDialog(context: BuildContext): PandaDialog | null {
  const m = context.milestones;
  if (!m) return null;

  if (m.passedLevels.length > 0) {
    const level = String(Math.max(...m.passedLevels));
    return simpleDialog(
      "level_passed",
      scenarios.level_passed.lines,
      "level_passed",
      context,
      undefined,
      { level },
    );
  }

  if (m.masteredStages.length > 0) {
    const stage = m.masteredStages[m.masteredStages.length - 1];
    return simpleDialog(
      "stage_mastered",
      scenarios.stage_mastered.lines,
      "stage_mastered",
      context,
      undefined,
      { stage: stage.title },
    );
  }

  if (m.passedStages.length > 0) {
    const stage = m.passedStages[m.passedStages.length - 1];
    const scenario = scenarios.stage_passed;
    const final = !m.nextStage && scenario.finalLines;
    return simpleDialog(
      "stage_passed",
      final ? scenario.finalLines! : scenario.lines,
      final ? "stage_passed:final" : "stage_passed",
      context,
      undefined,
      { stage: stage.title, next: m.nextStage?.title ?? "" },
    );
  }

  if (m.learnedWords.length > 0) {
    const candidates = m.learnedWords.map(toWordChange);
    const word = pickWord(candidates, context.recentWordIds);
    const scenario = scenarios.word_learned;
    const many = candidates.length > 1 && scenario.manyLines;
    return simpleDialog(
      "word_learned",
      many ? scenario.manyLines! : scenario.lines,
      many ? "word_learned:many" : "word_learned",
      context,
      word,
    );
  }

  return null;
}

/** Итог экзамена: сдано — похвала, не сдано ничего — поддержка. */
function buildExamDialog(
  result: PandaTrainingResult,
  context: BuildContext,
): PandaDialog | null {
  const exam = result.exam;
  if (!exam) return null;

  const skill = exam.skill === "writing" ? "по письму" : "по переводу";

  if (exam.passed.length > 0) {
    const word = pickWord(exam.passed, context.recentWordIds);
    const scenario = scenarios.exam_passed;
    const many = exam.passed.length > 1 && scenario.manyLines;
    return simpleDialog(
      "exam_passed",
      many ? scenario.manyLines! : scenario.lines,
      many ? "exam_passed:many" : "exam_passed",
      context,
      word,
      { skill, count: String(exam.passed.length) },
    );
  }

  if (exam.failed.length > 0) {
    return simpleDialog(
      "exam_retry",
      scenarios.exam_retry.lines,
      "exam_retry",
      context,
    );
  }

  return null;
}

// Предпочитаем слова, которые панда недавно не упоминала
function pickWord(
  candidates: WordChange[],
  recentWordIds: string[],
): WordChange {
  const fresh = candidates.filter(
    (c) => !recentWordIds.includes(c.vocabularyId),
  );
  const pool = fresh.length > 0 ? fresh : candidates;

  return pool[Math.floor(Math.random() * pool.length)];
}

function translatePhrase(key: string): string {
  return i18n.t(key, { ns: PHRASES_NAMESPACE });
}

function getPhrase(word: WordChange): DialogPhrase | undefined {
  const entry = pandaPhrases[word.hanzi];
  if (!entry) return undefined;

  return {
    hanzi: entry.hanzi,
    pinyin: entry.pinyin,
    translation: translatePhrase(entry.translationKey),
  };
}

/** Два неправильных варианта: сначала свои (distractorKeys), потом переводы других фраз. */
function getDistractors(word: WordChange, correct: string): string[] {
  const entry = pandaPhrases[word.hanzi];

  const handmade = (entry?.distractorKeys ?? [])
    .map(translatePhrase)
    .filter((text) => text !== correct);

  const others = Object.entries(pandaPhrases)
    .filter(([hanzi]) => hanzi !== word.hanzi)
    .map(([, phrase]) => translatePhrase(phrase.translationKey))
    .filter((text) => text !== correct);

  const pool = [...shuffle(handmade), ...shuffle(others)];

  return Array.from(new Set(pool)).slice(0, 2);
}

/** Слова, про которые можно задать вопрос: есть фраза и хоть какой-то прогресс. */
function getQuizCandidates(): WordChange[] {
  const { flashcardWords, vocabularyWords } = useWordProgressStore.getState();
  const found = new Map<string, WordChange>();

  for (const word of allWords) {
    if (!pandaPhrases[word.hanzi]) continue;
    if (found.has(word.vocabularyId)) continue;

    const level = getWordLevel(
      flashcardWords[word.vocabularyId],
      vocabularyWords[word.vocabularyId]?.isKnown ?? false,
    );

    if (level < 1) continue;

    found.set(word.vocabularyId, {
      vocabularyId: word.vocabularyId,
      hanzi: word.hanzi,
      pinyin: word.pinyin,
      translation: word.translation,
      levelBefore: level,
      levelAfter: level,
      isCorrect: true,
    });
  }

  return Array.from(found.values());
}

/** Диалог-квиз. null — подходящих слов или вариантов ответа нет. */
function buildQuizDialog(recentWordIds: string[]): PandaDialog | null {
  const candidates = getQuizCandidates();
  if (candidates.length === 0) return null;

  const word = pickWord(candidates, recentWordIds);
  const phrase = getPhrase(word);
  if (!phrase) return null;

  const distractors = getDistractors(word, phrase.translation);
  if (distractors.length < 2) return null;

  const replies: DialogReply[] = shuffle([
    { label: phrase.translation, isCorrect: true },
    { label: distractors[0], isCorrect: false },
    { label: distractors[1], isCorrect: false },
  ]);

  const scenario = scenarios.phrase_quiz;

  return {
    scenarioId: "phrase_quiz",
    word,
    phrase,
    step: {
      text: pickLine("phrase_quiz", scenario.lines),
      // Перевод в вопросе скрыт, он появится после ответа
      phrase: { ...phrase, translation: "" },
      replies,
    },
  };
}

/** Выбирает событие тренировки и собирает первый шаг диалога. null — панда молчит. */
export function buildDialog(
  result: PandaTrainingResult,
  context: BuildContext,
): PandaDialog | null {
  // Вехи пути важнее всего, потом итог экзамена
  const milestone = buildMilestoneDialog(context);
  if (milestone) return milestone;

  const examDialog = buildExamDialog(result, context);
  if (examDialog) return examDialog;

  const mastered = result.wordChanges.filter(
    (c) => c.levelBefore < 3 && c.levelAfter === 3,
  );
  const mistakes = result.wordChanges.filter(
    (c) => !c.isCorrect && c.levelBefore < 3,
  );

  // Приоритет: выученное слово важнее всего
  if (mastered.length > 0) {
    // Из освоенных слов предпочитаем те, у которых есть персональная фраза
    const withPhrase = mastered.filter((c) => pandaPhrases[c.hanzi]);
    const pool = withPhrase.length > 0 ? withPhrase : mastered;

    const word = pickWord(pool, context.recentWordIds);
    const phrase = getPhrase(word);
    const isWriting = result.type === "writing_completed";
    const scenarioId: ScenarioId = phrase
      ? isWriting
        ? "word_mastered_writing_phrase"
        : "word_mastered_phrase"
      : isWriting
        ? "word_mastered_writing"
        : "word_mastered";
    const scenario = scenarios[scenarioId];

    const useMany = mastered.length > 1 && scenario.manyLines !== undefined;
    const lines = useMany ? scenario.manyLines! : scenario.lines;
    const lineKey = useMany ? `${scenarioId}:many` : scenarioId;

    return {
      scenarioId,
      word,
      phrase,
      step: {
        text: fillTemplate(pickLine(lineKey, lines), word),
        phrase,
        replies: context.allowChoices ? scenario.replies : [],
      },
    };
  }

  // Квиз: только когда разрешён выбор. Если есть и ошибки, делим шанс.
  if (context.allowChoices) {
    const wantQuiz = mistakes.length === 0 || Math.random() < QUIZ_CHANCE;

    if (wantQuiz) {
      const quiz = buildQuizDialog(context.recentWordIds);
      if (quiz) return quiz;
    }
  }

  if (mistakes.length > 0) {
    const word = pickWord(mistakes, context.recentWordIds);
    const scenario = scenarios.word_mistake;

    return {
      scenarioId: "word_mistake",
      word,
      step: {
        text: fillTemplate(pickLine("word_mistake", scenario.lines), word),
        replies: context.allowChoices ? scenario.replies : [],
      },
    };
  }

  return null;
}

/** Шаг-ответ панды на выбранную кнопку. null — диалог закрывается. */
export function buildResponseStep(
  dialog: PandaDialog,
  reply: DialogReply,
): DialogStep | null {
  const scenario = scenarios[dialog.scenarioId];

  // Ответ в квизе: реплика зависит от верности, перевод показываем
  if (reply.isCorrect !== undefined) {
    const lines = reply.isCorrect ? scenario.correctLines : scenario.wrongLines;
    if (!lines || lines.length === 0) return null;

    return {
      text: fillTemplate(
        pickLine(`${dialog.scenarioId}:${reply.isCorrect}`, lines),
        dialog.word,
        dialog.vars,
      ),
      phrase: dialog.phrase,
      replies: [],
    };
  }

  if (!reply.response || reply.response.length === 0) return null;

  const key = `${dialog.scenarioId}:${reply.label}`;

  return {
    text: fillTemplate(pickLine(key, reply.response), dialog.word, dialog.vars),
    // Фраза остаётся на экране, пока диалог не закрыт
    phrase: dialog.phrase,
    replies: [],
  };
}

/** Итог экзамена для панды: она прокомментирует его на своём экране. */
export function sendExamToPanda(
  skill: "reading" | "writing",
  outcomes: Array<{ word: Word; verdict: string }>,
) {
  const passed = outcomes.filter((o) => o.verdict === "passed");
  const failed = outcomes.filter((o) => o.verdict !== "passed");
  usePandaStore.getState().setPendingTrainingResult({
    type: "exam_completed",
    score: passed.length,
    total: outcomes.length,
    results: [],
    wordChanges: [],
    exam: {
      skill,
      passed: passed.map((o) => toWordChange(o.word)),
      failed: failed.map((o) => toWordChange(o.word)),
    },
  });
}
