// src/screens/WritingSetsScreen.tsx
//
// Вход в режим «Написание»: классическая тренировка, а также слова по наборам:
// из набора можно выбрать слово для свободной тренировки или повторить тему.

import { SetPreviewModal } from "@/components/game/SetPreviewModal";
import { Screen } from "@/components/layout/Screen";
import { BackButton } from "@/components/ui/BackButton";
import { Title } from "@/components/ui/Title";
import { practiceSets } from "@/content/flashcards/sets";
import type { PracticeSet } from "@/content/flashcards/types";
import { useWordProgressStore } from "@/store/wordProgressStore";
import {
  REVIEW_WORD_COUNT,
  getLearnedWords,
  getSimpleWords,
  groupByWritingLevel,
} from "@/utils/writingLessons";
import { getWritableWords } from "@/utils/writingWords";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function WritingSetsScreen() {
  const router = useRouter();
  const { t } = useTranslation(["sets"]);

  const [selectedSet, setSelectedSet] = useState<PracticeSet | null>(null);

  // Подписка на прогресс: экран перерисовывается при каждом его изменении
  const flashcardWords = useWordProgressStore((s) => s.flashcardWords);

  const groups = groupByWritingLevel(getSimpleWords(), flashcardWords);
  const summary = {
    total: groups.fresh.length + groups.learning.length + groups.learned.length,
    fresh: groups.fresh.length,
    learning: groups.learning.length,
    learned: groups.learned.length,
  };

  // Только наборы, где есть слова из одного иероглифа с данными о чертах
  const available = useMemo(
    () =>
      practiceSets
        .map((practiceSet) => ({
          practiceSet,
          writable: getWritableWords(practiceSet.words),
        }))
        .filter((item) => item.writable.length > 0),
    [],
  );

  const learnedInSelected = selectedSet
    ? getLearnedWords(selectedSet.words, flashcardWords).length
    : 0;
  const canReview = learnedInSelected >= REVIEW_WORD_COUNT;

  const startFree = (vocabularyId: string) => {
    setSelectedSet(null);
    router.push({
      pathname: "/games/writing/free" as any,
      params: { wordId: vocabularyId },
    });
  };

  const startReview = () => {
    if (!selectedSet || !canReview) return;

    const setId = selectedSet.id;
    setSelectedSet(null);
    router.push({
      pathname: "/games/writing/review" as any,
      params: { setId },
    });
  };

  return (
    <Screen>
      <View className="flex-row items-center justify-between">
        <BackButton href="/games" />
        <Title>Написание</Title>
        <View style={{ width: 40 }} />
      </View>

      <SetPreviewModal
        visible={!!selectedSet}
        practiceSet={selectedSet}
        skill="writing"
        onSelectWord={startFree}
        onClose={() => setSelectedSet(null)}
        footer={
          <View className="mb-3 gap-2">
            <Text className="font-nunito text-sm text-text">
              Нажми на слово, чтобы потренировать его в свободном режиме.
            </Text>

            <Pressable
              disabled={!canReview}
              onPress={startReview}
              className={`min-h-12 items-center justify-center rounded-2xl bg-surface px-4 py-3 active:opacity-70 ${
                canReview ? "" : "opacity-50"
              }`}
            >
              <Text className="font-nunito text-base text-text">
                Повторить тему
              </Text>
            </Pressable>

            {!canReview && (
              <Text className="font-nunito text-xs text-text">
                Нужно минимум {REVIEW_WORD_COUNT} освоенных слова набора, сейчас{" "}
                {learnedInSelected}.
              </Text>
            )}
          </View>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 16 }}
      >
        <View className="gap-6">
          <View className="gap-3">
            <Text className="font-nunito text-lg text-text">
              Простой уровень
            </Text>

            <Pressable
              disabled={summary.total === 0}
              onPress={() => router.push("/games/writing/classic" as any)}
              className={`rounded-3xl bg-surface px-5 py-5 gap-1 active:opacity-70 ${
                summary.total === 0 ? "opacity-50" : ""
              }`}
            >
              <Text className="font-nunito text-xl text-text">
                Классическая тренировка
              </Text>
              <Text className="font-nunito text-sm text-text">
                Одно слово для изучения и два повторения. Слова из одного слога.
              </Text>
              <Text className="font-nunito text-sm text-text">
                Новых: {summary.fresh} · В процессе: {summary.learning} ·
                Освоено: {summary.learned}
              </Text>
            </Pressable>
          </View>

          <View className="gap-3">
            <Text className="font-nunito text-lg text-text">
              Слова по наборам
            </Text>
            <Text className="font-nunito text-sm text-text">
              Открой набор: там видно, как продвигается каждое слово, и можно
              выбрать слово для свободной тренировки или повторить тему.
            </Text>

            {available.map(({ practiceSet, writable }) => (
              <Pressable
                key={practiceSet.id}
                onPress={() =>
                  setSelectedSet({ ...practiceSet, words: writable })
                }
                className="rounded-3xl bg-surface px-5 py-4 active:opacity-70"
              >
                <Text className="font-nunito text-lg text-text">
                  {t(practiceSet.title)}
                </Text>
                <Text className="font-nunito text-sm text-text">
                  Иероглифов для письма: {writable.length}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
