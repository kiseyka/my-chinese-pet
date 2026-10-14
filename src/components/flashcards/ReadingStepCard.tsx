// src/components/flashcards/ReadingStepCard.tsx
//
// Карточка ступени карточек: шапка (название, «освоено / всего», кнопка ▶ и стрелка)
// и сворачиваемая сетка слов. ▶ запускает тренировку ступени и в свёрнутом виде.
//
// Точки считает сама карточка (подписана на стор): так при изменении прогресса
// перерисовываются только видимые карточки, а не весь раздел.

import type { Word } from "@/content/flashcards/types";
import { getWordLevel, useWordProgressStore } from "@/store/wordProgressStore";
import { memo, useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { ReadingGrid } from "./ReadingGrid";

/** Внутренний отступ карточки (px-4) с двух сторон: на столько сетке меньше места. */
export const READING_STEP_CARD_INSET = 32;

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
    <View className="rounded-2xl bg-surface">
      {/* Шапка: тап разворачивает; ▶ — отдельная кнопка */}
      <Pressable
        onPress={() => onToggle(index)}
        className="gap-3 py-3 pl-4 pr-2 active:opacity-70"
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${title}: освоено ${learned} из ${total}`}
      >
        <View className="flex-row items-center gap-2">
          <Text className="flex-1 font-nunitoBold text-body text-text">
            {title}
          </Text>
          <Text className="font-nunito text-small text-textSecondary">
            {learned}/{total}
          </Text>

          <Pressable
            onPress={() => onStart(index)}
            hitSlop={6}
            className="ml-2 h-10 w-10 items-center justify-center rounded-full bg-primary active:opacity-80"
            accessibilityRole="button"
            accessibilityLabel={`Тренировать: ${title}`}
          >
            <Text className="pl-0.5 font-nunitoBold text-body text-white">
              ▶
            </Text>
          </Pressable>

          <Text className="w-6 text-center font-nunito text-body text-textSecondary">
            {expanded ? "▴" : "▾"}
          </Text>
        </View>

        {/* Тонкая шкала: освоено / всего */}
        <View className="mr-2 h-1.5 overflow-hidden rounded-full bg-text/10">
          <View
            className="h-full rounded-full bg-primary"
            style={{ width: `${total > 0 ? (learned / total) * 100 : 0}%` }}
          />
        </View>
      </Pressable>

      {expanded && (
        <View className="px-4 pb-4">
          <ReadingGrid
            words={words}
            dots={dots}
            onSelect={onSelectWord}
            horizontalInset={outerInset + READING_STEP_CARD_INSET}
          />
        </View>
      )}
    </View>
  );
});
