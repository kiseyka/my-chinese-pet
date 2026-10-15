// app/(tabs)/games/writing/sets.tsx
//
// Главный экран режима «Написание» — устроен так же, как экран карточек:
//   - сверху закреплены поиск (иероглиф, пиньинь без тонов, перевод) и вкладки;
//   - «Ступени»: строки «Экзамен» и «Повторение», чипсы разделов HSK и ступени
//     с кнопкой «Тренировать» (WritingStepsTab);
//   - «Мои наборы»: те же наборы, что в карточках, — «Открыть», «Тренировать»,
//     создание и редактирование (редактор общий с карточками).
// Нажатие на слово открывает выбор: что писать, в каком формате, «Повторять» и экзамен.
// Поиск — списком (иероглиф, пиньинь, перевод), как в карточках; у найденного слова
// в окне видно, где оно лежит, и есть «Показать» ступень.
//
// Данные и действия — в useWritingHome; здесь только раскладка.

import { SetTitleModal } from "@/components/flashcards/SetTitleModal";
import { SetWordRow } from "@/components/flashcards/SetWordRow";
import type { WordLevel } from "@/components/ui/LevelDots";
import { Screen } from "@/components/layout/Screen";
import { BackButton } from "@/components/ui/BackButton";
import { SHEET_HORIZONTAL_INSET } from "@/components/ui/BottomSheet";
import { SearchField } from "@/components/ui/SearchField";
import { SegmentedTabs } from "@/components/ui/SegmentedTabs";
import { Title } from "@/components/ui/Title";
import { ExamEntryCard } from "@/components/writing/home/ExamEntryCard";
import { ReviewCard } from "@/components/writing/home/ReviewCard";
import { WordGrid } from "@/components/writing/home/WordGrid";
import {
  WritingStepsTab,
  type WritingStepJump,
} from "@/components/writing/home/WritingStepsTab";
import { ExamModal } from "@/components/writing/modals/ExamModal";
import { PracticeChoiceModal } from "@/components/writing/modals/PracticeChoiceModal";
import { ReviewModal } from "@/components/writing/modals/ReviewModal";
import {
  SetSheet,
  WritingSetsTab,
} from "@/components/writing/modals/SetsModal";
import type { Word } from "@/content/flashcards/types";
import { useWritingHome } from "@/hooks/writing/useWritingHome";
import { useCustomSetsStore } from "@/store/customSetsStore";
import { REPEAT_LESSON_SIZE } from "@/utils/writing/plans";
import {
  describeWritingStep,
  findWritingWordStep,
} from "@/utils/writing/steps";
import type { WritingLevel } from "@/utils/writing/words";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { FlatList, Text, View } from "react-native";

/** Отступы Screen по бокам: от них считается ширина ячеек сетки. */
const SCREEN_INSET = 32;

type WritingTab = "steps" | "sets";

/** Строке результата поиска действие «добавить/убрать» не нужно. */
const noop = () => {};

const TABS = [
  { key: "steps" as const, label: "Ступени" },
  { key: "sets" as const, label: "Мои наборы" },
];

export default function WritingHomeScreen() {
  const home = useWritingHome();
  const router = useRouter();
  const { examQueue, repeatWords } = home;

  const [tab, setTab] = useState<WritingTab>("steps");

  // «Мои наборы» — те же, что в карточках
  const customSets = useCustomSetsStore((state) => state.sets);
  const [openedSetId, setOpenedSetId] = useState<string | null>(null);
  const openedSet = customSets.find((set) => set.id === openedSetId) ?? null;

  /**
   * Сетка слов. inset — сколько ширины экрана не достаётся сетке
   * (отступы экрана, карточки или панели).
   */
  const grid = (
    words: Word[],
    inset = SCREEN_INSET,
    onSelect: (word: Word) => void = home.setSelected,
  ) => (
    <WordGrid
      words={words}
      getLevel={home.getLevel}
      onSelect={onSelect}
      isMarked={home.isInReview}
      getExamMark={home.getExamMark}
      horizontalInset={inset}
    />
  );

  // Сетка ступени — стабильная функция: иначе тап по чипсу перерисовывает все ступени
  const { getLevel, isInReview, getExamMark, setSelected } = home;
  const renderStepGrid = useCallback(
    (words: Word[], inset: number) => (
      <WordGrid
        words={words}
        getLevel={getLevel}
        onSelect={setSelected}
        isMarked={isInReview}
        getExamMark={getExamMark}
        horizontalInset={inset}
      />
    ),
    [getLevel, isInReview, getExamMark, setSelected],
  );

  const startStep = useCallback(
    (level: WritingLevel, index: number) =>
      router.push({
        pathname: "/games/writing/step" as any,
        params: { level: String(level), index: String(index) },
      }),
    [router],
  );

  // ── Слово из поиска: где лежит и «Показать» ────────────────────────────────

  const selectedStep =
    home.selected && home.selectedFromSearch
      ? findWritingWordStep(home.selected.vocabularyId)
      : null;
  const [jump, setJump] = useState<WritingStepJump | null>(null);
  const showInStep = () => {
    if (!selectedStep) return;
    home.setSelected(null);
    home.setQuery("");
    setTab("steps");
    setJump({ ...selectedStep, nonce: Date.now() });
  };

  const createSet = useCustomSetsStore((state) => state.createSet);
  const [isCreating, setIsCreating] = useState(false);

  // Редактор набора — тот же, что в карточках; «назад» вернёт сюда
  const openEditor = (setId: string) =>
    router.push({
      pathname: "/games/flashcards/edit/[setId]",
      params: { setId, from: "writing" },
    });

  const startSet = (setId: string) => {
    setOpenedSetId(null);
    router.push({
      pathname: "/games/writing/set" as any,
      params: { setId },
    });
  };

  // «Экзамен» и «Повторение» над чипсами — компактные строки, как в карточках
  const readyCount = examQueue.ready.length;
  const nextExamAt = examQueue.upcoming[0]?.availableAt;
  const repeatCount = repeatWords.length;
  const { now, setExamOpen, setReviewOpen } = home;
  const topCards = useMemo(() => {
    const hasExam = readyCount > 0 || nextExamAt !== undefined;
    if (!hasExam && repeatCount === 0) return null;
    return (
      <View className="mb-4 gap-2">
        <ExamEntryCard
          readyCount={readyCount}
          nextAvailableAt={nextExamAt}
          now={now}
          onPress={() => setExamOpen(true)}
        />
        {repeatCount > 0 && (
          <ReviewCard total={repeatCount} onPress={() => setReviewOpen(true)} />
        )}
      </View>
    );
  }, [readyCount, nextExamAt, repeatCount, now, setExamOpen, setReviewOpen]);

  return (
    <Screen>
      <View className="flex-row items-center justify-between">
        <BackButton href="/games" />
        <Title>Написание</Title>
        <View style={{ width: 40 }} />
      </View>

      <PracticeChoiceModal
        word={home.selected}
        characters={home.selectedCharacters}
        getLevel={home.getLevel}
        isInReview={home.isInReview}
        onToggleReview={home.toggleReview}
        getExamStatus={home.getExamStatus}
        now={home.now}
        onStartExam={(word) => home.startExam([word])}
        onStart={home.startPractice}
        location={
          selectedStep
            ? describeWritingStep(selectedStep.level, selectedStep.index)
            : undefined
        }
        onShowInStep={selectedStep ? showInStep : undefined}
        onClose={() => home.setSelected(null)}
      />

      <ExamModal
        open={home.examOpen}
        ready={examQueue.ready}
        upcoming={examQueue.upcoming}
        now={home.now}
        onStart={home.startExam}
        onClose={() => home.setExamOpen(false)}
      />

      <ReviewModal
        open={home.reviewOpen}
        words={repeatWords}
        lessonSize={REPEAT_LESSON_SIZE}
        renderGrid={(words) =>
          // Тап по слову: закрываем «Повторение» и открываем окно слова
          grid(words, SHEET_HORIZONTAL_INSET, (word) => {
            home.setReviewOpen(false);
            home.setSelected(word);
          })
        }
        onStart={home.startRepeat}
        onClose={() => home.setReviewOpen(false)}
      />

      <SetSheet
        set={openedSet}
        renderGrid={(words) =>
          // Тап по слову: закрываем набор и открываем окно слова
          grid(words, SHEET_HORIZONTAL_INSET, (word) => {
            setOpenedSetId(null);
            home.setSelected(word);
          })
        }
        onStart={startSet}
        onEdit={(setId) => {
          setOpenedSetId(null);
          openEditor(setId);
        }}
        onClose={() => setOpenedSetId(null)}
      />

      <SetTitleModal
        visible={isCreating}
        heading="Новый набор"
        confirmLabel="Создать"
        onClose={() => setIsCreating(false)}
        onConfirm={(title) => {
          const setId = createSet(title);
          setIsCreating(false);
          openEditor(setId);
        }}
      />

      {/* Сверху закреплены только поиск и вкладки */}
      <SearchField
        value={home.query}
        onChangeText={home.setQuery}
        placeholder="Иероглиф, пиньинь или перевод"
        accessibilityLabel="Поиск слова"
        className="mt-3"
      />

      {!home.isSearching && (
        <SegmentedTabs
          tabs={TABS}
          value={tab}
          onChange={setTab}
          className="mt-3"
        />
      )}

      {/* Результаты поиска — списком: иероглиф, пиньинь и перевод, точки письма */}
      {home.isSearching && (
        <FlatList
          data={home.searchResults}
          keyExtractor={(word) => word.vocabularyId}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 16, gap: 8 }}
          initialNumToRender={10}
          renderItem={({ item }) => (
            <SetWordRow
              word={item}
              action="open"
              level={home.getLevel(item) as WordLevel}
              onPress={noop}
              onOpenWord={home.selectFromSearch}
            />
          )}
          ListEmptyComponent={
            <Text className="font-nunito text-body text-text">
              Ничего не нашлось. Пиньинь можно писать без тонов: «nihao».
            </Text>
          }
        />
      )}

      {/* Вкладки остаются смонтированными, неактивная прячется */}
      <View
        className="flex-1"
        style={{
          display: !home.isSearching && tab === "steps" ? "flex" : "none",
        }}
      >
        <WritingStepsTab
          renderGrid={renderStepGrid}
          topCards={topCards}
          onStartStep={startStep}
          outerInset={SCREEN_INSET}
          jump={jump}
        />
      </View>

      {!home.isSearching && tab === "sets" && (
        <WritingSetsTab
          sets={customSets}
          getLevel={home.getLevel}
          onOpen={setOpenedSetId}
          onStart={startSet}
          onCreate={() => setIsCreating(true)}
        />
      )}
    </Screen>
  );
}
