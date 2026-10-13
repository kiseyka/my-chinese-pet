// src/screens/WritingSetsScreen.tsx
//
// Вход в режим «Написание»:
//   - поиск по иероглифу, пиньиню (без тонов) и переводу;
//   - «Экзамен» и «Повторение»: компактные карточки вверху, по тапу — окно (ExamModal, ReviewModal);
//   - слова текущего раздела HSK: заголовок со сводкой «изучено / всего» и ступени
//     по 10 слов, у каждой своя шкала; ступени сворачиваются (первой развёрнута текущая);
//   - следующие разделы HSK (пока закрыты) и «Другие слова» (свёрнуты).
// Блоки разделены ритмом отступов: внутри группы 12, между группами 32.
// Нажатие на слово открывает выбор: что писать, в каком формате, «Повторять» и экзамен.

import ArrowRight from "@/assets/images/icons/chevron-right.svg";
import { Screen } from "@/components/layout/Screen";
import { BackButton } from "@/components/ui/BackButton";
import { SHEET_HORIZONTAL_INSET } from "@/components/ui/BottomSheet";
import { SearchField } from "@/components/ui/SearchField";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Title } from "@/components/ui/Title";
import {
  ExamModal,
  formatExamWait,
  type UpcomingExamWord,
} from "@/components/writing/ExamModal";
import { HanziGrid, type ExamMark } from "@/components/writing/HanziGrid";
import { PracticeChoiceModal } from "@/components/writing/PracticeChoiceModal";
import { ReviewCard } from "@/components/writing/ReviewCard";
import { ReviewModal } from "@/components/writing/ReviewModal";
import { SealMark } from "@/components/writing/SealMark";
import { STEP_CARD_INSET, StepCard } from "@/components/writing/StepCard";
import type { Word } from "@/content/flashcards/types";
import {
  getWritingExamQueue,
  getWritingExamStatus,
  useWordProgressStore,
} from "@/store/wordProgressStore";
import {
  NO_HSK_LEVEL,
  REPEAT_LESSON_SIZE,
  describeLevel,
  getAvailableLevels,
  getLevelSequence,
  getLevelStepsProgress,
  getRepeatWords,
  getWordCharacters,
  getWordWritingDots,
  searchWritingWords,
  type FreeFormat,
} from "@/utils/writingLessons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";

/** Отступы Screen по бокам: от них считается ширина ячеек сетки. */
const SCREEN_INSET = 32;

/** Отступ между группами блоков (внутри группы — gap-3). */
const GROUP_GAP = 32;

/** Набор переводов, где лежат переводы слов (как на экране урока). */
const WORDS_NAMESPACE = "sets";

/**
 * Сколько точек (написаний по памяти) нужно, чтобы слово считалось изученным.
 * TODO: заменить на максимум точек / признак «освоено» из writingLessons, если он есть.
 */
const LEARNED_DOTS = 3;

export default function WritingSetsScreen() {
  const router = useRouter();
  const { t } = useTranslation([WORDS_NAMESPACE]);

  // Подписка на прогресс: точки, ступени, «Повторение» и экзамены пересчитываются при изменении
  const flashcardWords = useWordProgressStore((s) => s.flashcardWords);
  const writingReview = useWordProgressStore((s) => s.writingReview);
  const writingExams = useWordProgressStore((s) => s.writingExams);
  const toggleWritingReview = useWordProgressStore(
    (s) => s.toggleWritingReview,
  );

  // Время для очереди экзаменов: обновляем при каждом возвращении на экран
  const [now, setNow] = useState(() => Date.now());
  useFocusEffect(
    useCallback(() => {
      setNow(Date.now());
    }, []),
  );

  const levels = useMemo(() => getAvailableLevels(), []);
  const hskLevels = levels.filter((level) => level !== NO_HSK_LEVEL);
  const hasOtherWords = levels.includes(NO_HSK_LEVEL);

  // Пока финалов ступеней нет, открыт только первый раздел HSK
  const currentLevel = hskLevels[0];
  const lockedLevels = hskLevels.slice(1);

  const progress =
    currentLevel !== undefined
      ? getLevelStepsProgress(currentLevel, flashcardWords)
      : null;

  // Развёрнутые блоки: «step-3» или «other». Сначала — текущая ступень
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(progress ? [`step-${progress.currentIndex}`] : []),
  );

  const toggle = (key: string) =>
    setExpanded((previous) => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const [query, setQuery] = useState("");
  const results = useMemo(() => searchWritingWords(query, t), [query, t]);
  const isSearching = query.trim().length > 0;

  const repeatWords = useMemo(
    () => getRepeatWords(Object.keys(writingReview)),
    [writingReview],
  );

  // Очередь экзаменов: все слова с прогрессом письма или записью экзамена
  const examQueue = useMemo(() => {
    const ids = Array.from(
      new Set([...Object.keys(flashcardWords), ...Object.keys(writingExams)]),
    );
    const queue = getWritingExamQueue(ids, flashcardWords, writingExams, now);

    const ready = getRepeatWords(queue.ready);
    const upcoming: UpcomingExamWord[] = queue.upcoming.flatMap(
      ({ wordId, availableAt }) => {
        const [word] = getRepeatWords([wordId]);
        return word ? [{ word, availableAt }] : [];
      },
    );

    return { ready, upcoming };
  }, [flashcardWords, writingExams, now]);

  const [examOpen, setExamOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  const [selected, setSelected] = useState<Word | null>(null);
  const characters = useMemo(
    () => (selected ? getWordCharacters(selected) : []),
    [selected],
  );

  const getLevel = (word: Word) => getWordWritingDots(word, flashcardWords);
  const isInReview = (word: Word) => !!writingReview[word.vocabularyId];
  const isLearned = (word: Word) => getLevel(word) >= LEARNED_DOTS;
  const getExamStatus = (word: Word) =>
    getWritingExamStatus(
      flashcardWords[word.vocabularyId],
      writingExams[word.vocabularyId],
      now,
    );
  const getExamMark = (word: Word): ExamMark => {
    const { status } = getExamStatus(word);
    return status === "ready" || status === "passed" ? status : null;
  };

  // Сводка по разделу: изучено / всего по всем ступеням
  const levelLearned = progress
    ? progress.steps.reduce(
        (sum, step) => sum + step.words.filter(isLearned).length,
        0,
      )
    : 0;
  const levelTotal = progress
    ? progress.steps.reduce((sum, step) => sum + step.words.length, 0)
    : 0;

  const hasMoreGroup = lockedLevels.length > 0 || hasOtherWords;
  const hasTopGroup =
    examQueue.ready.length > 0 ||
    examQueue.upcoming.length > 0 ||
    repeatWords.length > 0;

  const start = (word: Word, format: FreeFormat) => {
    setSelected(null);
    router.push({
      pathname: "/games/writing/free" as any,
      params: { wordId: word.vocabularyId, format },
    });
  };

  const startRepeat = () => {
    setReviewOpen(false);
    if (repeatWords.length === 0) return;
    router.push("/games/writing/review" as any);
  };

  const startExam = (words: Word[]) => {
    if (words.length === 0) return;
    setExamOpen(false);
    setSelected(null);
    router.push({
      pathname: "/games/writing/exam" as any,
      params: { wordIds: words.map((w) => w.vocabularyId).join(",") },
    });
  };

  /**
   * Сетка слов. inset — сколько ширины экрана не достаётся сетке
   * (отступы экрана, карточки или панели).
   */
  const grid = (
    words: Word[],
    inset = SCREEN_INSET,
    onSelect: (word: Word) => void = setSelected,
  ) => (
    <HanziGrid
      words={words}
      getLevel={getLevel}
      onSelect={onSelect}
      isMarked={isInReview}
      getExamMark={getExamMark}
      horizontalInset={inset}
    />
  );

  return (
    <Screen>
      <View className="flex-row items-center justify-between">
        <BackButton href="/games" />
        <Title>Написание</Title>
        <View style={{ width: 40 }} />
      </View>

      <PracticeChoiceModal
        word={selected}
        characters={characters}
        getLevel={getLevel}
        isInReview={isInReview}
        onToggleReview={(word) => toggleWritingReview(word.vocabularyId)}
        getExamStatus={getExamStatus}
        now={now}
        onStartExam={(word) => startExam([word])}
        onStart={start}
        onClose={() => setSelected(null)}
      />

      <ExamModal
        open={examOpen}
        ready={examQueue.ready}
        upcoming={examQueue.upcoming}
        now={now}
        onStart={startExam}
        onClose={() => setExamOpen(false)}
      />

      <ReviewModal
        open={reviewOpen}
        words={repeatWords}
        lessonSize={REPEAT_LESSON_SIZE}
        renderGrid={(words) =>
          // Тап по слову: закрываем «Повторение» и открываем окно слова
          grid(words, SHEET_HORIZONTAL_INSET, (word) => {
            setReviewOpen(false);
            setSelected(word);
          })
        }
        onStart={startRepeat}
        onClose={() => setReviewOpen(false)}
      />

      <SearchField
        value={query}
        onChangeText={setQuery}
        placeholder="Иероглиф, пиньинь или перевод"
        accessibilityLabel="Поиск слова"
        className="my-3"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingVertical: 16, gap: GROUP_GAP }}
      >
        {isSearching ? (
          results.length > 0 ? (
            grid(results)
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
                {examQueue.ready.length > 0 ? (
                  <Pressable
                    onPress={() => setExamOpen(true)}
                    className="flex-row items-center gap-4 rounded-2xl  bg-surface px-4 py-4 active:opacity-70"
                    accessibilityRole="button"
                  >
                    <SealMark size={36} />
                    <View className="flex-1 gap-0.5">
                      <Text className="font-nunitoBold text-lead text-text">
                        Экзамен
                      </Text>
                      <Text className="font-nunito text-small text-text opacity-70">
                        Готово слов: {examQueue.ready.length}
                      </Text>
                    </View>
                    <ArrowRight width={20} height={20} className="text-text" />
                  </Pressable>
                ) : examQueue.upcoming.length > 0 ? (
                  <Text className="font-nunito text-small text-text opacity-60">
                    Следующий экзамен{" "}
                    {formatExamWait(examQueue.upcoming[0].availableAt, now)}
                  </Text>
                ) : null}

                {repeatWords.length > 0 && (
                  <ReviewCard
                    total={repeatWords.length}
                    onPress={() => setReviewOpen(true)}
                  />
                )}
              </View>
            )}

            {/* Группа 2: текущий раздел HSK и его ступени */}
            {progress && currentLevel !== undefined && (
              <View className="gap-3">
                <View className="flex-row items-baseline justify-between">
                  <Text className="font-nunitoBold text-title text-text">
                    {describeLevel(currentLevel)}
                  </Text>
                  <Text
                    className="font-nunito text-small text-textSecondary"
                    accessibilityLabel={`Изучено ${levelLearned} из ${levelTotal}`}
                  >
                    {levelLearned}/{levelTotal} изучено
                  </Text>
                </View>

                {progress.steps.map((step, index) => {
                  const key = `step-${index}`;

                  return (
                    <StepCard
                      key={key}
                      title={`Ступень ${index + 1}`}
                      learned={step.words.filter(isLearned).length}
                      total={step.words.length}
                      expanded={expanded.has(key)}
                      onToggle={() => toggle(key)}
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
                {lockedLevels.map((level) => (
                  <View
                    key={level}
                    className="gap-1 rounded-2xl bg-surface/60 px-4 py-3"
                  >
                    <Text className="font-nunito text-body text-text">
                      {describeLevel(level)} · закрыт
                    </Text>
                    <Text className="font-nunito text-small text-text">
                      Откроется, когда пройдёшь финалы всех ступеней{" "}
                      {describeLevel(currentLevel)}.
                    </Text>
                  </View>
                ))}

                {/* Другие слова: твои слова без уровня и слова HSK 5+ */}
                {hasOtherWords && (
                  <View className="gap-3">
                    <SectionHeader
                      title={describeLevel(NO_HSK_LEVEL)}
                      subtitle={`${getLevelSequence(NO_HSK_LEVEL).length}`}
                      expanded={expanded.has("other")}
                      onPress={() => toggle("other")}
                    />
                    {expanded.has("other") &&
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
