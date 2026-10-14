// src/components/flashcards/ReadingStepCard.tsx
//
// Карточка ступени карточек: шапка (стрелка, название, кнопка «Тренировать»),
// тонкая шкала «освоено / всего» и сворачиваемая сетка слов.
// «Тренировать» работает и у свёрнутой ступени.
//
// Точки считает сама карточка (подписана на стор): так при изменении прогресса
// перерисовываются только видимые карточки, а не весь раздел.

import type { Word } from "@/content/flashcards/types";
import { getWordLevel, useWordProgressStore } from "@/store/wordProgressStore";
import { memo, useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { ReadingGrid } from "./ReadingGrid";
import ChevronIcon from "@/assets/images/icons/chevron-right.svg";
import { colors } from "@/theme/colors";

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
      {/* Шапка. Разворачивает тап по стрелке, названию или шкале; кнопка
          «Тренировать» — отдельно, рядом, а не внутри: иначе при тапе
          по шапке она тоже «нажимается» (затемняется) */}
      <View className="gap-3 px-4 py-3">
        <View className="min-h-10 flex-row items-center gap-2">
          <Pressable
            onPress={() => onToggle(index)}
            hitSlop={{ top: 12, bottom: 12, left: 16 }}
            className="min-h-10 flex-1 flex-row items-center gap-2 active:opacity-60"
            accessibilityRole="button"
            accessibilityState={{ expanded }}
            accessibilityLabel={`${title}: освоено ${learned} из ${total}`}
          >
            {/* Стрелка: вправо — свёрнута, вниз — развёрнута */}
            <View
              style={{ transform: [{ rotate: expanded ? "90deg" : "0deg" }] }}
            >
              <ChevronIcon
                width={24}
                height={24}
                color={colors.primary}
                strokeWidth={2.5}
              />
            </View>
            <Text className="flex-1 font-nunitoBold text-body text-text">
              {title}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => onStart(index)}
            hitSlop={6}
            className="min-h-10 justify-center rounded-full bg-primary px-4 active:opacity-80"
            accessibilityRole="button"
            accessibilityLabel={`Тренировать: ${title}`}
          >
            <Text className="font-nunitoBold text-small text-white">
              Тренировать
            </Text>
          </Pressable>
        </View>

        {/* Тонкая шкала: освоено / всего. Тоже разворачивает */}
        <Pressable
          onPress={() => onToggle(index)}
          hitSlop={{ top: 8, bottom: 12 }}
          accessible={false}
        >
          <View className="h-1.5 overflow-hidden rounded-full bg-text/10">
            <View
              className="h-full rounded-full bg-primary"
              style={{ width: `${total > 0 ? (learned / total) * 100 : 0}%` }}
            />
          </View>
        </Pressable>
      </View>

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
