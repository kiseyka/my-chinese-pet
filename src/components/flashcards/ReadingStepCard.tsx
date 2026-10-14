// src/components/flashcards/ReadingStepCard.tsx
//
// Ступень в карточках: общая карточка StepAccordion (как в «Написании»)
// с сеткой слов и точками чтения.
//
// Точки считает сама карточка (подписана на стор): так при изменении прогресса
// перерисовываются только видимые карточки, а не весь раздел.

import type { Word } from "@/content/flashcards/types";
import { getWordLevel, useWordProgressStore } from "@/store/wordProgressStore";
import { memo, useMemo } from "react";
import {
  STEP_ACCORDION_INSET,
  StepAccordion,
} from "@/components/ui/StepAccordion";
import { ReadingGrid } from "./ReadingGrid";

interface ReadingStepCardProps {
  index: number;
  words: Word[];
  expanded: boolean;
  /** Сколько ширины экрана занято вокруг карточки (отступы экрана). */
  outerInset: number;
  onToggle: (index: number) => void;
  onStart: (index: number) => void;
  onSelectWord: (word: Word) => void;
}

export const ReadingStepCard = memo(function ReadingStepCard({
  index,
  words,
  expanded,
  outerInset,
  onToggle,
  onStart,
  onSelectWord,
}: ReadingStepCardProps) {
  const flashcardWords = useWordProgressStore((state) => state.flashcardWords);
  const vocabularyWords = useWordProgressStore(
    (state) => state.vocabularyWords,
  );

  const dots = useMemo(
    () =>
      words.map((word) =>
        getWordLevel(
          flashcardWords[word.vocabularyId],
          vocabularyWords[word.vocabularyId]?.isKnown ?? false,
          ["reading"],
        ),
      ),
    [words, flashcardWords, vocabularyWords],
  );

  const learned = dots.filter((dot) => dot === 3).length;
  const total = words.length;
  const title = `Ступень ${index + 1}`;

  return (
    <StepAccordion
      title={title}
      learned={learned}
      total={total}
      expanded={expanded}
      onToggle={() => onToggle(index)}
      onStart={() => onStart(index)}
    >
      <ReadingGrid
        words={words}
        dots={dots}
        onSelect={onSelectWord}
        horizontalInset={outerInset + STEP_ACCORDION_INSET}
      />
    </StepAccordion>
  );
});
