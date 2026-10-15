// src/components/writing/home/WritingStepsTab.tsx
//
// Вкладка «Ступени» на экране «Написание» — в том же виде, что в карточках:
//   - сверху строки «Экзамен» и «Повторение» (если есть), затем чипсы разделов HSK;
//   - ступени раздела списком (FlatList — рисуются только видимые),
//     у каждой — «Тренировать» (1 новое слово + 2 повторения из этой ступени);
//   - всё прокручивается вместе: сверху на экране закреплены только поиск и вкладки.
// Все разделы открыты сразу. Разделы, в которые уже заходили, остаются в памяти
// и только прячутся. Прокрутка у всех разделов общая (useSharedScroll), поэтому
// шапка с чипсами при переключении стоит на месте.
//
// Сетку слов рисует экран (renderGrid): там точки письма, рамки «Повторения»
// и печати экзамена. renderGrid должен быть стабильным (useCallback) —
// иначе при каждом тапе по чипсу перерисовываются все ступени всех разделов.

import { LevelChips } from "@/components/flashcards/LevelChips";
import {
  STEP_ACCORDION_INSET,
  StepAccordion,
} from "@/components/ui/StepAccordion";
import type { Word } from "@/content/flashcards/types";
import {
  useSharedScroll,
  useSyncedScroll,
  type SharedScroll,
} from "@/hooks/useSharedLevelScroll";
import { useWordProgressStore } from "@/store/wordProgressStore";
import { getLevelSteps, getLevelStepsProgress } from "@/utils/writing/steps";
import {
  LEARNED_DOTS,
  NO_HSK_LEVEL,
  describeLevel,
  getAvailableLevels,
  getWordWritingDots,
  type WritingLevel,
} from "@/utils/writing/words";
import {
  memo,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { FlatList, View } from "react-native";

type RenderGrid = (words: Word[], inset: number) => ReactNode;

interface WritingStepsTabProps {
  /** Сетка слов ступени; inset — сколько ширины экрана не достаётся сетке. */
  renderGrid: RenderGrid;
  /** Блок над чипсами: «Экзамен» и «Повторение». */
  topCards: ReactNode;
  onStartStep: (level: WritingLevel, index: number) => void;
  /** Отступы экрана по бокам. */
  outerInset: number;
}

export function WritingStepsTab({
  renderGrid,
  topCards,
  onStartStep,
  outerInset,
}: WritingStepsTabProps) {
  const levels = useMemo(() => getAvailableLevels(), []);

  // Все разделы открыты сразу
  const firstHsk = levels.find((item) => item !== NO_HSK_LEVEL);

  const [level, setLevel] = useState<WritingLevel>(() => firstHsk ?? levels[0]);
  const shownLevel = useDeferredValue(level);

  // Разделы, в которые уже заходили: их списки держим смонтированными
  const [visited, setVisited] = useState<WritingLevel[]>(() => [level]);
  useEffect(() => {
    setVisited((previous) =>
      previous.includes(shownLevel) ? previous : [...previous, shownLevel],
    );
  }, [shownLevel]);
  const mounted = visited.includes(shownLevel)
    ? visited
    : [...visited, shownLevel];

  const chips = useMemo(
    () =>
      levels.map((item) => ({
        key: item,
        label: describeLevel(item),
      })),
    [levels],
  );

  const shared = useSharedScroll();

  // Чипсы ближе к ступеням (12); отступ под «Экзаменом» и «Повторением» — в topCards
  const renderHeader = useCallback(
    (visible: boolean) => (
      <View className="pb-3">
        {topCards}
        <LevelChips
          chips={chips}
          value={level}
          onChange={setLevel}
          shared={shared}
          active={visible}
        />
      </View>
    ),
    [topCards, chips, level, shared],
  );

  return (
    <View className="flex-1">
      {mounted.map((item) => (
        <WritingLevelSteps
          key={item}
          level={item}
          visible={item === shownLevel}
          renderHeader={renderHeader}
          renderGrid={renderGrid}
          onStartStep={onStartStep}
          outerInset={outerInset}
          shared={shared}
        />
      ))}
    </View>
  );
}

// ── Ступени одного раздела ───────────────────────────────────────────────────

interface WritingLevelStepsProps {
  level: WritingLevel;
  visible: boolean;
  renderHeader: (visible: boolean) => ReactElement;
  renderGrid: RenderGrid;
  onStartStep: (level: WritingLevel, index: number) => void;
  outerInset: number;
  shared: SharedScroll;
}

const WritingLevelSteps = memo(function WritingLevelSteps({
  level,
  visible,
  renderHeader,
  renderGrid,
  onStartStep,
  outerInset,
  shared,
}: WritingLevelStepsProps) {
  const flashcardWords = useWordProgressStore((state) => state.flashcardWords);
  const steps = getLevelSteps(level);

  // Изучено по ступеням (3 точки письма) — для шкалы в шапке ступени
  const learnedPerStep = useMemo(
    () =>
      steps.map(
        (words) =>
          words.filter(
            (word) => getWordWritingDots(word, flashcardWords) >= LEARNED_DOTS,
          ).length,
      ),
    [steps, flashcardWords],
  );

  // Сначала развёрнута текущая ступень
  const [expanded, setExpanded] = useState<Set<number>>(
    () => new Set([getLevelStepsProgress(level).currentIndex]),
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

  const listRef = useRef<FlatList<Word[]>>(null);
  const scroll = useSyncedScroll(listRef, visible, shared, "y");

  const renderItem = useCallback(
    ({ item: words, index }: { item: Word[]; index: number }) => (
      <WritingStepItem
        index={index}
        words={words}
        learned={learnedPerStep[index] ?? 0}
        expanded={expanded.has(index)}
        gridInset={outerInset + STEP_ACCORDION_INSET}
        renderGrid={renderGrid}
        onToggle={toggle}
        onStart={start}
      />
    ),
    [learnedPerStep, expanded, outerInset, renderGrid, toggle, start],
  );

  return (
    <FlatList
      ref={listRef}
      {...scroll}
      data={steps}
      keyExtractor={(_, index) => `${level}-${index}`}
      extraData={renderItem}
      style={{ display: visible ? "flex" : "none" }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingVertical: 12, gap: 12 }}
      initialNumToRender={5}
      maxToRenderPerBatch={5}
      windowSize={5}
      ListHeaderComponent={renderHeader(visible)}
      renderItem={renderItem}
    />
  );
});

// ── Одна ступень ─────────────────────────────────────────────────────────────
// memo: при тапе по чипсу или развороте другой ступени эта не перерисовывается.

interface WritingStepItemProps {
  index: number;
  words: Word[];
  learned: number;
  expanded: boolean;
  gridInset: number;
  renderGrid: RenderGrid;
  onToggle: (index: number) => void;
  onStart: (index: number) => void;
}

const WritingStepItem = memo(function WritingStepItem({
  index,
  words,
  learned,
  expanded,
  gridInset,
  renderGrid,
  onToggle,
  onStart,
}: WritingStepItemProps) {
  return (
    <StepAccordion
      title={`Ступень ${index + 1}`}
      learned={learned}
      total={words.length}
      expanded={expanded}
      onToggle={() => onToggle(index)}
      onStart={() => onStart(index)}
    >
      {expanded ? renderGrid(words, gridInset) : null}
    </StepAccordion>
  );
});
