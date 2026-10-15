// src/components/flashcards/LevelSteps.tsx
//
// Ступени одного раздела HSK списком (FlatList).
// Список раздела, в который уже заходили, не размонтируется, а просто прячется
// (StepsTab) — поэтому повторное переключение на раздел мгновенное, а
// развёрнутые ступени и прокрутка сохраняются.
//
// jump — «показать ступень»: развернуть её и прокрутить к ней (из поиска).
// shared — общая прокрутка всех разделов: показанный раздел встаёт туда же,
// где был предыдущий, и шапка с чипсами не скачет.

import type { Word } from "@/content/flashcards/types";
import {
  useSyncedScroll,
  type SharedScroll,
} from "@/hooks/useSharedLevelScroll";
import { getWordLevel, useWordProgressStore } from "@/store/wordProgressStore";
import { getReadingSteps, type ReadingLevel } from "@/utils/flashcards/steps";
import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { FlatList, View } from "react-native";
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
  /**
   * Блок над ступенями, который прокручивается вместе с ними (повторение, чипсы HSK).
   * visible — этот раздел сейчас на экране (чипсам нужно для общей прокрутки).
   */
  renderHeader?: (visible: boolean) => ReactElement;
  /** Общая прокрутка всех разделов вкладки. */
  shared?: SharedScroll;
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
  renderHeader,
  shared,
}: LevelStepsProps) {
  const steps = getReadingSteps(level);

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
  const scroll = useSyncedScroll(listRef, visible, shared, "y");

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
      {...scroll}
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
      ListHeaderComponent={renderHeader?.(visible)}
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
