// app/(tabs)/games/writing/sets.tsx
//
// Главный экран режима «Написание» — устроен так же, как экран карточек:
//   - сверху закреплены поиск (иероглиф, пиньинь без тонов, перевод) и вкладки;
//   - «Ступени»: «Экзамен» и «Повторение», чипсы разделов HSK и ступени
//     с кнопкой «Тренировать» (WritingStepsTab);
//   - «Мои наборы»: те же наборы, что в карточках, — «Открыть» и «Тренировать».
// Нажатие на слово открывает выбор: что писать, в каком формате, «Повторять» и экзамен.
//
// Данные и действия — в useWritingHome; здесь только раскладка.

import { Screen } from "@/components/layout/Screen";
import { BackButton } from "@/components/ui/BackButton";
import { SHEET_HORIZONTAL_INSET } from "@/components/ui/BottomSheet";
import { SearchField } from "@/components/ui/SearchField";
import { SegmentedTabs } from "@/components/ui/SegmentedTabs";
import { Title } from "@/components/ui/Title";
import { ExamEntryCard } from "@/components/writing/home/ExamEntryCard";
import { ReviewCard } from "@/components/writing/home/ReviewCard";
import { WordGrid } from "@/components/writing/home/WordGrid";
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
import type { WritingLevel } from "@/utils/writing/words";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, Text, View } from "react-native";

/** Отступы Screen по бокам: от них считается ширина ячеек сетки. */
const SCREEN_INSET = 32;

type WritingTab = "steps" | "sets";

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

  const startStep = useCallback(
    (level: WritingLevel, index: number) =>
      router.push({
        pathname: "/games/writing/step" as any,
        params: { level: String(level), index: String(index) },
      }),
    [router],
  );

  const startSet = (setId: string) => {
    setOpenedSetId(null);
    router.push({
      pathname: "/games/writing/set" as any,
      params: { setId },
    });
  };

  // «Экзамен» и «Повторение» над чипсами — отделены от них крупным отступом
  const hasExam = examQueue.ready.length > 0 || examQueue.upcoming.length > 0;
  const hasTopCards = hasExam || repeatWords.length > 0;
  const topCards = hasTopCards ? (
    <View className="mb-8 gap-3">
      <ExamEntryCard
        readyCount={examQueue.ready.length}
        nextAvailableAt={examQueue.upcoming[0]?.availableAt}
        now={home.now}
        onPress={() => home.setExamOpen(true)}
      />
      {repeatWords.length > 0 && (
        <ReviewCard
          total={repeatWords.length}
          onPress={() => home.setReviewOpen(true)}
        />
      )}
    </View>
  ) : null;

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
        onClose={() => setOpenedSetId(null)}
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

      {home.isSearching && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingVertical: 16 }}
        >
          {home.searchResults.length > 0 ? (
            grid(home.searchResults)
          ) : (
            <Text className="font-nunito text-body text-text">
              Ничего не нашлось. Пиньинь можно писать без тонов: «nihao».
            </Text>
          )}
        </ScrollView>
      )}

      {/* Вкладки остаются смонтированными, неактивная прячется */}
      <View
        className="flex-1"
        style={{
          display: !home.isSearching && tab === "steps" ? "flex" : "none",
        }}
      >
        <WritingStepsTab
          renderGrid={(words, inset) => grid(words, inset)}
          topCards={topCards}
          onStartStep={startStep}
          outerInset={SCREEN_INSET}
        />
      </View>

      {!home.isSearching && tab === "sets" && (
        <WritingSetsTab
          sets={customSets}
          getLevel={home.getLevel}
          onOpen={setOpenedSetId}
          onStart={startSet}
          onManage={() => router.push("/games/flashcards/sets")}
        />
      )}
    </Screen>
  );
}
