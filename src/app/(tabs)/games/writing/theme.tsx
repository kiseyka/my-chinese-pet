// app/(tabs)/games/writing/theme.tsx
//
// Экран одной темы (ступени) с карты пути «Написания» (level, index):
//   - шапка: назад, иероглиф темы в кружке, название и «изучено N из M»;
//   - «Тренировать» — та же тренировка ступени, что «Продолжить» на карте
//     (1 новое слово + 2 повторения из этой ступени);
//   - сетка слов с точками письма; тап по слову открывает то же окно слова,
//     что на главном экране (что писать, формат, «Повторение», экзамен).
// Данные и окно слова — из useWritingHome, как на главном экране.

import { Screen } from "@/components/layout/Screen";
import { BackButton } from "@/components/ui/BackButton";
import { Hanzi } from "@/components/ui/Hanzi";
import { WordGrid } from "@/components/writing/home/WordGrid";
import { PracticeChoiceModal } from "@/components/writing/modals/PracticeChoiceModal";
import { useWritingHome } from "@/hooks/writing/useWritingHome";
import { useWordProgressStore } from "@/store/wordProgressStore";
import {
  getLevelSteps,
  getStepGlyph,
  getStepTitle,
} from "@/utils/writing/steps";
import {
  LEARNED_DOTS,
  describeLevel,
  getWordWritingDots,
} from "@/utils/writing/words";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

/** Отступы экрана (32) и карточки с сеткой (2 × 12). */
const GRID_INSET = 32 + 24;

export default function WritingThemeScreen() {
  const params = useLocalSearchParams<{ level?: string; index?: string }>();
  const level = Number(params.level ?? 1);
  const index = Number(params.index ?? 0);

  const router = useRouter();
  const home = useWritingHome();
  const flashcardWords = useWordProgressStore((state) => state.flashcardWords);

  const words = useMemo(
    () => getLevelSteps(level)[index] ?? [],
    [level, index],
  );
  const title = getStepTitle(level, index);
  const glyph = getStepGlyph(words);

  const learned = words.filter(
    (word) => getWordWritingDots(word, flashcardWords) >= LEARNED_DOTS,
  ).length;

  const start = () =>
    router.push({
      pathname: "/games/writing/step" as any,
      params: { level: String(level), index: String(index) },
    });

  return (
    <Screen>
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

      <View className="flex-row items-center">
        <BackButton />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 16, gap: 16 }}
      >
        <View className="flex-row items-center gap-4">
          <View
            className="items-center justify-center rounded-full border-4 border-primary bg-surface"
            style={{ width: 72, height: 72 }}
          >
            <Hanzi size={34} className="text-text" maxFontSizeMultiplier={1.2}>
              {glyph}
            </Hanzi>
          </View>
          <View className="flex-1">
            <Text className="font-nunito text-caption text-textSecondary">
              {describeLevel(level)}
            </Text>
            <Text className="font-nunitoBold text-title text-text">
              {title}
            </Text>
            <Text className="font-nunito text-small text-textSecondary">
              Изучено {learned} из {words.length}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={start}
          disabled={words.length === 0}
          className="items-center rounded-2xl bg-primary py-3.5 active:opacity-80"
          accessibilityRole="button"
          accessibilityLabel={`Тренировать: ${title}`}
        >
          <Text className="font-nunitoBold text-body text-white">
            Тренировать
          </Text>
        </Pressable>

        <View className="rounded-2xl bg-surface p-3">
          <WordGrid
            words={words}
            getLevel={home.getLevel}
            onSelect={home.setSelected}
            isMarked={home.isInReview}
            getExamMark={home.getExamMark}
            horizontalInset={GRID_INSET}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
