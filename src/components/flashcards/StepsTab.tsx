// src/components/flashcards/StepsTab.tsx
//
// Вкладка «Ступени» на экране карточек:
//   - поиск по всей базе (иероглиф, пиньинь без тонов, перевод), результаты — сеткой;
//   - чипсы разделов HSK: на экране всегда один раздел (все открыты сразу);
//   - ступени раздела (LevelSteps). Разделы, в которые уже заходили, остаются
//     в памяти и только прячутся — повторное переключение мгновенное.
// Над разделами — «Повторение» (ReadingReviewSheet).
// Сначала выбран текущий раздел — первый, где есть неосвоенные слова.
// Тап по слову открывает панель (WordSheet): перевод, где лежит слово, свои наборы.
// Из поиска в панели есть «Показать в ступени»: раздел, ступень и прокрутка к ней.

import { SearchField } from "@/components/ui/SearchField";
import type { Word } from "@/content/flashcards/types";
import { allWords } from "@/content/words/vocabulary";
import { getWordLevel, useWordProgressStore } from "@/store/wordProgressStore";
import {
  describeReadingLevel,
  describeStep,
  findWordStep,
  getReadingLevels,
  getReadingSteps,
  type ReadingLevel,
} from "@/utils/flashcards/steps";
import { getReadingReviewWords } from "@/utils/flashcards/source";
import { searchWords } from "@/utils/searchWords";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, View } from "react-native";
import { LevelChips } from "./LevelChips";
import { ReadingReviewCard, ReadingReviewSheet } from "./ReadingReviewSheet";
import { LevelSteps, type StepJump } from "./LevelSteps";
import { ReadingGrid } from "./ReadingGrid";
import { WordSheet } from "./WordSheet";

/** Отступы Screen по бокам: от них считается ширина ячеек сетки. */
const SCREEN_INSET = 32;

interface StepsTabProps {
  onStartStep: (level: ReadingLevel, index: number) => void;
  onStartReview: () => void;
}

/** Слово в панели и откуда его открыли. */
interface SelectedWord {
  word: Word;
  fromSearch: boolean;
}

function isLevelUnfinished(level: ReadingLevel): boolean {
  const { flashcardWords, vocabularyWords } = useWordProgressStore.getState();
  return getReadingSteps(level).some((words) =>
    words.some(
      (word) =>
        getWordLevel(
          flashcardWords[word.vocabularyId],
          vocabularyWords[word.vocabularyId]?.isKnown ?? false,
          ["reading"],
        ) < 3,
    ),
  );
}

export function StepsTab({ onStartStep, onStartReview }: StepsTabProps) {
  const { t } = useTranslation();

  const flashcardWords = useWordProgressStore((state) => state.flashcardWords);
  const vocabularyWords = useWordProgressStore(
    (state) => state.vocabularyWords,
  );

  const levels = getReadingLevels();

  // Текущий раздел при открытии экрана: первый, где есть неосвоенные слова
  const [level, setLevel] = useState<ReadingLevel>(
    () => levels.find(isLevelUnfinished) ?? levels[0],
  );
  // Чипс выделяется сразу, а тяжёлый первый показ раздела идёт следом (с отложенным значением)
  const shownLevel = useDeferredValue(level);

  // Разделы, в которые уже заходили: их списки держим смонтированными
  const [visited, setVisited] = useState<ReadingLevel[]>(() => [level]);
  useEffect(() => {
    setVisited((previous) =>
      previous.includes(shownLevel) ? previous : [...previous, shownLevel],
    );
  }, [shownLevel]);
  const mounted = visited.includes(shownLevel)
    ? visited
    : [...visited, shownLevel];

  const [jump, setJump] = useState<(StepJump & { level: ReadingLevel }) | null>(
    null,
  );

  const [selected, setSelected] = useState<SelectedWord | null>(null);
  // ── Повторение ─────────────────────────────────────────────────────────────

  const readingReview = useWordProgressStore((state) => state.readingReview);
  const reviewWords = useMemo(
    () => getReadingReviewWords(readingReview),
    [readingReview],
  );
  const [reviewOpen, setReviewOpen] = useState(false);

  const selectFromGrid = useCallback(
    (word: Word) => setSelected({ word, fromSearch: false }),
    [],
  );
  const selectFromSearch = useCallback(
    (word: Word) => setSelected({ word, fromSearch: true }),
    [],
  );

  // ── Поиск ──────────────────────────────────────────────────────────────────

  const [query, setQuery] = useState("");
  const isSearching = query.trim().length > 0;
  const results = useMemo(
    () => (isSearching ? searchWords(allWords, query, (key) => t(key)) : []),
    [isSearching, query, t],
  );
  const resultDots = useMemo(
    () =>
      results.map((word) =>
        getWordLevel(
          flashcardWords[word.vocabularyId],
          vocabularyWords[word.vocabularyId]?.isKnown ?? false,
          ["reading"],
        ),
      ),
    [results, flashcardWords, vocabularyWords],
  );

  // ── Панель слова ───────────────────────────────────────────────────────────

  const selectedStep = selected
    ? findWordStep(selected.word.vocabularyId)
    : null;

  const showInStep = () => {
    if (!selectedStep) return;
    setSelected(null);
    setQuery("");
    setLevel(selectedStep.level);
    setJump({
      level: selectedStep.level,
      index: selectedStep.index,
      nonce: Date.now(),
    });
  };

  const chips = useMemo(
    () =>
      levels.map((item) => ({ key: item, label: describeReadingLevel(item) })),
    [levels],
  );

  return (
    <View className="flex-1">
      <ReadingReviewSheet
        open={reviewOpen}
        words={reviewWords}
        onClose={() => setReviewOpen(false)}
        onSelectWord={(word) => {
          // Панель слова поверх панели повторения не открываем — сначала закрываем её
          setReviewOpen(false);
          setSelected({ word, fromSearch: false });
        }}
        onStart={() => {
          setReviewOpen(false);
          onStartReview();
        }}
      />

      <WordSheet
        word={selected?.word ?? null}
        location={
          selectedStep
            ? describeStep(selectedStep.level, selectedStep.index)
            : undefined
        }
        onShowInStep={
          selected?.fromSearch && selectedStep ? showInStep : undefined
        }
        onClose={() => setSelected(null)}
      />

      <SearchField
        value={query}
        onChangeText={setQuery}
        placeholder="Иероглиф, пиньинь или перевод"
        accessibilityLabel="Поиск слова"
        className="mt-3"
      />

      {isSearching && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingVertical: 16 }}
        >
          {results.length > 0 ? (
            <ReadingGrid
              words={results}
              dots={resultDots}
              onSelect={selectFromSearch}
              horizontalInset={SCREEN_INSET}
            />
          ) : (
            <Text className="font-nunito text-body text-text">
              Ничего не нашлось. Пиньинь можно писать без тонов: «nihao».
            </Text>
          )}
        </ScrollView>
      )}

      {/* Разделы прячем, а не убираем, пока идёт поиск: так не теряется прокрутка */}
      <View
        className="flex-1"
        style={{ display: isSearching ? "none" : "flex" }}
      >
        {/* Отступ снизу: при прокрутке ступени не прилипают к чипсам */}
        {/* Повторение — над разделами HSK */}
        <View className="mt-3">
          <ReadingReviewCard
            total={reviewWords.length}
            onPress={() => setReviewOpen(true)}
          />
        </View>

        <View className="mb-1 mt-3 pb-2">
          <LevelChips chips={chips} value={level} onChange={setLevel} />
        </View>

        {mounted.map((item) => (
          <LevelSteps
            key={item}
            level={item}
            visible={item === shownLevel}
            outerInset={SCREEN_INSET}
            jump={jump?.level === item ? jump : null}
            onStartStep={onStartStep}
            onSelectWord={selectFromGrid}
          />
        ))}
      </View>
    </View>
  );
}
