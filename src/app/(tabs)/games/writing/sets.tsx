// app/(tabs)/games/writing/sets.tsx
//
// Главный экран режима «Написание». Почти всё место отдано карте пути:
//   - шапка (WritingHeader): назад, название, кнопка поиска; ниже раздел «HSK 1 ▾»,
//     «Экзамен» и «Наборы» (переключает экран на «Мои наборы» и обратно);
//   - карта пути из тем (WritingStepsTab) с кнопками «Повторение» и «Продолжить» внизу;
//     тап по теме открывает её экран (theme.tsx);
//   - «Мои наборы»: те же наборы, что в карточках, — «Открыть», «Тренировать»,
//     создание и редактирование (редактор общий с карточками).
// Нажатие на слово открывает выбор: что писать, в каком формате, «Повторять» и экзамен.
// Поиск — списком (иероглиф, пиньинь, перевод), как в карточках; у найденного слова
// в окне видно, где оно лежит, и «Показать» открывает экран его темы.
//
// Данные и действия — в useWritingHome; здесь только раскладка.

import { SetTitleModal } from "@/components/flashcards/SetTitleModal";
import { SetWordRow } from "@/components/flashcards/SetWordRow";
import type { WordLevel } from "@/components/ui/LevelDots";
import { Screen } from "@/components/layout/Screen";
import {
  BottomSheet,
  SHEET_HORIZONTAL_INSET,
} from "@/components/ui/BottomSheet";
import { WordGrid } from "@/components/writing/home/WordGrid";
import { WritingHeader } from "@/components/writing/home/WritingHeader";
import { WritingStepsTab } from "@/components/writing/home/WritingStepsTab";
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
import {
  NO_HSK_LEVEL,
  describeLevel,
  getAvailableLevels,
  type WritingLevel,
} from "@/utils/writing/words";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";

/** Отступы Screen по бокам: от них считается ширина ячеек сетки. */
const SCREEN_INSET = 32;

type WritingTab = "steps" | "sets";

/** Строке результата поиска действие «добавить/убрать» не нужно. */
const noop = () => {};

export default function WritingHomeScreen() {
  const home = useWritingHome();
  const router = useRouter();
  const { examQueue, repeatWords } = home;

  const [tab, setTab] = useState<WritingTab>("steps");
  const [searchOpen, setSearchOpen] = useState(false);
  const closeSearch = () => {
    home.setQuery("");
    setSearchOpen(false);
  };

  // Раздел HSK карты пути (сначала первый раздел HSK)
  const levels = useMemo(() => getAvailableLevels(), []);
  const [level, setLevel] = useState<WritingLevel>(
    () => levels.find((item) => item !== NO_HSK_LEVEL) ?? levels[0],
  );
  const [levelPickerOpen, setLevelPickerOpen] = useState(false);

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

  const startStep = useCallback(
    (level: WritingLevel, index: number) =>
      router.push({
        pathname: "/games/writing/step" as any,
        params: { level: String(level), index: String(index) },
      }),
    [router],
  );

  const openStep = useCallback(
    (level: WritingLevel, index: number) =>
      router.push({
        pathname: "/games/writing/theme" as any,
        params: { level: String(level), index: String(index) },
      }),
    [router],
  );

  // ── Слово из поиска: где лежит и «Показать» ────────────────────────────────

  const selectedStep =
    home.selected && home.selectedFromSearch
      ? findWritingWordStep(home.selected.vocabularyId)
      : null;
  const showInStep = () => {
    if (!selectedStep) return;
    home.setSelected(null);
    closeSearch();
    setTab("steps");
    setLevel(selectedStep.level);
    openStep(selectedStep.level, selectedStep.index);
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

  const { now, setExamOpen, setReviewOpen } = home;
  const openReview = useCallback(() => setReviewOpen(true), [setReviewOpen]);

  return (
    <Screen>
      <WritingHeader
        searchOpen={searchOpen}
        query={home.query}
        onChangeQuery={home.setQuery}
        onOpenSearch={() => setSearchOpen(true)}
        onCloseSearch={closeSearch}
        levelLabel={describeLevel(level)}
        onPickLevel={() => setLevelPickerOpen(true)}
        setsOpen={tab === "sets"}
        onToggleSets={() => setTab(tab === "sets" ? "steps" : "sets")}
        examReady={examQueue.ready.length}
        nextExamAt={examQueue.upcoming[0]?.availableAt}
        now={now}
        onOpenExam={() => setExamOpen(true)}
      />

      <BottomSheet
        item={levelPickerOpen ? true : null}
        onClose={() => setLevelPickerOpen(false)}
      >
        {() => (
          <View className="gap-2 pb-2">
            <Text className="mb-1 font-nunitoBold text-title text-text">
              Раздел
            </Text>
            {levels.map((item) => (
              <Pressable
                key={item}
                onPress={() => {
                  setLevel(item);
                  setLevelPickerOpen(false);
                }}
                className={`rounded-2xl px-4 py-3.5 active:opacity-70 ${
                  item === level ? "bg-primary" : "bg-background"
                }`}
                accessibilityRole="button"
                accessibilityState={{ selected: item === level }}
              >
                <Text
                  className={`font-nunitoBold text-body ${
                    item === level ? "text-white" : "text-text"
                  }`}
                >
                  {describeLevel(item)}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </BottomSheet>

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
          level={level}
          onChangeLevel={setLevel}
          onStartStep={startStep}
          onOpenStep={openStep}
          repeatCount={repeatWords.length}
          onOpenReview={openReview}
          outerInset={SCREEN_INSET}
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
