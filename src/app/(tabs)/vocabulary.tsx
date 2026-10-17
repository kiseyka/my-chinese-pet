// app/(tabs)/vocabulary.tsx
//
// «Словарь» — все слова приложения в одном месте:
//   - поиск по иероглифу, пиньиню без тонов и переводу (результаты — списком);
//   - чипсы: «Избранное», разделы HSK, «Другие слова»;
//   - слова раздела сгруппированы по темам — тем же, что этапы пути;
//     у каждого слова две строки точек: перевод (зелёные) и письмо (тёмные);
//   - тап по слову — панель слова (DictionaryWordSheet): точки навыков, избранное,
//     где слово на пути и «Показать», наборы.
// Тренировки из словаря — следующий шаг (кнопка у темы, набора и «Повторения»).

import { DictionaryWordSheet } from "@/components/dictionary/DictionaryWordSheet";
import { LevelChips } from "@/components/flashcards/LevelChips";
import { SetWordRow } from "@/components/flashcards/SetWordRow";
import { Screen } from "@/components/layout/Screen";
import { PathWordGrid } from "@/components/path/PathWordGrid";
import type { WordLevel } from "@/components/ui/LevelDots";
import { BackButton } from "@/components/ui/BackButton";
import { SearchField } from "@/components/ui/SearchField";
import { Title } from "@/components/ui/Title";
import type { Word } from "@/content/flashcards/types";
import { allWords } from "@/content/words/vocabulary";
import { useWordProgressStore } from "@/store/wordProgressStore";
import {
  describeDictionaryLevel,
  getDictionaryGroups,
  getDictionaryLevels,
  type DictionaryGroup,
} from "@/utils/dictionary";
import { getTrackDots, type TrackId } from "@/utils/path/stages";
import { searchWords } from "@/utils/searchWords";
import { getWritableWords, LEARNED_DOTS } from "@/utils/writing/words";
import { useRouter } from "expo-router";
import { memo, useCallback, useDeferredValue, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Text, View } from "react-native";

/** Отступы экрана (32) и карточки темы (2 × 12): на столько сетке меньше места. */
const GRID_INSET = 32 + 24;

/** Чипс «Избранное» (разделы HSK — числа от 0). */
const FAVORITES = -1;

/** Строке результата поиска действие «добавить/убрать» не нужно. */
const noop = () => {};

export default function DictionaryScreen() {
  const router = useRouter();
  const { t } = useTranslation(["sets"]);

  const flashcardWords = useWordProgressStore((s) => s.flashcardWords);
  const vocabularyWords = useWordProgressStore((s) => s.vocabularyWords);

  const [query, setQuery] = useState("");
  const isSearching = query.trim().length > 0;
  const results = useMemo(
    () => (isSearching ? searchWords(allWords, query, (key) => t(key)) : []),
    [isSearching, query, t],
  );

  const levels = getDictionaryLevels();
  const [chip, setChip] = useState<number>(() => levels[0]);
  // Чипс выделяется сразу, а тяжёлый показ раздела идёт следом
  const shownChip = useDeferredValue(chip);

  const chips = useMemo(
    () => [
      { key: FAVORITES, label: "Избранное" },
      ...levels.map((level) => ({
        key: level,
        label: describeDictionaryLevel(level),
      })),
    ],
    [levels],
  );

  const groups = useMemo<DictionaryGroup[]>(() => {
    if (shownChip !== FAVORITES) return getDictionaryGroups(shownChip);
    const favorites = allWords.filter(
      (word) => vocabularyWords[word.vocabularyId]?.isFavorite,
    );
    return [{ key: "favorites", title: "Избранное", words: favorites }];
  }, [shownChip, vocabularyWords]);

  // Какие слова можно писать — один раз на всю базу
  const writableIds = useMemo(
    () => new Set(getWritableWords(allWords).map((w) => w.vocabularyId)),
    [],
  );
  const getDots = useCallback(
    (word: Word, track: TrackId) =>
      track === "writing" && !writableIds.has(word.vocabularyId)
        ? undefined
        : getTrackDots(word, track, flashcardWords),
    [writableIds, flashcardWords],
  );

  const [opened, setOpened] = useState<Word | null>(null);

  const showStage = (stageId: string) => {
    setOpened(null);
    router.push({
      pathname: "/games/path/stage" as any,
      params: { id: stageId, from: "dictionary" },
    });
  };

  const renderGroup = useCallback(
    ({ item }: { item: DictionaryGroup }) => (
      <GroupCard group={item} getDots={getDots} onSelect={setOpened} />
    ),
    [getDots],
  );

  const favoritesEmpty =
    shownChip === FAVORITES && (groups[0]?.words.length ?? 0) === 0;

  return (
    <Screen>
      <DictionaryWordSheet
        word={opened}
        onShowStage={showStage}
        onClose={() => setOpened(null)}
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

      {isSearching ? (
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
      ) : (
        <>
          <View className="mt-3">
            <LevelChips chips={chips} value={chip} onChange={setChip} />
          </View>

          {favoritesEmpty ? (
            <View className="mt-4 gap-2 rounded-2xl bg-surface p-5">
              <Text className="font-nunitoBold text-lead text-text">
                Здесь будут твои любимые слова
              </Text>
              <Text className="font-nunito text-body text-textSecondary">
                Открой слово и нажми «Добавить в избранное».
              </Text>
            </View>
          ) : (
            <FlatList
              key={shownChip}
              data={groups}
              keyExtractor={(group) => group.key}
              renderItem={renderGroup}
              extraData={renderGroup}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingVertical: 12, gap: 12 }}
              initialNumToRender={4}
              maxToRenderPerBatch={4}
              windowSize={5}
            />
          )}
        </>
      )}
    </Screen>
  );
}

// ── Тема ─────────────────────────────────────────────────────────────────────

const GroupCard = memo(function GroupCard({
  group,
  getDots,
  onSelect,
}: {
  group: DictionaryGroup;
  getDots: (word: Word, track: TrackId) => number | undefined;
  onSelect: (word: Word) => void;
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
      <View className="mb-1 flex-row items-baseline justify-between px-1">
        <Text className="font-nunitoBold text-lead text-text">
          {group.title}
        </Text>
        <Text className="font-nunito text-caption text-textSecondary">
          освоено {learned} из {group.words.length}
        </Text>
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
