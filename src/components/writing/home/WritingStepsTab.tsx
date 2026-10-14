// src/components/writing/home/WritingStepsTab.tsx
//
// Вкладка «Ступени» на экране «Написание» — в том же виде, что в карточках:
//   - сверху «Экзамен» и «Повторение» (если есть), затем чипсы разделов HSK;
//   - ступени раздела списком (FlatList — рисуются только видимые),
//     у каждой — «Тренировать» (1 новое слово + 2 повторения из этой ступени);
//   - всё прокручивается вместе: сверху на экране закреплены только поиск и вкладки.
// Разделы, в которые уже заходили, остаются в памяти и только прячутся.
// Закрытые разделы HSK (пока не пройден предыдущий) показывают карточку «закрыт».
//
// Сетку слов рисует экран (renderGrid): там точки письма, рамки «Повторения»
// и печати экзамена.

import { LevelChips } from "@/components/flashcards/LevelChips";
import {
  STEP_ACCORDION_INSET,
  StepAccordion,
} from "@/components/ui/StepAccordion";
import type { Word } from "@/content/flashcards/types";
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
  useState,
  type ReactNode,
} from "react";
import { FlatList, Text, View } from "react-native";
import { LockedLevelCard } from "./LevelSections";

interface WritingStepsTabProps {
  /** Сетка слов ступени; inset — сколько ширины экрана не достаётся сетке. */
  renderGrid: (words: Word[], inset: number) => ReactNode;
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
  const hskLevels = levels.filter((level) => level !== NO_HSK_LEVEL);

  // Пока финалов ступеней нет, из HSK открыт только первый раздел; «Другие слова» открыты
  const openLevel = hskLevels[0];
  const isLocked = (level: WritingLevel) =>
    level !== NO_HSK_LEVEL && level !== openLevel;

  const [level, setLevel] = useState<WritingLevel>(
    () => openLevel ?? levels[0],
  );
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
        label: isLocked(item)
          ? `${describeLevel(item)} 🔒`
          : describeLevel(item),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [levels],
  );

  // Повторение и экзамен отделены крупно (32), чипсы ближе к ступеням (12)
  const header = (
    <View className="pb-3">
      {topCards}
      <LevelChips chips={chips} value={level} onChange={setLevel} />
    </View>
  );

  return (
    <View className="flex-1">
      {mounted.map((item) => (
        <WritingLevelSteps
          key={item}
          level={item}
          visible={item === shownLevel}
          locked={isLocked(item)}
          openLevel={openLevel}
          header={header}
          renderGrid={renderGrid}
          onStartStep={onStartStep}
          outerInset={outerInset}
        />
      ))}
    </View>
  );
}

// ── Ступени одного раздела ───────────────────────────────────────────────────

interface WritingLevelStepsProps {
  level: WritingLevel;
  visible: boolean;
  locked: boolean;
  /** Открытый раздел HSK — для текста «откроется, когда пройдёшь …». */
  openLevel: WritingLevel | undefined;
  header: ReactNode;
  renderGrid: (words: Word[], inset: number) => ReactNode;
  onStartStep: (level: WritingLevel, index: number) => void;
  outerInset: number;
}

const WritingLevelSteps = memo(function WritingLevelSteps({
  level,
  visible,
  locked,
  openLevel,
  header,
  renderGrid,
  onStartStep,
  outerInset,
}: WritingLevelStepsProps) {
  const flashcardWords = useWordProgressStore((state) => state.flashcardWords);
  const steps = getLevelSteps(level);

  // Изучено по ступеням (3 точки письма)
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
  const learned = learnedPerStep.reduce((sum, count) => sum + count, 0);
  const total = steps.reduce((sum, words) => sum + words.length, 0);

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

  return (
    <FlatList
      data={locked ? [] : steps}
      keyExtractor={(_, index) => `${level}-${index}`}
      extraData={[expanded, learnedPerStep, renderGrid]}
      style={{ display: visible ? "flex" : "none" }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingVertical: 12, gap: 12 }}
      initialNumToRender={5}
      maxToRenderPerBatch={5}
      windowSize={5}
      ListHeaderComponent={
        <View>
          {header}
          {locked ? (
            openLevel !== undefined && (
              <LockedLevelCard level={level} currentLevel={openLevel} />
            )
          ) : (
            <Text className="font-nunito text-small text-textSecondary">
              Изучено {learned} из {total}
            </Text>
          )}
        </View>
      }
      renderItem={({ item: words, index }) => (
        <StepAccordion
          title={`Ступень ${index + 1}`}
          learned={learnedPerStep[index] ?? 0}
          total={words.length}
          expanded={expanded.has(index)}
          onToggle={() => toggle(index)}
          onStart={() => onStartStep(level, index)}
        >
          {renderGrid(words, outerInset + STEP_ACCORDION_INSET)}
        </StepAccordion>
      )}
    />
  );
});
