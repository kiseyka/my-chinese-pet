// src/components/flashcards/StepsTab.tsx
//
// Вкладка «Ступени» на экране карточек:
//   - поиск по всей базе (иероглиф, пиньинь без тонов, перевод), результаты — сеткой;
//   - чипсы разделов HSK: на экране всегда один раздел (все открыты сразу);
//   - сводка раздела и список ступеней (FlatList: рисуются только видимые).
// Сначала выбран текущий раздел — первый, где есть неосвоенные слова, — и в нём
// развёрнута текущая ступень. ▶ в шапке ступени запускает тренировку.
// Тап по слову открывает панель с переводом и своими наборами (WordSheet).

import { SearchField } from "@/components/ui/SearchField";
import type { Word } from "@/content/flashcards/types";
import { allWords } from "@/content/words/vocabulary";
import { getWordLevel, useWordProgressStore } from "@/store/wordProgressStore";
import {
  describeReadingLevel,
  getReadingLevels,
  getReadingSteps,
  type ReadingLevel,
} from "@/utils/flashcards/steps";
import { searchWords } from "@/utils/searchWords";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, ScrollView, Text, View } from "react-native";
import { LevelChips } from "./LevelChips";
import { ReadingGrid } from "./ReadingGrid";
import { ReadingStepCard } from "./ReadingStepCard";
import { WordSheet } from "./WordSheet";

/** Отступы Screen по бокам: от них считается ширина ячеек сетки. */
const SCREEN_INSET = 32;

interface StepsTabProps {
  onStartStep: (level: ReadingLevel, index: number) => void;
}

type ProgressMaps = {
  flashcardWords: ReturnType<
    typeof useWordProgressStore.getState
  >["flashcardWords"];
  vocabularyWords: ReturnType<
    typeof useWordProgressStore.getState
  >["vocabularyWords"];
};

function dotsOf(word: Word, maps: ProgressMaps): number {
  return getWordLevel(
    maps.flashcardWords[word.vocabularyId],
    maps.vocabularyWords[word.vocabularyId]?.isKnown ?? false,
    ["reading"],
  );
}

/** Первая ступень раздела, где есть неосвоенные слова (или первая). */
function currentStepIndex(level: ReadingLevel, maps: ProgressMaps): number {
  const index = getReadingSteps(level).findIndex((words) =>
    words.some((word) => dotsOf(word, maps) < 3),
  );
  return Math.max(index, 0);
}

export function StepsTab({ onStartStep }: StepsTabProps) {
  const { t } = useTranslation();

  const flashcardWords = useWordProgressStore((state) => state.flashcardWords);
  const vocabularyWords = useWordProgressStore(
    (state) => state.vocabularyWords,
  );

  const levels = getReadingLevels();

  // Текущий раздел при открытии экрана: первый, где есть неосвоенные слова
  const [level, setLevel] = useState<ReadingLevel>(() => {
    const maps = useWordProgressStore.getState();
    return (
      levels.find((item) =>
        getReadingSteps(item).some((words) =>
          words.some((word) => dotsOf(word, maps) < 3),
        ),
      ) ?? levels[0]
    );
  });

  // Развёрнутые ступени по разделам. Раздела ещё нет в записи — развёрнута его текущая ступень
  const [expandedByLevel, setExpandedByLevel] = useState<
    Record<number, number[]>
  >({});

  const expanded = useMemo(
    () =>
      new Set(
        expandedByLevel[level] ?? [
          currentStepIndex(level, useWordProgressStore.getState()),
        ],
      ),
    [expandedByLevel, level],
  );

  const toggleStep = useCallback(
    (index: number) =>
      setExpandedByLevel((previous) => {
        const current = new Set(
          previous[level] ?? [
            currentStepIndex(level, useWordProgressStore.getState()),
          ],
        );
        if (current.has(index)) current.delete(index);
        else current.add(index);
        return { ...previous, [level]: Array.from(current) };
      }),
    [level],
  );

  const startStep = useCallback(
    (index: number) => onStartStep(level, index),
    [level, onStartStep],
  );

  const [selected, setSelected] = useState<Word | null>(null);

  // ── Поиск ──────────────────────────────────────────────────────────────────

  const [query, setQuery] = useState("");
  const isSearching = query.trim().length > 0;
  const results = useMemo(
    () => (isSearching ? searchWords(allWords, query, (key) => t(key)) : []),
    [isSearching, query, t],
  );
  const resultDots = useMemo(
    () =>
      results.map((word) => dotsOf(word, { flashcardWords, vocabularyWords })),
    [results, flashcardWords, vocabularyWords],
  );

  // ── Раздел ─────────────────────────────────────────────────────────────────

  const steps = getReadingSteps(level);

  // Сводка только по выбранному разделу
  const { learned, total } = useMemo(() => {
    const maps = { flashcardWords, vocabularyWords };
    let learnedCount = 0;
    let totalCount = 0;
    for (const words of steps) {
      for (const word of words) {
        totalCount += 1;
        if (dotsOf(word, maps) === 3) learnedCount += 1;
      }
    }
    return { learned: learnedCount, total: totalCount };
  }, [steps, flashcardWords, vocabularyWords]);

  const chips = useMemo(
    () =>
      levels.map((item) => ({ key: item, label: describeReadingLevel(item) })),
    [levels],
  );

  return (
    <View className="flex-1">
      <WordSheet word={selected} onClose={() => setSelected(null)} />

      <SearchField
        value={query}
        onChangeText={setQuery}
        placeholder="Иероглиф, пиньинь или перевод"
        accessibilityLabel="Поиск слова"
        className="mt-3"
      />

      {isSearching ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingVertical: 16 }}
        >
          {results.length > 0 ? (
            <ReadingGrid
              words={results}
              dots={resultDots}
              onSelect={setSelected}
              horizontalInset={SCREEN_INSET}
            />
          ) : (
            <Text className="font-nunito text-body text-text">
              Ничего не нашлось. Пиньинь можно писать без тонов: «nihao».
            </Text>
          )}
        </ScrollView>
      ) : (
        <>
          <View className="mt-3">
            <LevelChips chips={chips} value={level} onChange={setLevel} />
          </View>

          <FlatList
            // Новый раздел — новый список (и прокрутка с начала)
            key={level}
            data={steps}
            keyExtractor={(_, index) => `${level}-${index}`}
            extraData={expanded}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingVertical: 12, gap: 12 }}
            initialNumToRender={6}
            windowSize={7}
            ListHeaderComponent={
              <Text className="font-nunito text-small text-textSecondary">
                Освоено {learned} из {total}
              </Text>
            }
            renderItem={({ item, index }) => (
              <ReadingStepCard
                index={index}
                words={item}
                expanded={expanded.has(index)}
                outerInset={SCREEN_INSET}
                onToggle={toggleStep}
                onStart={startStep}
                onSelectWord={setSelected}
              />
            )}
          />
        </>
      )}
    </View>
  );
}
