// app/(tabs)/games/flashcards/sets.tsx
//
// Главный экран карточек. Сверху закреплены поиск (по всей базе) и вкладки;
// панель слова — общая для поиска и ступеней. Две вкладки одного экрана:
//   - «Ступени» — поиск, разделы HSK чипсами и ступени по 10 слов (StepsTab);
//   - «Мои наборы» — наборы, которые пользователь собирает сам.
// У карточки набора две кнопки: «Открыть» (страница набора) и «Тренировать».
// «Тренировать» (ступень, набор, «Повторение») открывает выбор режима (TrainingModeSheet).

import { CustomSetCard } from "@/components/flashcards/CustomSetCard";
import { SetTitleModal } from "@/components/flashcards/SetTitleModal";
import { SetWordRow } from "@/components/flashcards/SetWordRow";
import { TrainingModeSheet } from "@/components/flashcards/TrainingModeSheet";
import type { WordLevel } from "@/components/ui/LevelDots";
import {
  StepsTab,
  type StepJumpRequest,
} from "@/components/flashcards/StepsTab";
import { WordSheet } from "@/components/flashcards/WordSheet";
import { SearchField } from "@/components/ui/SearchField";
import type { Word } from "@/content/flashcards/types";
import { Screen } from "@/components/layout/Screen";
import { BackButton } from "@/components/ui/BackButton";
import { SegmentedTabs } from "@/components/ui/SegmentedTabs";
import { Title } from "@/components/ui/Title";
import { allWords, findWords } from "@/content/words/vocabulary";
import { useCustomSetsStore } from "@/store/customSetsStore";
import { READING_REVIEW_ID } from "@/utils/flashcards/source";
import { getWordLevel, useWordProgressStore } from "@/store/wordProgressStore";
import {
  describeStep,
  findWordStep,
  stepTrainingId,
  type ReadingLevel,
} from "@/utils/flashcards/steps";
import { searchWords } from "@/utils/searchWords";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, Text, View } from "react-native";

type FlashcardsTab = "steps" | "sets";

/** Строке результата поиска действие «добавить/убрать» не нужно. */
const noop = () => {};

const TABS = [
  { key: "steps" as const, label: "Ступени" },
  { key: "sets" as const, label: "Мои наборы" },
];

export default function FlashcardsHomeScreen() {
  const router = useRouter();

  const [tab, setTab] = useState<FlashcardsTab>("steps");
  const [isCreating, setIsCreating] = useState(false);

  const sets = useCustomSetsStore((state) => state.sets);
  const createSet = useCustomSetsStore((state) => state.createSet);

  // «Тренировать» сначала спрашивает режим: выбор перевода или самопроверка
  const [modeFor, setModeFor] = useState<string | null>(null);

  const startStep = useCallback(
    (level: ReadingLevel, index: number) =>
      setModeFor(stepTrainingId(level, index)),
    [],
  );

  const startReview = useCallback(() => setModeFor(READING_REVIEW_ID), []);

  // ── Поиск и панель слова ───────────────────────────────────────────────────

  const { t } = useTranslation();
  const flashcardWords = useWordProgressStore((state) => state.flashcardWords);
  const vocabularyWords = useWordProgressStore(
    (state) => state.vocabularyWords,
  );

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

  // Слово в панели и откуда его открыли (из поиска есть «Показать в ступени»)
  const [selected, setSelected] = useState<{
    word: Word;
    fromSearch: boolean;
  } | null>(null);
  const selectFromGrid = useCallback(
    (word: Word) => setSelected({ word, fromSearch: false }),
    [],
  );
  const selectFromSearch = useCallback(
    (word: Word) => setSelected({ word, fromSearch: true }),
    [],
  );
  const selectedStep = selected
    ? findWordStep(selected.word.vocabularyId)
    : null;

  const [jump, setJump] = useState<StepJumpRequest | null>(null);
  const showInStep = () => {
    if (!selectedStep) return;
    setSelected(null);
    setQuery("");
    setTab("steps");
    setJump({ ...selectedStep, nonce: Date.now() });
  };

  const openEditor = (setId: string) => {
    router.push({
      pathname: "/games/flashcards/edit/[setId]",
      params: { setId },
    });
  };

  return (
    <Screen>
      <View className="flex-row items-center justify-between">
        <BackButton href="/games" />

        <Title>Карточки</Title>

        {/* Пустое место под размер кнопки «назад»: заголовок по центру */}
        <View style={{ width: 40 }} />
      </View>

      {/* Сверху закреплены только поиск и вкладки — как в «Написании», поиск первым */}
      <SearchField
        value={query}
        onChangeText={setQuery}
        placeholder="Иероглиф, пиньинь или перевод"
        accessibilityLabel="Поиск слова"
        className="mt-3"
      />

      {!isSearching && (
        <SegmentedTabs
          tabs={TABS}
          value={tab}
          onChange={setTab}
          className="mt-3"
        />
      )}

      <WordSheet
        word={selected?.word ?? null}
        // Место слова — только для найденного поиском: из ступени оно и так видно
        location={
          selected?.fromSearch && selectedStep
            ? describeStep(selectedStep.level, selectedStep.index)
            : undefined
        }
        onShowInStep={
          selected?.fromSearch && selectedStep ? showInStep : undefined
        }
        onClose={() => setSelected(null)}
      />

      {/* Результаты поиска — по всей базе, поверх обеих вкладок:
          иероглиф, пиньинь и перевод, чтобы было видно, что нашлось */}
      {isSearching && (
        <FlatList
          data={results}
          keyExtractor={(word) => word.id}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 16, gap: 8 }}
          initialNumToRender={10}
          renderItem={({ item, index }) => (
            <SetWordRow
              word={item}
              action="open"
              level={resultDots[index] as WordLevel}
              onPress={noop}
              onOpenWord={selectFromSearch}
            />
          )}
          ListEmptyComponent={
            <Text className="font-nunito text-body text-text">
              Ничего не нашлось. Пиньинь можно писать без тонов: «nihao».
            </Text>
          }
        />
      )}

      <TrainingModeSheet
        setId={modeFor}
        onClose={() => setModeFor(null)}
      />

      <SetTitleModal
        visible={isCreating}
        heading="Новый набор"
        confirmLabel="Создать"
        onClose={() => setIsCreating(false)}
        onConfirm={(title) => {
          const setId = createSet(title);
          setIsCreating(false);
          // Сразу в редактор: пустой набор без слов бесполезен
          openEditor(setId);
        }}
      />

      {/* Обе вкладки остаются смонтированными, неактивная прячется:
          переключение мгновенное, прокрутка и раскрытые ступени сохраняются */}
      <View
        className="flex-1"
        style={{
          display: !isSearching && tab === "steps" ? "flex" : "none",
        }}
      >
        <StepsTab
          onStartStep={startStep}
          onStartReview={startReview}
          onSelectWord={selectFromGrid}
          jump={jump}
        />
      </View>

      {!isSearching && tab === "sets" && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 16, gap: 12 }}
        >
          {sets.length === 0 && (
            <View className="gap-2 rounded-2xl bg-surface p-5">
              <Text className="font-nunitoBold text-lead text-text">
                Здесь будут твои наборы
              </Text>
              <Text className="font-nunito text-body text-text">
                Собери слова, которые хочешь потренировать: из урока, сериала
                или просто те, что не запоминаются. Слова можно добавлять и
                убирать в любой момент.
              </Text>
            </View>
          )}

          {sets.map((set) => (
            <CustomSetCard
              key={set.id}
              title={set.title}
              words={findWords(set.wordIds)}
              onOpen={() => openEditor(set.id)}
              onStart={() => setModeFor(set.id)}
            />
          ))}

          <Pressable
            onPress={() => setIsCreating(true)}
            className="min-h-14 items-center justify-center rounded-2xl border border-dashed border-primary px-5 py-4 active:opacity-70"
            accessibilityRole="button"
          >
            <Text className="font-nunitoBold text-body text-primary">
              + Создать набор
            </Text>
          </Pressable>
        </ScrollView>
      )}
    </Screen>
  );
}
