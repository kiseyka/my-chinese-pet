// src/utils/pandaDialog.ts

import { allWords } from "@/content/words/vocabulary";
import { pandaPhrases } from "@/content/panda/phrases";
import {
  scenarios,
  type DialogReply,
  type ScenarioId,
} from "@/content/panda/scenarios";
import type { PandaTrainingResult, WordChange } from "@/store/pandaStore";
import { getWordLevel, useWordProgressStore } from "@/store/wordProgressStore";
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
  word: WordChange;
  /** Полная фраза (с переводом), даже если на экране перевод скрыт. */
  phrase?: DialogPhrase;
  step: DialogStep;
}

interface BuildContext {
  recentWordIds: string[];
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

export function fillTemplate(template: string, word: WordChange): string {
  return template
    .replace(/\{hanzi\}/g, word.hanzi)
    .replace(/\{pinyin\}/g, word.pinyin)
    .replace(/\{translation\}/g, word.translation);
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
      ),
      phrase: dialog.phrase,
      replies: [],
    };
  }

  if (!reply.response || reply.response.length === 0) return null;

  const key = `${dialog.scenarioId}:${reply.label}`;

  return {
    text: fillTemplate(pickLine(key, reply.response), dialog.word),
    // Фраза остаётся на экране, пока диалог не закрыт
    phrase: dialog.phrase,
    replies: [],
  };
}
