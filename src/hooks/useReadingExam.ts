// src/hooks/useReadingExam.ts
//
// Ход экзамена по переводу: перевод → выбрать иероглиф из вариантов.
// Одна попытка на слово: выбрал верно — сдано, ошибся — не сдано.
// Итог по каждому слову сразу пишется в стор (recordReadingExamResult), правила
// те же, что у письма: первый провал — пересдача через сутки, второй подряд —
// минус точка перевода. В конце — награда: опыт за сданные слова, монеты по доле.

import type { Word } from "@/content/flashcards/types";
import { useWordProgressStore } from "@/store/wordProgressStore";
import { calculateCoinsEarned } from "@/utils/calculateCoinsEarned";
import { getAccuracy, grantRewards } from "@/utils/finishTraining";
import {
  buildReadingExamQuestion,
  type ReadingExamQuestion,
} from "@/utils/readingExam";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export type ReadingExamVerdict = "passed" | "retry" | "dropped";

export interface ReadingExamOutcome {
  word: Word;
  chosen: Word;
  verdict: ReadingExamVerdict;
}

/** Записывает результат в стор и возвращает, что из этого вышло. */
function recordVerdict(wordId: string, passed: boolean): ReadingExamVerdict {
  useWordProgressStore.getState().recordReadingExamResult({ wordId, passed });
  if (passed) return "passed";

  const entry = useWordProgressStore.getState().readingExams[wordId];
  return entry?.availableAt === null ? "dropped" : "retry";
}

export function useReadingExam(words: Word[]) {
  const { t } = useTranslation(["sets"]);

  // Вопросы собираются один раз при входе: варианты не меняются посреди экзамена
  const [questions] = useState<ReadingExamQuestion[]>(() =>
    words.map((word) => buildReadingExamQuestion(word, (key) => t(key))),
  );

  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<Word | null>(null);
  const [outcomes, setOutcomes] = useState<ReadingExamOutcome[]>([]);
  const [finished, setFinished] = useState(false);
  const isFinishing = useRef(false);

  const current = questions[index];
  const verdict =
    chosen && current ? outcomes[outcomes.length - 1]?.verdict : undefined;

  const choose = (option: Word) => {
    if (!current || chosen) return;
    setChosen(option);
    const passed = option.vocabularyId === current.word.vocabularyId;
    setOutcomes((previous) => [
      ...previous,
      {
        word: current.word,
        chosen: option,
        verdict: recordVerdict(current.word.vocabularyId, passed),
      },
    ]);
  };

  const next = () => {
    if (!chosen) return;
    if (index < questions.length - 1) {
      setIndex(index + 1);
      setChosen(null);
      return;
    }

    if (isFinishing.current) return;
    isFinishing.current = true;

    const passed = outcomes.filter((o) => o.verdict === "passed").length;
    grantRewards({
      xp: passed,
      coins: calculateCoinsEarned(getAccuracy(passed, outcomes.length)),
    });
    setFinished(true);
  };

  const progress =
    questions.length === 0
      ? 0
      : ((index + (chosen ? 1 : 0)) / questions.length) * 100;

  return {
    current,
    chosen,
    verdict,
    outcomes,
    finished,
    progress,
    isEmpty: questions.length === 0,
    choose,
    next,
  };
}
