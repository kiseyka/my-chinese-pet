// src/components/writing/home/WritingStepsTab.tsx
//
// Вкладка «Путь» на экране «Написание» — карта пути на весь экран:
//   - тропинка: каждая ступень (тема) — точка с её иероглифом (PathNode);
//     ничего не закрыто, тап по любой точке открывает экран темы;
//   - в конце раздела — «Дальше: HSK 2»;
//   - внизу поверх карты две кнопки: «Повторение» (если есть слова)
//     и «Продолжить» — сразу запускает тренировку текущей темы.
// Раздел HSK выбирается в шапке экрана (level). Разделы, в которые уже заходили,
// остаются смонтированными и только прячутся — переключение мгновенное.

import ReviewIcon from "@/assets/images/icons/bookmark.svg";
import { useWordProgressStore } from "@/store/wordProgressStore";
import { colors } from "@/theme/colors";
import {
  getLevelStepTitles,
  getLevelSteps,
  getLevelStepsProgress,
  getStepGlyph,
} from "@/utils/writing/steps";
import {
  describeLevel,
  getAvailableLevels,
  type WritingLevel,
} from "@/utils/writing/words";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { PathNode, type PathNodeState } from "./PathNode";

/** Место под кнопками внизу, чтобы последняя точка не пряталась за ними. */
const BOTTOM_BAR_SPACE = 96;

interface WritingStepsTabProps {
  level: WritingLevel;
  onChangeLevel: (level: WritingLevel) => void;
  /** Запустить тренировку ступени («Продолжить»). */
  onStartStep: (level: WritingLevel, index: number) => void;
  /** Открыть экран темы (тап по точке на карте). */
  onOpenStep: (level: WritingLevel, index: number) => void;
  /** Сколько слов в «Повторении»: 0 — кнопки нет. */
  repeatCount: number;
  onOpenReview: () => void;
  /** Отступы экрана по бокам. */
  outerInset: number;
}

export function WritingStepsTab({
  level,
  onChangeLevel,
  onStartStep,
  onOpenStep,
  repeatCount,
  onOpenReview,
  outerInset,
}: WritingStepsTabProps) {
  const levels = useMemo(() => getAvailableLevels(), []);
  const nextLevel = levels[levels.indexOf(level) + 1];

  // Разделы, в которые уже заходили: их карты держим смонтированными
  const [visited, setVisited] = useState<WritingLevel[]>(() => [level]);
  useEffect(() => {
    setVisited((previous) =>
      previous.includes(level) ? previous : [...previous, level],
    );
  }, [level]);
  const mounted = visited.includes(level) ? visited : [...visited, level];

  // «Продолжить» видимого раздела
  const flashcardWords = useWordProgressStore((state) => state.flashcardWords);
  const progress = useMemo(
    () => getLevelStepsProgress(level, flashcardWords),
    [level, flashcardWords],
  );
  // Все темы начаты — «Продолжить» ведёт в первую не освоенную целиком
  const continueIndex = progress.completed
    ? progress.steps.findIndex((step) => step.learned < step.words.length)
    : progress.currentIndex;
  const continueTitle =
    continueIndex >= 0 ? getLevelStepTitles(level)[continueIndex] : undefined;

  return (
    <View className="flex-1">
      {mounted.map((item) => (
        <WritingLevelPath
          key={item}
          level={item}
          visible={item === level}
          nextLevel={item === level ? nextLevel : undefined}
          onChangeLevel={onChangeLevel}
          onOpenStep={onOpenStep}
          outerInset={outerInset}
        />
      ))}

      {/* Кнопки поверх карты */}
      <View
        className="absolute bottom-3 left-0 right-0 flex-row items-center gap-3"
        pointerEvents="box-none"
      >
        {repeatCount > 0 && (
          <Pressable
            onPress={onOpenReview}
            className="h-14 flex-row items-center gap-2 rounded-full border border-border bg-surface px-4 active:opacity-80"
            accessibilityRole="button"
            accessibilityLabel={`Повторение: ${repeatCount}`}
          >
            <ReviewIcon width={20} height={20} color={colors.primary} />
            <Text className="font-nunitoBold text-body text-text">
              {repeatCount}
            </Text>
          </Pressable>
        )}

        {continueTitle !== undefined && (
          <Pressable
            onPress={() => onStartStep(level, continueIndex)}
            className="h-14 flex-1 justify-center rounded-full bg-primary px-5 active:opacity-80"
            accessibilityRole="button"
            accessibilityLabel={`Продолжить: ${continueTitle}`}
          >
            <Text className="text-center font-nunitoBold text-body text-white">
              Продолжить
            </Text>
            <Text
              numberOfLines={1}
              className="text-center font-nunito text-caption text-white/80"
            >
              {continueTitle}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ── Карта одного раздела ─────────────────────────────────────────────────────

interface WritingLevelPathProps {
  level: WritingLevel;
  visible: boolean;
  /** Следующий раздел — кнопка «Дальше» в конце карты. */
  nextLevel?: WritingLevel;
  onChangeLevel: (level: WritingLevel) => void;
  onOpenStep: (level: WritingLevel, index: number) => void;
  outerInset: number;
}

interface PathItem {
  index: number;
  glyph: string;
  title: string;
  state: PathNodeState;
  nextReached: boolean;
  started: number;
  learned: number;
  total: number;
}

const WritingLevelPath = memo(function WritingLevelPath({
  level,
  visible,
  nextLevel,
  onChangeLevel,
  onOpenStep,
  outerInset,
}: WritingLevelPathProps) {
  const flashcardWords = useWordProgressStore((state) => state.flashcardWords);
  const { width } = useWindowDimensions();
  const rowWidth = width - outerInset;

  const steps = getLevelSteps(level);
  const titles = getLevelStepTitles(level);

  const progress = useMemo(
    () => getLevelStepsProgress(level, flashcardWords),
    [level, flashcardWords],
  );

  const items = useMemo<PathItem[]>(() => {
    const stateOf = (index: number): PathNodeState =>
      !progress.completed && index === progress.currentIndex
        ? "current"
        : progress.steps[index]?.passed
          ? "passed"
          : "upcoming";

    return steps.map((words, index) => {
      const step = progress.steps[index];
      return {
        index,
        glyph: getStepGlyph(words),
        title: titles[index] ?? `Ступень ${index + 1}`,
        state: stateOf(index),
        nextReached:
          index + 1 < steps.length && stateOf(index + 1) !== "upcoming",
        started: step?.started ?? 0,
        learned: step?.learned ?? 0,
        total: words.length,
      };
    });
  }, [steps, titles, progress]);

  const open = useCallback(
    (index: number) => onOpenStep(level, index),
    [level, onOpenStep],
  );

  const renderItem = useCallback(
    ({ item }: { item: PathItem }) => (
      <PathNode
        index={item.index}
        count={items.length}
        width={rowWidth}
        glyph={item.glyph}
        title={item.title}
        state={item.state}
        nextReached={item.nextReached}
        started={item.started}
        learned={item.learned}
        total={item.total}
        onPress={open}
      />
    ),
    [items.length, rowWidth, open],
  );

  const footer =
    nextLevel !== undefined ? (
      <Pressable
        onPress={() => onChangeLevel(nextLevel)}
        className="mt-6 self-center rounded-full border border-border bg-surface px-5 py-2.5 active:opacity-70"
        accessibilityRole="button"
      >
        <Text className="font-nunitoMedium text-body text-text">
          Дальше: {describeLevel(nextLevel)} →
        </Text>
      </Pressable>
    ) : null;

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => `${level}-${item.index}`}
      style={{ display: visible ? "flex" : "none" }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingTop: 8,
        paddingBottom: BOTTOM_BAR_SPACE,
      }}
      initialNumToRender={9}
      maxToRenderPerBatch={8}
      windowSize={7}
      renderItem={renderItem}
      ListFooterComponent={footer}
    />
  );
});
