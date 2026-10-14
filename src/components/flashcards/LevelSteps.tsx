// src/components/flashcards/LevelSteps.tsx
//
// Ступени одного раздела HSK: сводка «освоено из» и список ступеней (FlatList).
// Список раздела, в который уже заходили, не размонтируется, а просто прячется
// (StepsTab) — поэтому повторное переключение на раздел мгновенное, а
// развёрнутые ступени и прокрутка сохраняются.
//
// jump — «показать ступень»: развернуть её и прокрутить к ней (из поиска).

import type { Word } from "@/content/flashcards/types";
import { getWordLevel, useWordProgressStore } from "@/store/wordProgressStore";
import { getReadingSteps, type ReadingLevel } from "@/utils/flashcards/steps";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { ReadingStepCard } from "./ReadingStepCard";

export interface StepJump {
  index: number;
  /** Меняется при каждом прыжке, даже к той же ступени. */
  nonce: number;
}

interface LevelStepsProps {
  level: ReadingLevel;
  visible: boolean;
  /** Отступы экрана по бокам (для ширины сетки). */
  outerInset: number;
  jump: StepJump | null;
  onStartStep: (level: ReadingLevel, index: number) => void;
  onSelectWord: (word: Word) => void;
}

function dotsOf(word: Word): number {
  const { flashcardWords, vocabularyWords } = useWordProgressStore.getState();
  return getWordLevel(
    flashcardWords[word.vocabularyId],
    vocabularyWords[word.vocabularyId]?.isKnown ?? false,
    ["reading"],
  );
}

/** Первая ступень раздела, где есть неосвоенные слова (или первая). */
function currentStepIndex(steps: Word[][]): number {
  const index = steps.findIndex((words) =>
    words.some((word) => dotsOf(word) < 3),
  );
  return Math.max(index, 0);
}

export const LevelSteps = memo(function LevelSteps({
  level,
  visible,
  outerInset,
  jump,
  onStartStep,
  onSelectWord,
}: LevelStepsProps) {
  const steps = getReadingSteps(level);

  const flashcardWords = useWordProgressStore((state) => state.flashcardWords);
  const vocabularyWords = useWordProgressStore(
    (state) => state.vocabularyWords,
  );

  // Сводка раздела. Пока раздел спрятан, не пересчитываем
  const summary = useMemo(() => {
    if (!visible) return null;
    let learned = 0;
    let total = 0;
    for (const words of steps) {
      for (const word of words) {
        total += 1;
        const dots = getWordLevel(
          flashcardWords[word.vocabularyId],
          vocabularyWords[word.vocabularyId]?.isKnown ?? false,
          ["reading"],
        );
        if (dots === 3) learned += 1;
      }
    }
    return { learned, total };
  }, [visible, steps, flashcardWords, vocabularyWords]);

  // Сначала развёрнута текущая ступень
  const [expanded, setExpanded] = useState<Set<number>>(
    () => new Set([currentStepIndex(steps)]),
  );

  const toggle = useCallback(
    (index: number) =>
      setExpanded((previous) => {
        const next = new Set(previous);
        if (next.has(index)) next.delete(index);
        else next.add(index);
        return next;
      }),
    [],
  );

  const start = useCallback(
    (index: number) => onStartStep(level, index),
    [level, onStartStep],
  );

  // ── Прыжок к ступени ───────────────────────────────────────────────────────

  const listRef = useRef<FlatList<Word[]>>(null);

  useEffect(() => {
    if (!jump) return;

    setExpanded((previous) => new Set(previous).add(jump.index));
    // Ждём, пока список покажется и развернёт ступень
    const timer = setTimeout(() => {
      listRef.current?.scrollToIndex({
        index: jump.index,
        viewPosition: 0,
        animated: true,
      });
    }, 100);
    return () => clearTimeout(timer);
  }, [jump]);

  return (
    <FlatList
      ref={listRef}
      data={steps}
      keyExtractor={(_, index) => `${level}-${index}`}
      extraData={expanded}
      // Спрятанный раздел остаётся в памяти, но не занимает место
      style={{ display: visible ? "flex" : "none" }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingVertical: 12, gap: 12 }}
      initialNumToRender={5}
      maxToRenderPerBatch={5}
      windowSize={5}
      onScrollToIndexFailed={(info) => {
        // Ступень ещё не измерена: прокручиваем примерно, потом точно
        listRef.current?.scrollToOffset({
          offset: info.averageItemLength * info.index,
          animated: false,
        });
        setTimeout(() => {
          listRef.current?.scrollToIndex({
            index: info.index,
            viewPosition: 0,
            animated: true,
          });
        }, 150);
      }}
      ListHeaderComponent={
        summary ? (
          <Text className="font-nunito text-small text-textSecondary">
            Освоено {summary.learned} из {summary.total}
          </Text>
        ) : null
      }
      renderItem={({ item, index }) => (
        <ReadingStepCard
          index={index}
          words={item}
          expanded={expanded.has(index)}
          outerInset={outerInset}
          onToggle={toggle}
          onStart={start}
          onSelectWord={onSelectWord}
        />
      )}
      ListFooterComponent={<View className="h-2" />}
    />
  );
});
