// src/screens/writing/WritingHomeScreen.tsx
//
// Вход в режим «Написание» (маршрут /games/writing/sets):
//   - поиск по иероглифу, пиньиню (без тонов) и переводу;
//   - «Экзамен» и «Повторение»: компактные карточки вверху, по тапу — окно (ExamModal, ReviewModal);
//   - слова текущего раздела HSK: заголовок со сводкой «изучено / всего» и ступени
//     по 10 слов, у каждой своя шкала; ступени сворачиваются (первой развёрнута текущая);
//   - следующие разделы HSK (пока закрыты) и «Другие слова» (свёрнуты).
// Блоки разделены ритмом отступов: внутри группы 12, между группами 32.
// Нажатие на слово открывает выбор: что писать, в каком формате, «Повторять» и экзамен.
//
// Данные и действия — в useWritingHome; здесь только раскладка.

import { Screen } from "@/components/layout/Screen";
import { BackButton } from "@/components/ui/BackButton";
import { SHEET_HORIZONTAL_INSET } from "@/components/ui/BottomSheet";
import { SearchField } from "@/components/ui/SearchField";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Title } from "@/components/ui/Title";
import { ExamEntryCard } from "@/components/writing/home/ExamEntryCard";
import {
  LevelHeader,
  LockedLevelCard,
} from "@/components/writing/home/LevelSections";
import { ReviewCard } from "@/components/writing/home/ReviewCard";
import { STEP_CARD_INSET, StepCard } from "@/components/writing/home/StepCard";
import { WordGrid } from "@/components/writing/home/WordGrid";
import { ExamModal } from "@/components/writing/modals/ExamModal";
import { PracticeChoiceModal } from "@/components/writing/modals/PracticeChoiceModal";
import { ReviewModal } from "@/components/writing/modals/ReviewModal";
import type { Word } from "@/content/flashcards/types";
import { useWritingHome } from "@/hooks/writing/useWritingHome";
import { REPEAT_LESSON_SIZE } from "@/utils/writing/plans";
import { getLevelSequence } from "@/utils/writing/steps";
import { NO_HSK_LEVEL, describeLevel } from "@/utils/writing/words";
import { ScrollView, Text, View } from "react-native";

/** Отступы Screen по бокам: от них считается ширина ячеек сетки. */
const SCREEN_INSET = 32;

/** Отступ между группами блоков (внутри группы — gap-3). */
const GROUP_GAP = 32;

export default function WritingHomeScreen() {
  const home = useWritingHome();
  const { examQueue, repeatWords, stepsProgress, currentLevel } = home;

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

  const hasTopGroup =
    examQueue.ready.length > 0 ||
    examQueue.upcoming.length > 0 ||
    repeatWords.length > 0;
  const hasMoreGroup = home.lockedLevels.length > 0 || home.hasOtherWords;

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

      <SearchField
        value={home.query}
        onChangeText={home.setQuery}
        placeholder="Иероглиф, пиньинь или перевод"
        accessibilityLabel="Поиск слова"
        className="my-3"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingVertical: 16, gap: GROUP_GAP }}
      >
        {home.isSearching ? (
          home.searchResults.length > 0 ? (
            grid(home.searchResults)
          ) : (
            <Text className="font-nunito text-body text-text">
              Ничего не нашлось. Пиньинь можно писать без тонов: «nihao».
            </Text>
          )
        ) : (
          <>
            {/* Группа 1: Экзамен и Повторение */}
            {hasTopGroup && (
              <View className="gap-3">
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
            )}

            {/* Группа 2: текущий раздел HSK и его ступени */}
            {stepsProgress && currentLevel !== undefined && (
              <View className="gap-3">
                <LevelHeader
                  level={currentLevel}
                  learned={home.levelLearned}
                  total={home.levelTotal}
                />

                {stepsProgress.steps.map((step, index) => {
                  const key = `step-${index}`;

                  return (
                    <StepCard
                      key={key}
                      title={`Ступень ${index + 1}`}
                      learned={step.learned}
                      total={step.words.length}
                      expanded={home.expanded.has(key)}
                      onToggle={() => home.toggleExpanded(key)}
                    >
                      {grid(step.words, SCREEN_INSET + STEP_CARD_INSET)}
                    </StepCard>
                  );
                })}
              </View>
            )}

            {/* Группа 3: следующие разделы HSK и «Другие слова» */}
            {hasMoreGroup && (
              <View className="gap-3">
                {currentLevel !== undefined &&
                  home.lockedLevels.map((level) => (
                    <LockedLevelCard
                      key={level}
                      level={level}
                      currentLevel={currentLevel}
                    />
                  ))}

                {/* Другие слова: твои слова без уровня и слова HSK 5+ */}
                {home.hasOtherWords && (
                  <View className="gap-3">
                    <SectionHeader
                      title={describeLevel(NO_HSK_LEVEL)}
                      subtitle={`${getLevelSequence(NO_HSK_LEVEL).length}`}
                      expanded={home.expanded.has("other")}
                      onPress={() => home.toggleExpanded("other")}
                    />
                    {home.expanded.has("other") &&
                      grid(getLevelSequence(NO_HSK_LEVEL))}
                  </View>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
