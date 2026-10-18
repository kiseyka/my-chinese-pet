// src/hooks/panda/usePandaDialog.ts

import { usePandaStore } from "@/store/pandaStore";
import { useProgressStore } from "@/store/userProgressStore";
import { useWordProgressStore } from "@/store/wordProgressStore";
import {
  QUIZ_REWARD_COINS,
  buildDialog,
  buildResponseStep,
  type DialogStep,
  type PandaDialog,
} from "@/utils/pandaDialog";
import * as Speech from "expo-speech";
import { useEffect, useState } from "react";

function speakChinese(text: string) {
  Speech.stop();
  Speech.speak(text, { language: "zh-CN" });
}

export function usePandaDialog() {
  const pendingResult = usePandaStore((s) => s.pendingTrainingResult);

  const [dialog, setDialog] = useState<PandaDialog | null>(null);
  const [step, setStep] = useState<DialogStep | null>(null);

  // Появился свежий результат тренировки — решаем, что скажет панда
  useEffect(() => {
    if (!pendingResult) return;

    const panda = usePandaStore.getState();

    const built = buildDialog(pendingResult, {
      recentWordIds: panda.recentWordIds,
      // Выбор разрешён не чаще раза в две тренировки
      allowChoices: panda.trainingsSinceChoice >= 1,
    });

    panda.increaseBond(1);
    panda.registerTraining(built !== null && built.step.replies.length > 0);
    panda.clearPendingTrainingResult();

    if (built) {
      panda.rememberWord(built.word.vocabularyId);
      setDialog(built);
      setStep(built.step);
    }
  }, [pendingResult]);

  const close = () => {
    Speech.stop();
    setDialog(null);
    setStep(null);
  };

  /** Произнести персональную фразу (иконка 🔊 в блоке фразы). */
  const speakPhrase = () => {
    if (!step?.phrase) return;
    speakChinese(step.phrase.hanzi);
  };

  const selectReply = (index: number) => {
    if (!dialog || !step) return;

    const reply = step.replies[index];
    if (!reply) return;

    // «Скажи вслух» — действие, а не ответ: диалог остаётся на месте
    if (reply.speak) {
      speakChinese(dialog.word.hanzi);
      return;
    }

    // Верный ответ в квизе: монеты и привязанность.
    // После ответа вариантов на экране уже нет, повторно награду не получить.
    if (reply.isCorrect === true) {
      useProgressStore.getState().addCoins(QUIZ_REWARD_COINS);
      usePandaStore.getState().increaseBond(1);
    }

    if (reply.bond) {
      usePandaStore.getState().increaseBond(reply.bond);
    }

    if (reply.review) {
      useWordProgressStore.getState().addToReview([dialog.word.vocabularyId]);
    }

    const next = buildResponseStep(dialog, reply);

    if (next) {
      setStep(next);
    } else {
      close();
    }
  };

  return { step, selectReply, close, speakPhrase };
}
