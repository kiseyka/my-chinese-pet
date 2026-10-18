// src/utils/finishTraining.ts
//
// Общий конец любой тренировки, которая ведёт на экран итогов:
// время → награда → результат для панды → переход на /games/stats.
// Каждая тренировка сама решает, СКОЛЬКО давать (формулы у неё свои),
// а здесь только одно место, где награда начисляется и запоминается для экрана итогов.

import { useActivityStore } from "@/store/activityStore";
import { useGameStore, type TrainingRewards } from "@/store/gameStore";
import { usePandaStore, type PandaTrainingResult } from "@/store/pandaStore";
import { useProgressStore } from "@/store/userProgressStore";
import { router } from "expo-router";

export type GameId = "flashcards" | "tones" | "writing";

interface FinishTrainingParams {
  gameId: GameId;
  rewards: TrainingRewards;
  /** Сколько было ответов — для журнала занятий (профиль). */
  answers: number;
  /** Что передать панде для комментария. Не все тренировки её пока зовут. */
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

  if (pandaResult) {
    usePandaStore.getState().setPendingTrainingResult(pandaResult);
  }

  router.replace({
    pathname: "/games/stats",
    params: mode ? { gameId, mode } : { gameId },
  });
}
