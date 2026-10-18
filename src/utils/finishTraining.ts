// src/utils/finishTraining.ts
//
// Общий конец любой тренировки, которая ведёт на экран итогов:
// время → награда → журнал занятий → новости для панды → переход на /games/stats.
// Панда после обычных тренировок молчит: она запоминает только вехи пути
// (utils/panda/news) и расскажет о них по тапу.
// Каждая тренировка сама решает, СКОЛЬКО давать (формулы у неё свои),
// а здесь только одно место, где награда начисляется и запоминается для экрана итогов.

import { useActivityStore } from "@/store/activityStore";
import { useGameStore, type TrainingRewards } from "@/store/gameStore";
import { usePandaStore, type PandaTrainingResult } from "@/store/pandaStore";
import { useProgressStore } from "@/store/userProgressStore";
import { reportTrainingToPanda } from "@/utils/panda/news";
import { router } from "expo-router";

export type GameId = "flashcards" | "tones" | "writing";

interface FinishTrainingParams {
  gameId: GameId;
  rewards: TrainingRewards;
  /** Сколько было ответов — для журнала занятий (профиль). */
  answers: number;
  /**
   * Итог тренировки для реплик панды про слова (3 точки, ошибки, квиз).
   * Сейчас эти реплики выключены — панда рассказывает только о вехах. Оставлено,
   * чтобы вернуть их, когда будет больше вариантов текста.
   */
  pandaResult?: PandaTrainingResult;
  /** Режим тренировки для экрана итогов (например, самопроверка карточек). */
  mode?: string;
}

/** Точность в процентах (0–100), целое число. */
export function getAccuracy(correct: number, total: number): number {
  return total === 0 ? 0 : Math.round((correct / total) * 100);
}

/** Записывает законченную тренировку или экзамен в журнал занятий. */
export function logTraining(answers: number) {
  useActivityStore.getState().recordTraining(answers);
}

/** Начисляет награду (без экрана итогов — например, после экзамена). */
export function grantRewards(rewards: TrainingRewards) {
  const progress = useProgressStore.getState();
  progress.addXp(rewards.xp);
  progress.addCoins(rewards.coins);
}

export function finishTraining({
  gameId,
  rewards,
  answers,
  pandaResult,
  mode,
}: FinishTrainingParams) {
  const game = useGameStore.getState();

  game.setDuration(Date.now() - game.startTime);
  game.setRewards(rewards);

  grantRewards(rewards);
  logTraining(answers);

  // Реплики панды после каждой тренировки выключены (надоедали) — только вехи пути
  void pandaResult;
  usePandaStore.getState().increaseBond(1);
  reportTrainingToPanda();

  router.replace({
    pathname: "/games/stats",
    params: mode ? { gameId, mode } : { gameId },
  });
}
