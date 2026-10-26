// src/utils/learning.ts
//
// «Повторение» и «Изученное»: где слово и как оно переходит из списка в список.
// У слова три состояния: учится → изучено ↔ повторение.
//
// Автопереходы (после каждого ответа, сразу, без ожидания):
//   - слово только что набрало 3 точки перевода и, если его можно писать,
//     3 точки письма → «Изученное» (только в этот момент: убранное руками слово
//     с тремя точками само не вернётся);
//   - верный ответ на слово из «Повторения» → «Изученное»;
//   - ошибка на изученном слове (в письме — написано с подсказками) → «Повторение».
// Самопроверка: «знаю» → «Изученное», «сомневаюсь» и «не знаю» → «Повторение».
//
// Перед первым переходом за тренировку запоминаем, где слово было
// (gameStore.statusBefore): экран итогов показывает, что изменилось, и даёт
// отменить каждый переход.

import type { Word } from "@/content/flashcards/types";
import { allWords } from "@/content/words/vocabulary";
import { useGameStore, type WordStatus } from "@/store/gameStore";
import { useWordProgressStore } from "@/store/wordProgressStore";
import { getTrackDots } from "@/utils/path/stages";
import {
  getWritableWords,
  LEARNED_DOTS,
  type ProgressMap,
} from "@/utils/writing/words";

type Skill = "reading" | "writing";

let writableCache: Set<string> | null = null;
let wordsById: Map<string, Word> | null = null;

/** id слов, которые можно писать (один раз на всю базу). */
export function getWritableIds(): Set<string> {
  if (!writableCache) {
    writableCache = new Set(
      getWritableWords(allWords).map((w) => w.vocabularyId),
    );
  }
  return writableCache;
}

function findWord(wordId: string): Word | undefined {
  if (!wordsById) wordsById = new Map(allWords.map((w) => [w.vocabularyId, w]));
  return wordsById.get(wordId);
}

/**
 * У слова все 3 точки: в переводе и, если слово можно писать, в письме.
 * Иероглифы вида «char:么» не слова базы — сами в «Изученное» не попадают.
 */
export function hasAllDots(wordId: string, progress: ProgressMap): boolean {
  const word = findWord(wordId);
  if (!word) return false;
  if (getTrackDots(word, "reading", progress) < LEARNED_DOTS) return false;
  if (!getWritableIds().has(wordId)) return true;
  return getTrackDots(word, "writing", progress) >= LEARNED_DOTS;
}

/** Слова базы, у которых все 3 точки (для первого заполнения «Изученного»). */
export function findWordsWithAllDots(progress: ProgressMap): string[] {
  return allWords
    .map((word) => word.vocabularyId)
    .filter((id) => hasAllDots(id, progress));
}

export function getWordStatus(wordId: string): WordStatus {
  const { review, learned } = useWordProgressStore.getState();
  if (review[wordId]) return "review";
  if (learned[wordId]) return "learned";
  return "learning";
}

function remember(wordId: string) {
  useGameStore.getState().rememberStatus(wordId, getWordStatus(wordId));
}

/**
 * Переход по итогу ответа.
 * @param gotAllDots этим ответом слово набрало все 3 точки
 *   (в письме ошибка — это подсказки, точки за них не снимаются и не даются).
 */
export function applyAnswerStatus(
  wordId: string,
  isCorrect: boolean,
  gotAllDots = false,
) {
  remember(wordId);
  const store = useWordProgressStore.getState();
  const status = getWordStatus(wordId);

  if (isCorrect && status === "review") {
    store.markLearned([wordId]);
  } else if (!isCorrect && status === "learned") {
    store.addToReview([wordId]);
  } else if (status === "learning" && gotAllDots) {
    store.markLearned([wordId]);
  }
}

/** Ответ на слово: точка навыка и переход между списками. */
export function answerWord(wordId: string, skill: Skill, isCorrect: boolean) {
  // Статус запоминаем до точек: иначе третья точка уже бы его поменяла
  remember(wordId);
  const store = useWordProgressStore.getState();
  const hadAllDots = hasAllDots(wordId, store.flashcardWords);
  store.updateWordProgress({ wordId, skill, isCorrect });
  const hasAllNow = hasAllDots(
    wordId,
    useWordProgressStore.getState().flashcardWords,
  );
  applyAnswerStatus(wordId, isCorrect, !hadAllDots && hasAllNow);
}

/** Самопроверка: «знаю» → «Изученное», остальное → «Повторение». */
export function applySelfCheck(results: { vocabularyId: string; know: boolean }[]) {
  const store = useWordProgressStore.getState();
  for (const { vocabularyId } of results) remember(vocabularyId);
  store.markLearned(results.filter((r) => r.know).map((r) => r.vocabularyId));
  store.addToReview(results.filter((r) => !r.know).map((r) => r.vocabularyId));
}

export interface StatusChange {
  wordId: string;
  before: WordStatus;
  after: WordStatus;
}

/** Что поменялось за тренировку: слова, у которых состояние не такое, как до неё. */
export function collectStatusChanges(): StatusChange[] {
  const { statusBefore } = useGameStore.getState();
  return Object.entries(statusBefore)
    .map(([wordId, before]) => ({ wordId, before, after: getWordStatus(wordId) }))
    .filter((change) => change.before !== change.after);
}
