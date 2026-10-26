// src/utils/learning.ts
//
// «Повторение» и «Изученное».
// «Изученное» не хранится, а вычисляется: слово изучено, если у него все 3 точки
// перевода и, если его можно писать, все 3 точки письма (6 точек), и его нет
// в «Повторении». Значит, у слова три состояния:
//   учится     — точек ещё не все и слова нет в «Повторении»;
//   повторение — слово в «Повторении» (сколько бы ни было точек);
//   изучено    — все точки и не в «Повторении».
// Убрать слово из «Повторения» откуда угодно: со всеми точками оно станет изученным,
// без них — просто учится. Положить изученное слово в «Повторение» — и оно вернётся
// в «Изученное», когда его оттуда уберут.
//
// Автопереходы (после каждого ответа, сразу):
//   - ошибка на изученном слове (в письме — написано с подсказками) → «Повторение»;
//   - верный ответ на слово из «Повторения», у которого уже все точки, →
//     слово уходит из «Повторения» (то есть в «Изученное»);
//   - самопроверка: «сомневаюсь» и «не знаю» → «Повторение»; «знаю» убирает
//     из «Повторения» только слово со всеми точками.
// Слово, набравшее все точки, становится изученным само (если не в «Повторении»).
//
// Перед первым ответом на слово за тренировку запоминаем, где оно было
// (gameStore.statusBefore): экран итогов показывает, что изменилось, и даёт отменить.

import type { Word } from "@/content/flashcards/types";
import { allWords } from "@/content/words/vocabulary";
import {
  useGameStore,
  type StatusChange,
  type WordStatus,
} from "@/store/gameStore";
import { useWordProgressStore } from "@/store/wordProgressStore";
import { getTrackDots } from "@/utils/path/stages";
import {
  getWritableWords,
  LEARNED_DOTS,
  type ProgressMap,
} from "@/utils/writing/words";

type Skill = "reading" | "writing";
type ReviewMap = Record<string, unknown>;

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
 * У слова все точки: 3 в переводе и, если слово можно писать, 3 в письме.
 * Иероглифы вида «char:么» не слова базы — изученными не бывают.
 */
export function hasAllDots(wordId: string, progress: ProgressMap): boolean {
  const word = findWord(wordId);
  if (!word) return false;
  if (getTrackDots(word, "reading", progress) < LEARNED_DOTS) return false;
  if (!getWritableIds().has(wordId)) return true;
  return getTrackDots(word, "writing", progress) >= LEARNED_DOTS;
}

/** id слов базы, у которых все точки (в «Повторении» они или нет). */
export function findWordsWithAllDots(progress: ProgressMap): string[] {
  return allWords
    .map((word) => word.vocabularyId)
    .filter((id) => hasAllDots(id, progress));
}

/** Изученные слова: все точки и не в «Повторении». Последние отвеченные — первыми. */
export function getLearnedWords(
  progress: ProgressMap,
  review: ReviewMap,
): Word[] {
  return allWords
    .filter((word) => !review[word.vocabularyId])
    .filter((word) => hasAllDots(word.vocabularyId, progress))
    .sort(
      (a, b) =>
        (progress[b.vocabularyId]?.lastAnsweredAt ?? 0) -
        (progress[a.vocabularyId]?.lastAnsweredAt ?? 0),
    );
}

/** Где слово: по прогрессу и «Повторению» (можно передать явно — для экранов). */
export function statusOf(
  wordId: string,
  progress: ProgressMap,
  review: ReviewMap,
): WordStatus {
  if (review[wordId]) return "review";
  return hasAllDots(wordId, progress) ? "learned" : "learning";
}

export function getWordStatus(wordId: string): WordStatus {
  const { flashcardWords, review } = useWordProgressStore.getState();
  return statusOf(wordId, flashcardWords, review);
}

function remember(wordId: string) {
  useGameStore.getState().rememberStatus(wordId, getWordStatus(wordId));
}

/**
 * Переход по итогу ответа (точки уже начислены). В письме ошибка — это подсказки:
 * точки за них не снимаются, но изученное слово уходит в «Повторение».
 */
export function applyAnswerStatus(wordId: string, isCorrect: boolean) {
  remember(wordId);
  const store = useWordProgressStore.getState();
  const inReview = !!store.review[wordId];
  const allDots = hasAllDots(wordId, store.flashcardWords);

  if (!isCorrect && !inReview && allDots) {
    store.addToReview([wordId]);
  } else if (isCorrect && inReview && allDots) {
    store.removeFromReview(wordId);
  }
}

/** Ответ на слово: точка навыка и переход между списками. */
export function answerWord(wordId: string, skill: Skill, isCorrect: boolean) {
  // Состояние запоминаем до точек: иначе последняя точка уже сделала бы слово изученным
  remember(wordId);
  useWordProgressStore
    .getState()
    .updateWordProgress({ wordId, skill, isCorrect });
  applyAnswerStatus(wordId, isCorrect);
}

/**
 * Самопроверка: «сомневаюсь» и «не знаю» → «Повторение»; «знаю» убирает из
 * «Повторения» только слово со всеми точками (точек самопроверка не даёт).
 */
export function applySelfCheck(
  results: { vocabularyId: string; know: boolean }[],
) {
  for (const { vocabularyId } of results) remember(vocabularyId);
  const store = useWordProgressStore.getState();
  store.addToReview(results.filter((r) => !r.know).map((r) => r.vocabularyId));
  for (const { vocabularyId, know } of results) {
    if (
      know &&
      store.review[vocabularyId] &&
      hasAllDots(vocabularyId, store.flashcardWords)
    ) {
      useWordProgressStore.getState().removeFromReview(vocabularyId);
    }
  }
}

export type { StatusChange };

/** Что поменялось за тренировку: слова, у которых состояние не такое, как до неё. */
export function collectStatusChanges(): StatusChange[] {
  const { statusBefore } = useGameStore.getState();
  return Object.entries(statusBefore)
    .map(([wordId, before]) => ({
      wordId,
      before,
      after: getWordStatus(wordId),
    }))
    .filter((change) => change.before !== change.after);
}
