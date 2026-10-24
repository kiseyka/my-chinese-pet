// src/utils/panda/play.ts
//
// ИГРА С ПАНДОЙ ПО ТАПУ. Облачко (utils/panda/thoughts) — это когда панда начинает
// сама, редко. А тап по панде без облачка — когда начинаешь ты: панда предлагает
// поиграть. Лимит — PLAYS_PER_WINDOW игр за PLAY_WINDOW_MS (15 за 3 часа), потом
// панда отдыхает. Обе цифры можно менять здесь.
//
// Игры — загадки по твоим словам (их не может кончиться, в отличие от фраз):
//   pick   — по переводу выбрать иероглиф из трёх;
//   listen — панда произносит слово, выбрать иероглиф из трёх;
//   stroke — у иероглифа не хватает одной черты, дописать её (любые слова, которые
//            можно писать — это проще, чем писать целиком);
//   write  — написать слово по памяти (только слова, которые уже писали).
// Слова: начатые (хотя бы 1 точка), «Повторение» не используется; начатых нет —
// первые этапы пути. Для «угадай» и «послушай» — слова до 2 иероглифов.
// Последние загаданные не повторяются.
//
// «Угадай» и «послушай» — раунд из ROUND_SIZE загадок подряд (каждая загадка — одна
// игра из лимита, так что за 3 часа выходит 5 раундов).
//
// Награды: опыт, как в тренировках — 1 за верный ответ, 2 за слово, написанное без
// ошибок. Плюс монеты за раунд «угадай»/«послушай» (решено 24 октября): все загадки
// верно — ROUND_PERFECT_COINS, с ошибками — ROUND_COINS, ни одной верной — ничего.
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

export type PlayKind = "pick" | "listen" | "stroke" | "write";

export const PLAYS_PER_WINDOW = 15;
export const PLAY_WINDOW_MS = 3 * 60 * 60 * 1000;

// Награда — опыт, как в тренировках: 1 опыт за верный ответ (монеты здесь не дают —
// иначе слово у панды стоило бы почти как целая тренировка)
export const PICK_REWARD = 1;
export const STROKE_REWARD = 1;
export const STROKE_PERFECT_REWARD = 1;
export const WRITE_REWARD = 1;
export const WRITE_PERFECT_REWARD = 2;

/** Загадок в раунде «угадай» / «послушай». */
export const ROUND_SIZE = 3;
/** Монеты за раунд: все верно / с ошибками (но хоть одна верная). */
export const ROUND_PERFECT_COINS = 2;
export const ROUND_COINS = 1;

/** Сколько монет за раунд: correct верных из total. */
export function roundCoins(correct: number, total: number): number {
  if (correct === 0) return 0;
  return correct === total ? ROUND_PERFECT_COINS : ROUND_COINS;
}

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
  if (getWritableWords([word]).length === 0) return false;
  if (kind === "stroke") return true;
  const progress = useWordProgressStore.getState().flashcardWords;
  return (progress[word.vocabularyId]?.writing.streak ?? 0) > 0;
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

/**
 * Слово для новой загадки или undefined, если загадать нечего.
 * Для «угадай» и «послушай» — только слово, к которому нашлись два похожих варианта
 * (иначе на экране был бы один вариант).
 */
export function pickPlayWord(kind: PlayKind): Word | undefined {
  const words = candidateWords(kind);
  if (kind !== "pick" && kind !== "listen") return words[0];

  const translate = (key: string) => i18n.t(key);
  return words.find(
    (word) => buildReadingExamQuestion(word, translate).options.length >= 3,
  );
}

/**
 * Слова для раунда «угадай» / «послушай»: до count разных слов (меньше — если больше
 * загадать нечего). Как pickPlayWord: только слова с двумя похожими вариантами.
 */
export function pickPlayWords(kind: "pick" | "listen", count: number): Word[] {
  const translate = (key: string) => i18n.t(key);
  return candidateWords(kind)
    .filter((word) => buildReadingExamQuestion(word, translate).options.length >= 3)
    .slice(0, count);
}

/** Раунд доигран: монеты (если заработаны). */
export function finishRound(coins: number) {
  if (coins > 0) useProgressStore.getState().addCoins(coins);
}

/** Игра доиграна: опыт (если есть), привязанность, лимит. */
export function finishPlay(wordId: string, xp: number) {
  if (xp > 0) useProgressStore.getState().addXp(xp);
  usePandaStore.getState().recordPlay(wordId, Date.now());
}
