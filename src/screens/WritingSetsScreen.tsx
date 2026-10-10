// src/screens/WritingSetsScreen.tsx
//
// Вход в режим «Написание»:
//   - поиск по иероглифу, пиньиню (без тонов) и переводу;
//   - «Повторение»: слова, которые пользователь отрабатывает, и тренировка по ним;
//   - сетка слов текущего раздела HSK, разбитая на ступени по 10 слов (текущая ступень
//     развёрнута, остальные свёрнуты);
//   - следующие разделы HSK (пока закрыты) и «Другие слова» (свёрнуты).
// Нажатие на слово открывает выбор: что писать, в каком формате, и переключатель «Повторять».

import { Screen } from "@/components/layout/Screen";
import { BackButton } from "@/components/ui/BackButton";
import { Title } from "@/components/ui/Title";
import { HanziGrid } from "@/components/writing/HanziGrid";
import { PracticeChoiceModal } from "@/components/writing/PracticeChoiceModal";
import type { Word } from "@/content/flashcards/types";
import { useWordProgressStore } from "@/store/wordProgressStore";
import { colors } from "@/theme/colors";
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
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

/** Отступы Screen по бокам: от них считается ширина ячеек сетки. */
const SCREEN_INSET = 32;

/** Набор переводов, где лежат переводы слов (как на экране урока). */
const WORDS_NAMESPACE = "sets";

interface SectionHeaderProps {
  title: string;
  subtitle: string;
  expanded: boolean;
  onPress: () => void;
}

function SectionHeader({
  title,
  subtitle,
  expanded,
  onPress,
}: SectionHeaderProps) {
  return (
    <Pressable
      onPress={onPress}
      className="min-h-12 flex-row items-center justify-between rounded-2xl bg-surface px-4 py-3 active:opacity-70"
      accessibilityRole="button"
      accessibilityState={{ expanded }}
    >
      <Text className="font-nunito text-body text-text">{title}</Text>
      <View className="flex-row items-center gap-2">
        <Text className="font-nunito text-small text-text">{subtitle}</Text>
        <Text className="font-nunito text-body text-text">
          {expanded ? "▴" : "▾"}
        </Text>
      </View>
    </Pressable>
  );
}

export default function WritingSetsScreen() {
  const router = useRouter();
  const { t } = useTranslation([WORDS_NAMESPACE]);

  // Подписка на прогресс: точки, ступени и «Повторение» пересчитываются при изменении
  const flashcardWords = useWordProgressStore((s) => s.flashcardWords);
  const writingReview = useWordProgressStore((s) => s.writingReview);
  const toggleWritingReview = useWordProgressStore(
    (s) => s.toggleWritingReview,
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

  // Развёрнутые блоки: «step-3», «review» или «other». Сначала — текущая ступень
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

  const [selected, setSelected] = useState<Word | null>(null);
  const characters = useMemo(
    () => (selected ? getWordCharacters(selected) : []),
    [selected],
  );

  const getLevel = (word: Word) => getWordWritingDots(word, flashcardWords);
  const isInReview = (word: Word) => !!writingReview[word.vocabularyId];

  const start = (word: Word, format: FreeFormat) => {
    setSelected(null);
    router.push({
      pathname: "/games/writing/free" as any,
      params: { wordId: word.vocabularyId, format },
    });
  };

  const startRepeat = () => {
    if (repeatWords.length === 0) return;
    router.push("/games/writing/review" as any);
  };

  const grid = (words: Word[]) => (
    <HanziGrid
      words={words}
      getLevel={getLevel}
      onSelect={setSelected}
      isMarked={isInReview}
      horizontalInset={SCREEN_INSET}
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
        onStart={start}
        onClose={() => setSelected(null)}
      />

      {/* Поиск */}
      <View className="mt-3 min-h-12 flex-row items-center rounded-2xl bg-surface px-4">
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Иероглиф, пиньинь или перевод"
          placeholderTextColor={colors.textSecondary}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          className="flex-1 py-3 font-nunito text-body text-text"
          accessibilityLabel="Поиск слова"
        />
        {isSearching && (
          <Pressable
            onPress={() => setQuery("")}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Очистить поиск"
          >
            <Text className="font-nunito text-title text-text">✕</Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingVertical: 16, gap: 12 }}
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
            {/* Повторение */}
            {repeatWords.length > 0 && (
              <View className="gap-3">
                <SectionHeader
                  title="Повторение"
                  subtitle={`${repeatWords.length}`}
                  expanded={expanded.has("review")}
                  onPress={() => toggle("review")}
                />

                <Pressable
                  onPress={startRepeat}
                  className="min-h-12 items-center justify-center rounded-2xl bg-primary px-4 py-3 active:opacity-80"
                >
                  <Text className="font-nunitoBold text-body text-white">
                    Повторить
                    {repeatWords.length > REPEAT_LESSON_SIZE
                      ? ` (${REPEAT_LESSON_SIZE} из ${repeatWords.length})`
                      : ""}
                  </Text>
                </Pressable>

                {expanded.has("review") && grid(repeatWords)}
              </View>
            )}

            {progress && currentLevel !== undefined && (
              <>
                <Text className="font-nunitoBold text-title text-text">
                  {describeLevel(currentLevel)}
                </Text>
                <Text className="font-nunito text-body text-text">
                  Выбери слово, чтобы потренировать его. Точки под словом —
                  сколько раз оно написано по памяти.
                </Text>

                {progress.steps.map((step, index) => {
                  const key = `step-${index}`;
                  const isOpen = expanded.has(key);
                  const isCurrent = index === progress.currentIndex;

                  return (
                    <View key={key} className="gap-3">
                      <SectionHeader
                        title={`Ступень ${index + 1}${isCurrent ? " · сейчас" : ""}`}
                        subtitle={`${step.started}/${step.words.length}`}
                        expanded={isOpen}
                        onPress={() => toggle(key)}
                      />
                      {isOpen && grid(step.words)}
                    </View>
                  );
                })}
              </>
            )}

            {/* Следующие разделы HSK */}
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
                {expanded.has("other") && grid(getLevelSequence(NO_HSK_LEVEL))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
