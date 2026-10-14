// src/components/flashcards/StepPickerSheet.tsx
//
// Панель «Добавить из ступеней» в редакторе набора:
//   - чипсы разделов HSK и номера ступеней (листаются вбок);
//   - сетка слов выбранной ступени: тап добавляет слово в набор или убирает,
//     слова из набора — в зелёной рамке;
//   - «Добавить все» — все слова ступени, которых ещё нет в наборе.
// Номер ступени, все слова которой уже в наборе, подсвечен.
// Сначала открыта текущая ступень (первая, где есть неосвоенные слова).

import {
  BottomSheet,
  SHEET_HORIZONTAL_INSET,
} from "@/components/ui/BottomSheet";
import type { Word } from "@/content/flashcards/types";
import { useCustomSet, useCustomSetsStore } from "@/store/customSetsStore";
import { getWordLevel, useWordProgressStore } from "@/store/wordProgressStore";
import {
  describeReadingLevel,
  getReadingLevels,
  getReadingSteps,
  type ReadingLevel,
} from "@/utils/flashcards/steps";
import { pluralWords } from "@/utils/writing/labels";
import { useEffect, useMemo, useRef, useState } from "react";
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

export function StepPickerSheet({ setId, onClose }: StepPickerSheetProps) {
  const set = useCustomSet(setId ?? undefined);
  const toggleWord = useCustomSetsStore((state) => state.toggleWord);
  const addWords = useCustomSetsStore((state) => state.addWords);

  const flashcardWords = useWordProgressStore((state) => state.flashcardWords);
  const vocabularyWords = useWordProgressStore(
    (state) => state.vocabularyWords,
  );

  const [level, setLevel] = useState<ReadingLevel>(
    () => findCurrentStep().level,
  );
  const [stepIndex, setStepIndex] = useState(() => findCurrentStep().index);

  const stepsScroll = useRef<ScrollView>(null);

  // Прокрутить номера ступеней так, чтобы выбранный был виден
  const scrollToStep = (index: number, animated: boolean) => {
    stepsScroll.current?.scrollTo({
      x: Math.max(index * (STEP_CHIP_WIDTH + STEP_CHIP_GAP) - 60, 0),
      animated,
    });
  };

  // При открытии — текущая ступень
  const item = useMemo(() => (setId ? { setId } : null), [setId]);
  const handleOpen = () => {
    const current = findCurrentStep();
    setLevel(current.level);
    setStepIndex(current.index);
  };

  // После смены раздела или открытия — показать выбранный номер
  useEffect(() => {
    // Панель появляется не сразу: ждём, пока номера ступеней отрисуются
    const timer = setTimeout(() => scrollToStep(stepIndex, false), 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, setId]);

  const steps = getReadingSteps(level);
  const words = steps[stepIndex] ?? [];

  const inSet = useMemo(() => new Set(set?.wordIds ?? []), [set]);

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

  const missingIds = words
    .map((word) => word.vocabularyId)
    .filter((id) => !inSet.has(id));

  const levelChips = useMemo(
    () =>
      getReadingLevels().map((item) => ({
        key: item,
        label: describeReadingLevel(item),
      })),
    [],
  );

  return (
    <BottomSheet item={item} onClose={onClose} onOpen={handleOpen}>
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
              onChange={(next) => {
                setLevel(next);
                setStepIndex(0);
              }}
            />
          </View>

          {/* Номер ступени */}
          <ScrollView
            ref={stepsScroll}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0 }}
            contentContainerStyle={{ gap: STEP_CHIP_GAP }}
            className="mt-3"
          >
            {steps.map((stepWords, index) => {
              const active = index === stepIndex;
              const complete = stepWords.every((word) =>
                inSet.has(word.vocabularyId),
              );

              return (
                <Pressable
                  key={index}
                  onPress={() => setStepIndex(index)}
                  className={`h-10 items-center justify-center rounded-xl ${
                    active
                      ? "bg-primary"
                      : complete
                        ? "bg-primary/20 active:opacity-70"
                        : "bg-surface active:opacity-70"
                  }`}
                  style={{ width: STEP_CHIP_WIDTH }}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`Ступень ${index + 1}${
                    complete ? ", все слова в наборе" : ""
                  }`}
                >
                  <Text
                    className={`text-body ${
                      active
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

          {/* Слова ступени */}
          <View className="mt-4 rounded-2xl bg-surface p-3">
            <Text className="mb-2 font-nunitoBold text-body text-text">
              Ступень {stepIndex + 1}
            </Text>
            <ReadingGrid
              words={words}
              dots={dots}
              horizontalInset={SHEET_HORIZONTAL_INSET + 24}
              isMarked={(word) => inSet.has(word.vocabularyId)}
              actionHint="Добавить в набор или убрать"
              onSelect={(word) => {
                if (set) toggleWord(set.id, word.vocabularyId);
              }}
            />
          </View>

          {/* Добавить всю ступень */}
          <Pressable
            onPress={() => {
              if (set && missingIds.length > 0) addWords(set.id, missingIds);
            }}
            disabled={missingIds.length === 0}
            className={`mt-4 min-h-14 items-center justify-center rounded-2xl px-5 py-4 ${
              missingIds.length > 0
                ? "bg-primary active:opacity-80"
                : "bg-primary/20"
            }`}
            accessibilityRole="button"
            accessibilityState={{ disabled: missingIds.length === 0 }}
          >
            <Text
              className={`font-nunitoBold text-body ${
                missingIds.length > 0 ? "text-white" : "text-text"
              }`}
            >
              {missingIds.length === 0
                ? "Все слова ступени уже в наборе"
                : missingIds.length === words.length
                  ? `Добавить все ${words.length} ${pluralWords(words.length)}`
                  : `Добавить остальные ${missingIds.length} ${pluralWords(missingIds.length)}`}
            </Text>
          </Pressable>
        </>
      )}
    </BottomSheet>
  );
}
