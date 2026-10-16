// src/components/writing/home/WritingStepsTab.tsx
//
// Вкладка «Ступени» на экране «Написание» — карта пути:
//   - сверху строки «Экзамен» и «Повторение» (если есть), чипсы разделов HSK
//     и карточка «Продолжить» — она сразу запускает тренировку текущей ступени;
//   - ниже тропинка: каждая ступень (тема) — кружок с её иероглифом (PathNode).
//     Пройденные залиты, текущая крупнее и с кольцом, следующие — пунктиром.
//     Ничего не закрыто: тап по любой точке открывает экран темы (/games/writing/theme),
//     там сетка слов с точками и «Тренировать».
//   - всё прокручивается вместе: сверху на экране закреплены только поиск и вкладки.
// Все разделы открыты сразу. Разделы, в которые уже заходили, остаются в памяти
// и только прячутся. Прокрутка у всех разделов общая (useSharedScroll), поэтому
// шапка с чипсами при переключении стоит на месте.

import { LevelChips } from "@/components/flashcards/LevelChips";
import {
  useSharedScroll,
  useSyncedScroll,
  type SharedScroll,
} from "@/hooks/useSharedLevelScroll";
import { useWordProgressStore } from "@/store/wordProgressStore";
import {
  getLevelStepTitles,
  getLevelSteps,
  getLevelStepsProgress,
  getStepGlyph,
} from "@/utils/writing/steps";
import {
  NO_HSK_LEVEL,
  describeLevel,
  getAvailableLevels,
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
import {
  FlatList,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { PathNode, type PathNodeState } from "./PathNode";

interface WritingStepsTabProps {
  /** Блок над чипсами: «Экзамен» и «Повторение». */
  topCards: ReactNode;
  /** Запустить тренировку ступени («Продолжить»). */
  onStartStep: (level: WritingLevel, index: number) => void;
  /** Открыть экран темы (тап по точке на карте). */
  onOpenStep: (level: WritingLevel, index: number) => void;
  /** Отступы экрана по бокам. */
  outerInset: number;
}

export function WritingStepsTab({
  topCards,
  onStartStep,
  onOpenStep,
  outerInset,
}: WritingStepsTabProps) {
  const levels = useMemo(() => getAvailableLevels(), []);

  // Все разделы открыты сразу
  const firstHsk = levels.find((item) => item !== NO_HSK_LEVEL);

  const [level, setLevel] = useState<WritingLevel>(() => firstHsk ?? levels[0]);
  const shownLevel = useDeferredValue(level);

  // Разделы, в которые уже заходили: их карты держим смонтированными
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
        <WritingLevelPath
          key={item}
          level={item}
          visible={item === shownLevel}
          renderHeader={renderHeader}
          onStartStep={onStartStep}
          onOpenStep={onOpenStep}
          outerInset={outerInset}
          shared={shared}
        />
      ))}
    </View>
  );
}

// ── Карта одного раздела ─────────────────────────────────────────────────────

interface WritingLevelPathProps {
  level: WritingLevel;
  visible: boolean;
  renderHeader: (visible: boolean) => ReactElement;
  onStartStep: (level: WritingLevel, index: number) => void;
  onOpenStep: (level: WritingLevel, index: number) => void;
  outerInset: number;
  shared: SharedScroll;
}

interface PathItem {
  index: number;
  glyph: string;
  title: string;
  state: PathNodeState;
  started: number;
  total: number;
}

const WritingLevelPath = memo(function WritingLevelPath({
  level,
  visible,
  renderHeader,
  onStartStep,
  onOpenStep,
  outerInset,
  shared,
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

  const items = useMemo<PathItem[]>(
    () =>
      steps.map((words, index) => {
        const state = progress.steps[index];
        return {
          index,
          glyph: getStepGlyph(words),
          title: titles[index] ?? `Ступень ${index + 1}`,
          state:
            !progress.completed && index === progress.currentIndex
              ? "current"
              : state?.passed
                ? "passed"
                : "upcoming",
          started: state?.started ?? 0,
          total: words.length,
        };
      }),
    [steps, titles, progress],
  );

  const open = useCallback(
    (index: number) => onOpenStep(level, index),
    [level, onOpenStep],
  );

  const listRef = useRef<FlatList<PathItem>>(null);
  const scroll = useSyncedScroll(listRef, visible, shared, "y");

  const current = items[progress.currentIndex];

  const header = (
    <View>
      {renderHeader(visible)}
      <ContinueCard
        title={current?.title}
        completed={progress.completed}
        levelLabel={describeLevel(level)}
        onContinue={() => onStartStep(level, progress.currentIndex)}
      />
    </View>
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
        started={item.started}
        total={item.total}
        onPress={open}
      />
    ),
    [items.length, rowWidth, open],
  );

  return (
    <FlatList
      ref={listRef}
      {...scroll}
      data={items}
      keyExtractor={(item) => `${level}-${item.index}`}
      style={{ display: visible ? "flex" : "none" }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingTop: 12, paddingBottom: 32 }}
      initialNumToRender={8}
      maxToRenderPerBatch={8}
      windowSize={7}
      ListHeaderComponent={header}
      renderItem={renderItem}
    />
  );
});

// ── «Продолжить» ─────────────────────────────────────────────────────────────

interface ContinueCardProps {
  title?: string;
  completed: boolean;
  levelLabel: string;
  onContinue: () => void;
}

function ContinueCard({
  title,
  completed,
  levelLabel,
  onContinue,
}: ContinueCardProps) {
  if (!title) return null;

  return (
    <View className="mb-2 flex-row items-center gap-3 rounded-2xl bg-surface px-4 py-3">
      <View className="flex-1">
        <Text className="font-nunito text-caption text-textSecondary">
          {completed ? `${levelLabel} пройден` : "Сейчас"}
        </Text>
        <Text
          numberOfLines={1}
          className="font-nunitoBold text-lead text-text"
        >
          {completed ? "Все темы начаты" : title}
        </Text>
      </View>
      {!completed && (
        <Pressable
          onPress={onContinue}
          className="rounded-full bg-primary px-5 py-2.5 active:opacity-80"
          accessibilityRole="button"
          accessibilityLabel={`Продолжить: ${title}`}
        >
          <Text className="font-nunitoBold text-body text-white">
            Продолжить
          </Text>
        </Pressable>
      )}
    </View>
  );
}
