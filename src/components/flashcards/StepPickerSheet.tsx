// src/components/flashcards/StepPickerSheet.tsx
//
// Панель «Добавить из ступеней» в редакторе набора:
//   - чипсы разделов HSK и номера ступеней (листаются вбок);
//   - сетка слов выбранной ступени: тап добавляет слово в набор или убирает,
//     слова из набора — в зелёной рамке;
//   - «Выбрать все» у названия ступени — все её слова, которых ещё нет в наборе;
//     если вся ступень уже в наборе — «Убрать все»;
//   - «Готово» внизу закрывает панель (выбор сохраняется и при свайпе вниз).
// Номер ступени, все слова которой уже в наборе, подсвечен.
// Сначала открыта текущая ступень (первая, где есть неосвоенные слова).
//
// Скорость: пока панель открыта, выбор живёт в локальном состоянии панели,
// а в набор (стор) записывается один раз — при закрытии. Иначе каждый тап
// сохранял бы набор на диск и перерисовывал список слов на экране под панелью.

import {
  BottomSheet,
  SHEET_HORIZONTAL_INSET,
} from "@/components/ui/BottomSheet";
import type { Word } from "@/content/flashcards/types";
import { useCustomSetsStore } from "@/store/customSetsStore";
import { getWordLevel, useWordProgressStore } from "@/store/wordProgressStore";
import {
  describeReadingLevel,
  getReadingLevels,
  getReadingSteps,
  type ReadingLevel,
} from "@/utils/flashcards/steps";
import { pluralWords } from "@/utils/writing/labels";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { LevelChips } from "./LevelChips";
import { ReadingGrid } from "./ReadingGrid";

/** Ширина номера ступени и промежуток: нужны, чтобы прокрутить к выбранному. */
const STEP_CHIP_WIDTH = 44;
const STEP_CHIP_GAP = 8;

interface StepPickerSheetProps {
  /** Набор, в который добавляем; null — панель закрыта. */
  setId: string | null;
  onClose: () => void;
}

function readingDots(word: Word): number {
  const { flashcardWords, vocabularyWords } = useWordProgressStore.getState();
  return getWordLevel(
    flashcardWords[word.vocabularyId],
    vocabularyWords[word.vocabularyId]?.isKnown ?? false,
    ["reading"],
  );
}

/** Первый раздел и ступень, где есть неосвоенные слова. */
function findCurrentStep(): { level: ReadingLevel; index: number } {
  for (const level of getReadingLevels()) {
    const index = getReadingSteps(level).findIndex((words) =>
      words.some((word) => readingDots(word) < 3),
    );
    if (index !== -1) return { level, index };
  }
  return { level: getReadingLevels()[0], index: 0 };
}

// ── Номера ступеней ──────────────────────────────────────────────────────────

interface StepNumbersProps {
  count: number;
  active: number;
  /** Строка из «0» и «1»: какие ступени уже целиком в наборе (так memo сравнивает дёшево). */
  completeMask: string;
  onSelect: (index: number) => void;
  scrollRef: React.RefObject<ScrollView | null>;
}

const StepNumbers = memo(function StepNumbers({
  count,
  active,
  completeMask,
  onSelect,
  scrollRef,
}: StepNumbersProps) {
  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0 }}
      contentContainerStyle={{ gap: STEP_CHIP_GAP }}
    >
      {Array.from({ length: count }, (_, index) => {
        const isActive = index === active;
        const complete = completeMask[index] === "1";

        return (
          <Pressable
            key={index}
            onPress={() => onSelect(index)}
            className={`h-10 items-center justify-center rounded-xl ${
              isActive
                ? "bg-primary"
                : complete
                  ? "bg-primary/20 active:opacity-70"
                  : "bg-surface active:opacity-70"
            }`}
            style={{ width: STEP_CHIP_WIDTH }}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`Ступень ${index + 1}${
              complete ? ", все слова в наборе" : ""
            }`}
          >
            <Text
              className={`text-body ${
                isActive
                  ? "font-nunitoBold text-white"
                  : "font-nunito text-text"
              }`}
            >
              {index + 1}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
});

/** «Готово», «Готово · добавлено 3 слова», «Готово · +3, −10». */
function doneLabel(added: number, removed: number): string {
  if (added > 0 && removed > 0) return `Готово · +${added}, −${removed}`;
  if (added > 0) return `Готово · добавлено ${added} ${pluralWords(added)}`;
  if (removed > 0) return `Готово · убрано ${removed} ${pluralWords(removed)}`;
  return "Готово";
}

// ── Панель ───────────────────────────────────────────────────────────────────

export function StepPickerSheet({ setId, onClose }: StepPickerSheetProps) {
  const setWords = useCustomSetsStore((state) => state.setWords);

  const flashcardWords = useWordProgressStore((state) => state.flashcardWords);
  const vocabularyWords = useWordProgressStore(
    (state) => state.vocabularyWords,
  );

  const [level, setLevel] = useState<ReadingLevel>(
    () => findCurrentStep().level,
  );
  const [stepIndex, setStepIndex] = useState(() => findCurrentStep().index);

  // Слова набора, пока панель открыта (по порядку добавления)
  const [ids, setIds] = useState<string[]>([]);
  const idsRef = useRef(ids);
  idsRef.current = ids;
  const changed = useRef(false);
  // Слова набора на момент открытия: чтобы показать «добавлено N»
  const [initialIds, setInitialIds] = useState<Set<string>>(new Set());

  const stepsScroll = useRef<ScrollView>(null);

  const item = useMemo(() => (setId ? { setId } : null), [setId]);

  // При открытии — текущая ступень и слова набора из стора
  const handleOpen = ({ setId: openedId }: { setId: string }) => {
    const current = findCurrentStep();
    setLevel(current.level);
    setStepIndex(current.index);

    const set = useCustomSetsStore
      .getState()
      .sets.find((item) => item.id === openedId);
    setIds(set?.wordIds ?? []);
    setInitialIds(new Set(set?.wordIds ?? []));
    changed.current = false;
  };

  // Записать выбор в набор (один раз)
  const flush = useCallback(() => {
    if (!changed.current || !setId) return;
    changed.current = false;
    setWords(setId, idsRef.current);
  }, [setId, setWords]);

  const handleClose = () => {
    flush();
    onClose();
  };

  // На случай ухода с экрана с открытой панелью
  useEffect(() => flush, [flush]);

  // После смены раздела или открытия — показать выбранный номер
  useEffect(() => {
    // Панель появляется не сразу: ждём, пока номера ступеней отрисуются
    const timer = setTimeout(() => {
      stepsScroll.current?.scrollTo({
        x: Math.max(stepIndex * (STEP_CHIP_WIDTH + STEP_CHIP_GAP) - 60, 0),
        animated: false,
      });
    }, 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, setId]);

  const steps = getReadingSteps(level);
  const words = steps[stepIndex] ?? [];

  const inSet = useMemo(() => new Set(ids), [ids]);

  const completeMask = useMemo(
    () =>
      steps
        .map((stepWords) =>
          stepWords.every((word) => inSet.has(word.vocabularyId)) ? "1" : "0",
        )
        .join(""),
    [steps, inSet],
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

  const addedCount = ids.filter((id) => !initialIds.has(id)).length;
  const removedCount = useMemo(() => {
    const current = new Set(ids);
    let count = 0;
    initialIds.forEach((id) => {
      if (!current.has(id)) count += 1;
    });
    return count;
  }, [ids, initialIds]);

  const missingIds = words
    .map((word) => word.vocabularyId)
    .filter((id) => !inSet.has(id));

  const toggle = useCallback((word: Word) => {
    changed.current = true;
    setIds((previous) =>
      previous.includes(word.vocabularyId)
        ? previous.filter((id) => id !== word.vocabularyId)
        : [...previous, word.vocabularyId],
    );
  }, []);

  const removeAll = () => {
    const stepIds = new Set(words.map((word) => word.vocabularyId));
    changed.current = true;
    setIds((previous) => previous.filter((id) => !stepIds.has(id)));
  };

  const addAll = () => {
    if (missingIds.length === 0) return;
    changed.current = true;
    setIds((previous) => [...previous, ...missingIds]);
  };

  const isMarked = useCallback(
    (word: Word) => inSet.has(word.vocabularyId),
    [inSet],
  );

  const changeLevel = useCallback((next: ReadingLevel) => {
    setLevel(next);
    setStepIndex(0);
  }, []);

  const levelChips = useMemo(
    () =>
      getReadingLevels().map((item) => ({
        key: item,
        label: describeReadingLevel(item),
      })),
    [],
  );

  return (
    <BottomSheet item={item} onClose={handleClose} onOpen={handleOpen}>
      {() => (
        <>
          <Text className="font-nunitoBold text-title text-text">
            Добавить из ступеней
          </Text>
          <Text className="mt-1 font-nunito text-small text-text opacity-70">
            Нажми на слово, чтобы добавить его в набор или убрать.
          </Text>

          {/* Раздел HSK */}
          <View className="mt-4">
            <LevelChips
              chips={levelChips}
              value={level}
              onChange={changeLevel}
            />
          </View>

          {/* Номер ступени */}
          <View className="mt-3">
            <StepNumbers
              count={steps.length}
              active={stepIndex}
              completeMask={completeMask}
              onSelect={setStepIndex}
              scrollRef={stepsScroll}
            />
          </View>

          {/* Слова ступени. «Выбрать все» — маленькая кнопка у названия ступени,
              чтобы её не путали с кнопкой «Готово» внизу */}
          <View className="mt-4 rounded-2xl bg-surface p-3">
            <View className="mb-2 min-h-10 flex-row items-center justify-between gap-2">
              <Text className="font-nunitoBold text-body text-text">
                Ступень {stepIndex + 1}
              </Text>
              {missingIds.length > 0 ? (
                <Pressable
                  onPress={addAll}
                  hitSlop={8}
                  className="min-h-9 justify-center rounded-full border border-primary px-3 active:bg-primary/10"
                  accessibilityRole="button"
                  accessibilityLabel={`Выбрать все слова ступени ${stepIndex + 1}`}
                >
                  <Text className="font-nunitoBold text-small text-primary">
                    {missingIds.length === words.length
                      ? "Выбрать все"
                      : `+ ещё ${missingIds.length}`}
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={removeAll}
                  hitSlop={8}
                  className="min-h-9 justify-center rounded-full border border-textSecondary px-3 active:bg-text/10"
                  accessibilityRole="button"
                  accessibilityLabel={`Убрать все слова ступени ${stepIndex + 1} из набора`}
                >
                  <Text className="font-nunitoBold text-small text-text">
                    Убрать все
                  </Text>
                </Pressable>
              )}
            </View>
            <ReadingGrid
              words={words}
              dots={dots}
              horizontalInset={SHEET_HORIZONTAL_INSET + 24}
              isMarked={isMarked}
              actionHint="Добавить в набор или убрать"
              onSelect={toggle}
            />
          </View>

          {/* Готово: закрывает панель и сохраняет выбор */}
          <Pressable
            onPress={handleClose}
            className="mt-4 min-h-14 items-center justify-center rounded-2xl bg-primary px-5 py-4 active:opacity-80"
            accessibilityRole="button"
          >
            <Text className="font-nunitoBold text-body text-white">
              {doneLabel(addedCount, removedCount)}
            </Text>
          </Pressable>
        </>
      )}
    </BottomSheet>
  );
}
