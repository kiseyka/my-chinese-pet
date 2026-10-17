// app/(tabs)/vocabulary.tsx
//
// «Словарь» — все слова приложения в одном месте:
//   - поиск по иероглифу, пиньиню без тонов и переводу (результаты — списком);
//   - сверху «Экзамен» (если есть что сдавать) и «Повторение» (если в нём есть слова);
//   - чипсы: «Избранное», «Наборы», разделы HSK, «Другие слова»;
//   - слова раздела сгруппированы по темам — тем же, что этапы пути;
//     у каждого слова две строки точек: перевод (зелёные) и письмо (тёмные);
//   - у темы, набора, избранного и «Повторения» — «Тренировать»: выбор режима
//     (TrainingChoiceSheet); у набора ещё карандаш — редактор (общий с карточками);
//   - тап по слову — панель слова (DictionaryWordSheet): точки навыков, избранное,
//     где слово на пути и «Показать», наборы.
// Разделы, в которые уже заходили, остаются смонтированными и только прячутся —
// повторное переключение чипсов мгновенное.

import PencilIcon from "@/assets/images/icons/pencil.svg";
import { DictionaryWordSheet } from "@/components/dictionary/DictionaryWordSheet";
import { ReviewSheet } from "@/components/dictionary/ReviewSheet";
import { SetTitleModal } from "@/components/flashcards/SetTitleModal";
import { LevelChips } from "@/components/flashcards/LevelChips";
import { SetWordRow } from "@/components/flashcards/SetWordRow";
import { Screen } from "@/components/layout/Screen";
import { PathWordGrid } from "@/components/path/PathWordGrid";
import { TrainingChoiceSheet } from "@/components/training/TrainingChoiceSheet";
import type { WordLevel } from "@/components/ui/LevelDots";
import { BackButton } from "@/components/ui/BackButton";
import { SearchField } from "@/components/ui/SearchField";
import { Title } from "@/components/ui/Title";
import { ExamEntryCard } from "@/components/writing/home/ExamEntryCard";
import { ReviewCard } from "@/components/writing/home/ReviewCard";
import { ExamModal } from "@/components/writing/modals/ExamModal";
import type { Word } from "@/content/flashcards/types";
import { allWords, findWords } from "@/content/words/vocabulary";
import { useExamQueue } from "@/hooks/useExamQueue";
import { useCustomSetsStore } from "@/store/customSetsStore";
import { useGameStore } from "@/store/gameStore";
import { useWordProgressStore } from "@/store/wordProgressStore";
import {
  describeDictionaryLevel,
  getDictionaryGroups,
  getDictionaryLevels,
  type DictionaryGroup,
} from "@/utils/dictionary";
import { getTrackDots, type TrackId } from "@/utils/path/stages";
import { searchWords } from "@/utils/searchWords";
import { colors } from "@/theme/colors";
import {
  FAVORITES_SOURCE,
  getReviewIds,
  REVIEW_SOURCE,
} from "@/utils/wordSource";
import {
  findPracticeWords,
  getWritableWords,
  LEARNED_DOTS,
} from "@/utils/writing/words";
import { useFocusEffect, useRouter } from "expo-router";
import {
  memo,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable, Text, View } from "react-native";

/** Отступы экрана (32) и карточки темы (2 × 12): на столько сетке меньше места. */
const GRID_INSET = 32 + 24;

/** Чипсы «Избранное» и «Наборы» (разделы HSK — числа от 0). */
const FAVORITES = -1;
const SETS = -2;

/** Строке результата поиска действие «добавить/убрать» не нужно. */
const noop = () => {};

type GetDots = (word: Word, track: TrackId) => number | undefined;

export default function DictionaryScreen() {
  const router = useRouter();
  const { t } = useTranslation(["sets"]);

  // Тренировки, запущенные отсюда, возвращаются сюда
  useFocusEffect(
    useCallback(() => {
      useGameStore.getState().setReturnTo(null);
    }, []),
  );

  const flashcardWords = useWordProgressStore((s) => s.flashcardWords);

  const [query, setQuery] = useState("");
  const isSearching = query.trim().length > 0;
  const results = useMemo(
    () => (isSearching ? searchWords(allWords, query, (key) => t(key)) : []),
    [isSearching, query, t],
  );

  const levels = getDictionaryLevels();
  const [chip, setChip] = useState<number>(() => levels[0]);
  // Чипс выделяется сразу, а первый показ раздела идёт следом
  const shownChip = useDeferredValue(chip);

  // Разделы, в которые уже заходили: держим смонтированными
  const [visited, setVisited] = useState<number[]>(() => [levels[0]]);
  useEffect(() => {
    setVisited((previous) =>
      previous.includes(shownChip) ? previous : [...previous, shownChip],
    );
  }, [shownChip]);
  const mounted = visited.includes(shownChip)
    ? visited
    : [...visited, shownChip];

  const chips = useMemo(
    () => [
      { key: FAVORITES, label: "Избранное" },
      { key: SETS, label: "Наборы" },
      ...levels.map((level) => ({
        key: level,
        label: describeDictionaryLevel(level),
      })),
    ],
    [levels],
  );

  // Какие слова можно писать — один раз на всю базу
  const writableIds = useMemo(
    () => new Set(getWritableWords(allWords).map((w) => w.vocabularyId)),
    [],
  );
  const getDots = useCallback<GetDots>(
    (word, track) =>
      track === "writing" && !writableIds.has(word.vocabularyId)
        ? undefined
        : getTrackDots(word, track, flashcardWords),
    [writableIds, flashcardWords],
  );

  const [opened, setOpened] = useState<Word | null>(null);
  const [training, setTraining] = useState<string | null>(null);

  // «Повторение» — одно на все навыки
  const review = useWordProgressStore((s) => s.review);
  const reviewWords = useMemo(
    () => findPracticeWords(getReviewIds(review)),
    [review],
  );
  const [reviewOpen, setReviewOpen] = useState(false);
  const closeReview = useCallback(() => setReviewOpen(false), []);

  // Экзамен по письму: слова с 3 точками
  const exams = useExamQueue();
  const [examOpen, setExamOpen] = useState(false);
  const startExam = (words: Word[]) => {
    if (words.length === 0) return;
    setExamOpen(false);
    useGameStore.getState().setReturnTo("/vocabulary");
    router.push({
      pathname: "/games/writing/exam" as any,
      params: { wordIds: words.map((w) => w.vocabularyId).join(",") },
    });
  };

  // Наборы: создание и редактор (общий с карточками; «назад» вернёт сюда)
  const createSet = useCustomSetsStore((state) => state.createSet);
  const [isCreating, setIsCreating] = useState(false);
  const editSet = useCallback(
    (setId: string) =>
      router.push({
        pathname: "/games/flashcards/edit/[setId]",
        params: { setId, from: "dictionary" },
      }),
    [router],
  );
  const startCreating = useCallback(() => setIsCreating(true), []);

  const showStage = (stageId: string) => {
    setOpened(null);
    router.push({
      pathname: "/games/path/stage" as any,
      params: { id: stageId, from: "dictionary" },
    });
  };

  return (
    <Screen>
      <DictionaryWordSheet
        word={opened}
        onShowStage={showStage}
        onClose={() => setOpened(null)}
      />

      <TrainingChoiceSheet
        sourceId={training}
        returnTo="/vocabulary"
        onClose={() => setTraining(null)}
      />

      <ReviewSheet
        open={reviewOpen}
        words={reviewWords}
        onSelectWord={(word) => {
          setReviewOpen(false);
          setOpened(word);
        }}
        onTrain={() => {
          setReviewOpen(false);
          setTraining(REVIEW_SOURCE);
        }}
        onClose={closeReview}
      />

      <ExamModal
        open={examOpen}
        ready={exams.ready}
        upcoming={exams.upcoming}
        now={exams.now}
        onStart={startExam}
        onClose={() => setExamOpen(false)}
      />

      <SetTitleModal
        visible={isCreating}
        heading="Новый набор"
        confirmLabel="Создать"
        onClose={() => setIsCreating(false)}
        onConfirm={(title) => {
          const setId = createSet(title);
          setIsCreating(false);
          editSet(setId);
        }}
      />

      <View className="flex-row items-center justify-between">
        <BackButton href="/games" />
        <Title>Словарь</Title>
        <View style={{ width: 28 }} />
      </View>

      <SearchField
        value={query}
        onChangeText={setQuery}
        placeholder="Иероглиф, пиньинь или перевод"
        accessibilityLabel="Поиск слова"
        className="mt-3"
      />

      {isSearching && (
        <FlatList
          data={results}
          keyExtractor={(word) => word.vocabularyId}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 16, gap: 8 }}
          initialNumToRender={10}
          renderItem={({ item }) => (
            <SetWordRow
              word={item}
              action="open"
              level={getTrackDots(item, "reading", flashcardWords) as WordLevel}
              onPress={noop}
              onOpenWord={setOpened}
            />
          )}
          ListEmptyComponent={
            <Text className="font-nunito text-body text-text">
              Ничего не нашлось. Пиньинь можно писать без тонов: «nihao».
            </Text>
          }
        />
      )}

      {/* Разделы остаются смонтированными во время поиска — так он не сбрасывает прокрутку */}
      <View
        className="flex-1"
        style={{ display: isSearching ? "none" : "flex" }}
      >
        {(reviewWords.length > 0 ||
          exams.ready.length > 0 ||
          exams.upcoming.length > 0) && (
          <View className="mt-3 gap-2">
            <ExamEntryCard
              readyCount={exams.ready.length}
              nextAvailableAt={exams.upcoming[0]?.availableAt}
              now={exams.now}
              onPress={() => setExamOpen(true)}
            />
            {reviewWords.length > 0 && (
              <ReviewCard
                total={reviewWords.length}
                onPress={() => setReviewOpen(true)}
              />
            )}
          </View>
        )}

        <View className="mt-3">
          <LevelChips chips={chips} value={chip} onChange={setChip} />
        </View>

        {mounted.map((item) => (
          <DictionarySection
            key={item}
            chip={item}
            visible={item === shownChip}
            getDots={getDots}
            onSelect={setOpened}
            onTrain={setTraining}
            onEditSet={editSet}
            onCreateSet={startCreating}
          />
        ))}
      </View>
    </Screen>
  );
}

// ── Раздел ───────────────────────────────────────────────────────────────────
// memo: при переключении чипса уже показанные разделы не перерисовываются,
// только прячутся (display: none).

const DictionarySection = memo(function DictionarySection({
  chip,
  visible,
  getDots,
  onSelect,
  onTrain,
  onEditSet,
  onCreateSet,
}: {
  chip: number;
  visible: boolean;
  getDots: GetDots;
  onSelect: (word: Word) => void;
  onTrain: (sourceId: string) => void;
  onEditSet: (setId: string) => void;
  onCreateSet: () => void;
}) {
  // Избранное и наборы меняются — подписываемся только в своих разделах
  const vocabularyWords = useWordProgressStore((s) =>
    chip === FAVORITES ? s.vocabularyWords : null,
  );
  const sets = useCustomSetsStore((s) => (chip === SETS ? s.sets : null));

  const groups = useMemo<DictionaryGroup[]>(() => {
    if (chip === SETS) {
      return (sets ?? []).map((set) => ({
        key: set.id,
        title: set.title,
        words: findWords(set.wordIds),
        sourceId: set.id,
      }));
    }
    if (chip !== FAVORITES) return getDictionaryGroups(chip);
    const favorites = allWords.filter(
      (word) => vocabularyWords?.[word.vocabularyId]?.isFavorite,
    );
    return [
      {
        key: "favorites",
        title: "Избранное",
        words: favorites,
        sourceId: FAVORITES_SOURCE,
      },
    ];
  }, [chip, vocabularyWords, sets]);

  const renderGroup = useCallback(
    ({ item }: { item: DictionaryGroup }) => (
      <GroupCard
        group={item}
        getDots={getDots}
        onSelect={onSelect}
        onTrain={onTrain}
        onEdit={chip === SETS ? onEditSet : undefined}
      />
    ),
    [getDots, onSelect, onTrain, onEditSet, chip],
  );

  const style = { display: visible ? ("flex" as const) : ("none" as const) };

  if (chip === FAVORITES && groups[0].words.length === 0) {
    return (
      <View style={style} className="mt-4 gap-2 rounded-2xl bg-surface p-5">
        <Text className="font-nunitoBold text-lead text-text">
          Здесь будут твои любимые слова
        </Text>
        <Text className="font-nunito text-body text-textSecondary">
          Открой слово и нажми «Добавить в избранное».
        </Text>
      </View>
    );
  }

  const newSet =
    chip === SETS ? (
      <Pressable
        onPress={onCreateSet}
        className="min-h-12 items-center justify-center rounded-2xl border border-dashed border-primary bg-surface active:opacity-70"
        accessibilityRole="button"
      >
        <Text className="font-nunitoBold text-body text-primary">
          + Новый набор
        </Text>
      </Pressable>
    ) : null;

  return (
    <FlatList
      style={[{ flex: 1 }, style]}
      ListHeaderComponent={newSet}
      ListEmptyComponent={
        chip === SETS ? (
          <Text className="px-1 font-nunito text-body text-textSecondary">
            Набор — свой список слов. Его можно тренировать и переводом, и
            письмом.
          </Text>
        ) : null
      }
      data={groups}
      keyExtractor={(group) => group.key}
      renderItem={renderGroup}
      extraData={renderGroup}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingVertical: 12, gap: 12 }}
      initialNumToRender={3}
      maxToRenderPerBatch={4}
      windowSize={5}
    />
  );
});

// ── Тема ─────────────────────────────────────────────────────────────────────

const GroupCard = memo(function GroupCard({
  group,
  getDots,
  onSelect,
  onTrain,
  onEdit,
}: {
  group: DictionaryGroup;
  getDots: GetDots;
  onSelect: (word: Word) => void;
  onTrain: (sourceId: string) => void;
  /** Только у своего набора: карандаш — редактор набора. */
  onEdit?: (setId: string) => void;
}) {
  // Освоено: слово на 3 точках во всех своих навыках
  const learned = group.words.filter((word) => {
    const reading = getDots(word, "reading") ?? 0;
    const writing = getDots(word, "writing");
    return (
      reading >= LEARNED_DOTS &&
      (writing === undefined || writing >= LEARNED_DOTS)
    );
  }).length;

  return (
    <View className="rounded-2xl bg-surface p-3">
      <View className="mb-1 flex-row items-center gap-2 px-1">
        <View className="flex-1">
          <Text
            numberOfLines={1}
            className="font-nunitoBold text-lead text-text"
          >
            {group.title}
          </Text>
          <Text className="font-nunito text-caption text-textSecondary">
            освоено {learned} из {group.words.length}
          </Text>
        </View>
        {onEdit && (
          <Pressable
            onPress={() => onEdit(group.sourceId)}
            hitSlop={8}
            className="h-10 w-10 items-center justify-center active:opacity-60"
            accessibilityRole="button"
            accessibilityLabel={`Изменить набор ${group.title}`}
          >
            <PencilIcon width={20} height={20} color={colors.primary} />
          </Pressable>
        )}
        {group.words.length > 0 && (
          <Pressable
            onPress={() => onTrain(group.sourceId)}
            className="min-h-10 justify-center rounded-full bg-primary px-4 active:opacity-80"
            accessibilityRole="button"
            accessibilityLabel={`Тренировать: ${group.title}`}
          >
            <Text className="font-nunitoBold text-small text-white">
              Тренировать
            </Text>
          </Pressable>
        )}
      </View>
      <PathWordGrid
        words={group.words}
        getDots={getDots}
        onSelect={onSelect}
        horizontalInset={GRID_INSET}
      />
    </View>
  );
});
