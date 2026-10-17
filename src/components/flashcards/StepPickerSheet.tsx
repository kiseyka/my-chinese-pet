// src/components/flashcards/StepPickerSheet.tsx
//
// Панель «Добавить из тем» в редакторе набора:
//   - чипсы разделов HSK и названия тем (листаются вбок) — те же темы, что
//     в «Словаре» и на пути;
//   - сетка слов выбранной темы: тап добавляет слово в набор или убирает,
//     слова из набора — в зелёной рамке;
//   - «Выбрать все» у названия темы — все её слова, которых ещё нет в наборе;
//     если вся тема уже в наборе — «Убрать все»;
//   - «Готово» внизу закрывает панель (выбор сохраняется и при свайпе вниз).
// Тема, все слова которой уже в наборе, подсвечена.
// Сначала открыта текущая тема (первая, где есть неосвоенные слова).
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
  describeDictionaryLevel,
  getDictionaryGroups,
  getDictionaryLevels,
  type DictionaryLevel,
} from "@/utils/dictionary";
import { pluralWords } from "@/utils/writing/labels";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { LevelChips } from "./LevelChips";
import { ReadingGrid } from "./ReadingGrid";

/** Промежуток между чипсами тем. */
const STEP_CHIP_GAP = 8;

type ReadingLevel = DictionaryLevel;

/** Слова тем раздела (как в «Словаре»). */
function getLevelThemes(level: ReadingLevel) {
  return getDictionaryGroups(level);
}

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

/** Первый раздел и тема, где есть неосвоенные слова. */
function findCurrentStep(): { level: ReadingLevel; index: number } {
  for (const level of getDictionaryLevels()) {
    const index = getLevelThemes(level).findIndex((group) =>
      group.words.some((word) => readingDots(word) < 3),
    );
    if (index !== -1) return { level, index };
  }
  return { level: getDictionaryLevels()[0], index: 0 };
}

// ── Темы раздела ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

interface StepNumbersProps {
  titles: string[];
  active: number;
  /** Строка из «0» и «1»: какие темы уже целиком в наборе (так memo сравнивает дёшево). */
  completeMask: string;
  onSelect: (index: number) => void;
  scrollRef: React.RefObject<ScrollView | null>;
  /** Сюда пишется, где стоит каждый чипс (у тем разная ширина). */
  positions: React.MutableRefObject<number[]>;
}

const StepNumbers = memo(function StepNumbers({
  titles,
  active,
  completeMask,
  onSelect,
  scrollRef,
  positions,
}: StepNumbersProps) {
  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0 }}
      contentContainerStyle={{ gap: STEP_CHIP_GAP }}
    >
      {titles.map((title, index) => {
        const isActive = index === active;
        const complete = completeMask[index] === "1";

        return (
          <Pressable
            key={index}
            onPress={() => onSelect(index)}
            onLayout={(event) => {
              positions.current[index] = event.nativeEvent.layout.x;
            }}
            className={`h-10 items-center justify-center rounded-xl px-3 ${
              isActive
                ? "bg-primary"
                : complete
                  ? "bg-primary/20 active:opacity-70"
                  : "bg-surface active:opacity-70"
            }`}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`${title}${
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
              {title}
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
  const stepPositions = useRef<number[]>([]);

  const item = useMemo(() => (setId ? { setId } : null), [setId]);

  // При открытии — текущая тема и слова набора из стора
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
    // Панель появляется не сразу: ждём, пока чипсы тем отрисуются
    const timer = setTimeout(() => {
      stepsScroll.current?.scrollTo({
        x: Math.max((stepPositions.current[stepIndex] ?? 0) - 60, 0),
        animated: false,
      });
    }, 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, setId]);

  const themes = getLevelThemes(level);
  const steps = useMemo(() => themes.map((group) => group.words), [themes]);
  const titles = useMemo(() => themes.map((group) => group.title), [themes]);
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
      getDictionaryLevels().map((item) => ({
        key: item,
        label: describeDictionaryLevel(item),
      })),
    [],
  );

  return (
    <BottomSheet item={item} onClose={handleClose} onOpen={handleOpen}>
      {() => (
        <>
          <Text className="font-nunitoBold text-title text-text">
            Добавить из тем
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

          {/* Темы раздела */}
          <View className="mt-3">
            <StepNumbers
              titles={titles}
              active={stepIndex}
              completeMask={completeMask}
              onSelect={setStepIndex}
              scrollRef={stepsScroll}
              positions={stepPositions}
            />
          </View>

          {/* Слова темы. «Выбрать все» — маленькая кнопка у названия темы,
              чтобы её не путали с кнопкой «Готово» внизу */}
          <View className="mt-4 rounded-2xl bg-surface p-3">
            <View className="mb-2 min-h-10 flex-row items-center justify-between gap-2">
              <Text className="font-nunitoBold text-body text-text">
                {titles[stepIndex]}
              </Text>
              {missingIds.length > 0 ? (
                <Pressable
                  onPress={addAll}
                  hitSlop={8}
                  className="min-h-9 justify-center rounded-full border border-primary px-3 active:bg-primary/10"
                  accessibilityRole="button"
                  accessibilityLabel={`Выбрать все слова темы ${titles[stepIndex]}`}
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
                  accessibilityLabel={`Убрать все слова темы ${titles[stepIndex]} из набора`}
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
