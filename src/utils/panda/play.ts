// src/utils/panda/play.ts
//
// ИГРЫ С ПАНДОЙ. Облачко (utils/panda/thoughts) — фраза дня, раз в день. Игры —
// когда хочешь ты: любой тап по панде открывает меню игр (с облачком — после фразы). Лимит — PLAYS_PER_WINDOW игр за PLAY_WINDOW_MS (15 за 3 часа), потом
// панда отдыхает. Обе цифры можно менять здесь.
//
// Игры — загадки по твоим словам (их не может кончиться, в отличие от фраз):
//   pick   — по переводу выбрать иероглиф из трёх;
//   listen — панда произносит слово, выбрать иероглиф из трёх;
//   stroke — у иероглифа не хватает одной черты, дописать её (любые слова, которые
//            можно писать).
// «Напиши слово» убрано 25 октября: для игры слишком сложно, для письма есть
// полноценные тренировки.
// Слова: начатые (хотя бы 1 точка), «Повторение» не используется; начатых нет —
// первые этапы пути. Для «угадай» и «послушай» — слова до 2 иероглифов.
// Последние загаданные не повторяются.
//
// «Угадай» и «послушай» — раунд из ROUND_SIZE загадок подряд (каждая загадка — одна
// игра из лимита, так что за 3 часа выходит 5 раундов).
//
// Награда — только опыт (решено 25 октября, монет за игры нет): 1 за каждый верный
// ответ, за раунд — 0–3. «Допиши черту» — тоже раунд из 3: +1 за черту, дописанную
// без подсказки (подсказка — контур черты после двух ошибок).
// Привязанность +1 за доигранную игру — внутренний счётчик, на экране её нет:
// отношения с пандой = уровень опыта.
// Точки слов игры не меняют.

import type { Word } from "@/content/flashcards/types";
import { allWords } from "@/content/words/vocabulary";
import { getPathStages } from "@/utils/path/stages";
import { buildReadingExamQuestion } from "@/utils/readingExam";
import i18n from "i18next";
import { usePandaStore } from "@/store/pandaStore";
import { useProgressStore } from "@/store/userProgressStore";
import { useWordProgressStore } from "@/store/wordProgressStore";
import { shuffle } from "@/utils/shuffle";
import { getWritableWords } from "@/utils/writing/words";

export type PlayKind = "pick" | "listen" | "stroke";
/** Игры-загадки с выбором иероглифа (раунд из ROUND_SIZE). */
export type GuessKind = "pick" | "listen";

export const PLAYS_PER_WINDOW = 15;
export const PLAY_WINDOW_MS = 3 * 60 * 60 * 1000;

/** Опыт за верный ответ в «угадай» / «послушай» (за раунд — 0…ROUND_SIZE). */
export const PICK_REWARD = 1;
/** Опыт за черту, дописанную без подсказки (за раунд — 0…ROUND_SIZE). */
export const STROKE_REWARD = 1;

/** Загадок в раунде (все игры). */
export const ROUND_SIZE = 3;

/** Сколько игр ещё можно сейчас (за последние 3 часа). */
export function getPlaysLeft(playTimes: number[], now = Date.now()): number {
  const recent = playTimes.filter((time) => now - time < PLAY_WINDOW_MS);
  return Math.max(0, PLAYS_PER_WINDOW - recent.length);
}

/** Через сколько минут освободится следующая игра (0 — уже можно). */
export function getMinutesUntilPlay(playTimes: number[], now = Date.now()): number {
  if (getPlaysLeft(playTimes, now) > 0) return 0;
  const recent = playTimes
    .filter((time) => now - time < PLAY_WINDOW_MS)
    .sort((a, b) => a - b);
  // Освободится, когда самая старая из последних PLAYS_PER_WINDOW игр выйдет из окна
  const oldest = recent[recent.length - PLAYS_PER_WINDOW];
  return Math.max(1, Math.ceil((oldest + PLAY_WINDOW_MS - now) / 60000));
}

/** Самое длинное слово для «угадай» и «послушай»: длинным не хватает похожих вариантов. */
const MAX_GUESS_CHARS = 2;
/** Сколько первых этапов пути брать, если начатых слов ещё нет. */
const STARTER_STAGES = 2;

const hanCount = (word: Word) =>
  Array.from(word.hanzi).filter((ch) => /\p{Script=Han}/u.test(ch)).length;

/** Подходит ли слово для этой игры. */
function fitsKind(kind: PlayKind, word: Word): boolean {
  if (kind === "pick" || kind === "listen") {
    return hanCount(word) <= MAX_GUESS_CHARS;
  }
  return getWritableWords([word]).length > 0;
}

/**
 * Слова для загадок:
 *   1) начатые (хотя бы 1 точка перевода или письма) — «Повторение» не используется:
 *      туда кладут и длинные фразы, и отдельные иероглифы, загадывать их неудобно;
 *   2) начатых нет — первые этапы пути (HSK 1), чтобы новичку было во что поиграть.
 * Без недавно загаданных, если есть другие.
 */
function candidateWords(kind: PlayKind): Word[] {
  const { flashcardWords } = useWordProgressStore.getState();
  const recent = new Set(usePandaStore.getState().recentRiddleWordIds);

  let words = allWords.filter((word) => {
    const progress = flashcardWords[word.vocabularyId];
    const started =
      !!progress && (progress.reading.streak > 0 || progress.writing.streak > 0);
    return started && fitsKind(kind, word);
  });

  if (words.length === 0) {
    words = getPathStages()
      .slice(0, STARTER_STAGES)
      .flatMap((stage) => stage.words)
      .filter((word) => fitsKind(kind, word));
  }

  const fresh = words.filter((word) => !recent.has(word.vocabularyId));
  return shuffle(fresh.length > 0 ? fresh : words);
}

/** Есть ли из чего загадать (для кнопок меню). */
export function canPlay(kind: PlayKind): boolean {
  return candidateWords(kind).length > 0;
}

/** Слова для раунда «Допиши черту»: до count разных (меньше — если больше нечего). */
export function pickStrokeWords(count: number): Word[] {
  return candidateWords("stroke").slice(0, count);
}

export interface GuessRiddle {
  word: Word;
  /** Варианты в случайном порядке, среди них word. */
  options: Word[];
}

/** Вариантов в загадке «угадай» / «послушай» (правильный + похожие). */
const GUESS_OPTIONS = 3;

/**
 * Загадки для раунда «угадай» / «послушай»: до count разных слов, у каждого —
 * GUESS_OPTIONS похожих вариантов (меньше слов — если больше загадать нечего).
 *
 * Похожие варианты подбираются перебором всего словаря (buildReadingExamQuestion), это
 * дорого. Поэтому варианты строим только для слов раунда и останавливаемся, как только
 * набрали count, — раньше их строили для каждого начатого слова, и страница игры
 * открывалась с задержкой.
 */
export function pickGuessRound(kind: GuessKind, count: number): GuessRiddle[] {
  const translate = (key: string) => i18n.t(key);
  const riddles: GuessRiddle[] = [];
  for (const word of candidateWords(kind)) {
    if (riddles.length >= count) break;
    const { options } = buildReadingExamQuestion(word, translate);
    const others = options.filter((o) => o.vocabularyId !== word.vocabularyId);
    if (others.length < GUESS_OPTIONS - 1) continue;
    riddles.push({
      word,
      options: shuffle([word, ...others.slice(0, GUESS_OPTIONS - 1)]),
    });
  }
  return riddles;
}

/** Игра доиграна: опыт (если есть), привязанность, лимит. */
export function finishPlay(wordId: string, xp: number) {
  if (xp > 0) useProgressStore.getState().addXp(xp);
  usePandaStore.getState().recordPlay(wordId, Date.now());
}
