// src/components/flashcards/StepsTab.tsx
//
// Вкладка «Ступени» на экране карточек. Поиск и панель слова — на уровне экрана
// (sets.tsx), здесь только содержимое вкладки:
//   - «Повторение» (как в «Написании») — если в нём есть слова;
//   - чипсы разделов HSK — ближе к ступеням, чем к повторению;
//   - ступени раздела (LevelSteps).
// Всё это прокручивается вместе со ступенями: сверху закреплены только поиск и вкладки.
// Разделы, в которые уже заходили, остаются в памяти и только прячутся —
// повторное переключение мгновенное. Прокрутка у всех разделов общая (useSharedScroll),
// поэтому шапка с чипсами при переключении стоит на месте.
// Сначала выбран текущий раздел — первый, где есть неосвоенные слова.

import { ReviewCard } from "@/components/writing/home/ReviewCard";
import { useSharedScroll } from "@/hooks/useSharedLevelScroll";
import type { Word } from "@/content/flashcards/types";
import { getWordLevel, useWordProgressStore } from "@/store/wordProgressStore";
import { getReadingReviewWords } from "@/utils/flashcards/source";
import {
  describeReadingLevel,
  getReadingLevels,
  getReadingSteps,
  type ReadingLevel,
} from "@/utils/flashcards/steps";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { View } from "react-native";
import { LevelChips } from "./LevelChips";
import { LevelSteps, type StepJump } from "./LevelSteps";
import { ReadingReviewSheet } from "./ReadingReviewSheet";

/** Отступы Screen по бокам: от них считается ширина ячеек сетки. */
const SCREEN_INSET = 32;

/** «Показать ступень» (из поиска): раздел, ступень и метка прыжка. */
export type StepJumpRequest = StepJump & { level: ReadingLevel };

interface StepsTabProps {
  onStartStep: (level: ReadingLevel, index: number) => void;
  onStartReview: () => void;
  /** Тап по слову в сетке — панель слова (на экране). */
  onSelectWord: (word: Word) => void;
  /** Прыжок к ступени: переключить раздел, развернуть ступень и прокрутить к ней. */
  jump: StepJumpRequest | null;
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

export function StepsTab({
  onStartStep,
  onStartReview,
  onSelectWord,
  jump,
}: StepsTabProps) {
  const levels = getReadingLevels();

  // Текущий раздел при открытии экрана: первый, где есть неосвоенные слова
  const [level, setLevel] = useState<ReadingLevel>(
    () => levels.find(isLevelUnfinished) ?? levels[0],
  );
  // Чипс выделяется сразу, а тяжёлый первый показ раздела идёт следом
  const shownLevel = useDeferredValue(level);

  // Прыжок из поиска — сначала переключаем раздел
  useEffect(() => {
    if (jump) setLevel(jump.level);
  }, [jump]);

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

  // ── Повторение ─────────────────────────────────────────────────────────────

  const review = useWordProgressStore((state) => state.review);
  const reviewWords = useMemo(
    () => getReadingReviewWords(review),
    [review],
  );
  const [reviewOpen, setReviewOpen] = useState(false);

  // ── Шапка списка: повторение и чипсы ───────────────────────────────────────

  const chips = useMemo(
    () =>
      levels.map((item) => ({ key: item, label: describeReadingLevel(item) })),
    [levels],
  );

  const shared = useSharedScroll();
  const reviewCount = reviewWords.length;

  // Шапка — как в «Написании»: строка «Повторение», под ней чипсы, ближе к ступеням (12)
  const renderHeader = useCallback(
    (visible: boolean) => (
      <View className="pb-3">
        {reviewCount > 0 && (
          <View className="mb-4">
            <ReviewCard total={reviewCount} onPress={() => setReviewOpen(true)} />
          </View>
        )}
        <LevelChips
          chips={chips}
          value={level}
          onChange={setLevel}
          shared={shared}
          active={visible}
        />
      </View>
    ),
    [reviewCount, chips, level, shared],
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
          onSelectWord(word);
        }}
        onStart={() => {
          setReviewOpen(false);
          onStartReview();
        }}
      />

      {mounted.map((item) => (
        <LevelSteps
          key={item}
          level={item}
          visible={item === shownLevel}
          outerInset={SCREEN_INSET}
          jump={jump?.level === item ? jump : null}
          onStartStep={onStartStep}
          onSelectWord={onSelectWord}
          renderHeader={renderHeader}
          shared={shared}
        />
      ))}
    </View>
  );
}
