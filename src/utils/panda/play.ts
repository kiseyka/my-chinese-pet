// src/utils/panda/play.ts
//
// ИГРА С ПАНДОЙ ПО ТАПУ. Облачко (utils/panda/thoughts) — это когда панда начинает
// сама, редко. А тап по панде без облачка — когда начинаешь ты: панда предлагает
// поиграть. Лимит — PLAYS_PER_HOUR игр в час, потом панда отдыхает.
//
// Игры — загадки по твоим словам (их не может кончиться, в отличие от фраз):
//   pick  — по переводу выбрать иероглиф из трёх;
//   write — написать слово по памяти (только слова, которые уже писали).
// Слова: сначала «Повторение», потом любые начатые (хотя бы 1 точка); последние
// загаданные не повторяются.
//
// Награды (решено: монеты — только за то, что похоже на тренировку):
//   верный ответ в pick — PICK_REWARD монет;
//   написанное слово — WRITE_REWARD, без единой ошибки — WRITE_PERFECT_REWARD;
//   любая доигранная игра — привязанность +1 (recordPlay).
// Точки слов игры не меняют.

import type { Word } from "@/content/flashcards/types";
import { allWords, findWord } from "@/content/words/vocabulary";
import { usePandaStore } from "@/store/pandaStore";
import { useProgressStore } from "@/store/userProgressStore";
import { useWordProgressStore } from "@/store/wordProgressStore";
import { shuffle } from "@/utils/shuffle";
import { getWritableWords } from "@/utils/writing/words";

export type PlayKind = "pick" | "write";

export const PLAYS_PER_HOUR = 3;
const HOUR_MS = 60 * 60 * 1000;

export const PICK_REWARD = 2;
export const WRITE_REWARD = 3;
export const WRITE_PERFECT_REWARD = 5;

/** Сколько игр ещё можно в этот час. */
export function getPlaysLeft(playTimes: number[], now = Date.now()): number {
  const recent = playTimes.filter((time) => now - time < HOUR_MS);
  return Math.max(0, PLAYS_PER_HOUR - recent.length);
}

/** Через сколько минут освободится следующая игра (0 — уже можно). */
export function getMinutesUntilPlay(playTimes: number[], now = Date.now()): number {
  if (getPlaysLeft(playTimes, now) > 0) return 0;
  const oldest = Math.min(...playTimes.filter((time) => now - time < HOUR_MS));
  return Math.max(1, Math.ceil((oldest + HOUR_MS - now) / 60000));
}

/** Слова для загадок: «Повторение», потом начатые; без недавно загаданных. */
function candidateWords(kind: PlayKind): Word[] {
  const { review, flashcardWords } = useWordProgressStore.getState();
  const recent = new Set(usePandaStore.getState().recentRiddleWordIds);

  const fits = (word: Word) => {
    if (kind === "pick") return true;
    if (getWritableWords([word]).length === 0) return false;
    return (flashcardWords[word.vocabularyId]?.writing.streak ?? 0) > 0;
  };

  // Иероглифы «char:…» пропускаем: у них нет своего перевода
  const reviewWords = Object.keys(review)
    .map((id) => findWord(id))
    .filter((word): word is Word => !!word && fits(word));

  const startedWords = allWords.filter((word) => {
    const progress = flashcardWords[word.vocabularyId];
    const started =
      !!progress && (progress.reading.streak > 0 || progress.writing.streak > 0);
    return started && fits(word);
  });

  for (const list of [reviewWords, startedWords]) {
    const fresh = list.filter((word) => !recent.has(word.vocabularyId));
    if (fresh.length > 0) return shuffle(fresh);
  }
  return shuffle(reviewWords.length > 0 ? reviewWords : startedWords);
}

/** Есть ли из чего загадать (для кнопок меню). */
export function canPlay(kind: PlayKind): boolean {
  return candidateWords(kind).length > 0;
}

/** Слово для новой загадки или undefined, если загадать нечего. */
export function pickPlayWord(kind: PlayKind): Word | undefined {
  return candidateWords(kind)[0];
}

/** Игра доиграна: монеты (если есть), привязанность, лимит. */
export function finishPlay(wordId: string, coins: number) {
  if (coins > 0) useProgressStore.getState().addCoins(coins);
  usePandaStore.getState().recordPlay(wordId, Date.now());
}
