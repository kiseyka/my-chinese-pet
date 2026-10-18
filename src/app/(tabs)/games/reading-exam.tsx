// app/(tabs)/games/reading-exam.tsx
//
// Экзамен по переводу — «обратный перевод»: показан перевод, нужно выбрать иероглиф
// из четырёх похожих вариантов. Одна попытка на слово. После ответа — верный вариант
// с пиньинем и вердикт; в конце — итоги с печатью. Логика — в useReadingExam,
// подбор вариантов — в utils/readingExam.ts.
//
// wordIds — id слов через запятую. Берём только слова, которые прямо сейчас готовы
// к экзамену (3 точки перевода и прошли сутки), не больше READING_EXAM_SIZE.

import CheckIcon from "@/assets/images/icons/circle-check.svg";
import { Screen } from "@/components/layout/Screen";
import { BackButton } from "@/components/ui/BackButton";
import { Hanzi } from "@/components/ui/Hanzi";
import { Pinyin } from "@/components/ui/Pinyin";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Title } from "@/components/ui/Title";
import { SealMark } from "@/components/writing/SealMark";
import type { Word } from "@/content/flashcards/types";
import { findWords } from "@/content/words/vocabulary";
import {
  useReadingExam,
  type ReadingExamVerdict,
} from "@/hooks/useReadingExam";
import { interopIconColor } from "@/lib/interopIcon";
import { useGameStore } from "@/store/gameStore";
import {
  getWritingExamStatus,
  useWordProgressStore,
} from "@/store/wordProgressStore";
import { READING_EXAM_SIZE } from "@/utils/readingExam";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";

interopIconColor(CheckIcon);

const VERDICT_TEXT: Record<
  ReadingExamVerdict,
  { title: string; subtitle: string }
> = {
  passed: { title: "Сдано!", subtitle: "Экзамен по слову сдан" },
  retry: { title: "Не сдано", subtitle: "Пересдать можно через сутки" },
  dropped: {
    title: "Не сдано",
    subtitle: "Второй провал подряд: слово теряет одну точку перевода",
  },
};

const VERDICT_SHORT: Record<ReadingExamVerdict, string> = {
  passed: "Сдано",
  retry: "Через сутки",
  dropped: "−1 точка",
};

export default function ReadingExamRoute() {
  const { wordIds } = useLocalSearchParams<{ wordIds?: string }>();

  // Слова — один раз при входе: только готовые к экзамену прямо сейчас
  const [words] = useState<Word[]>(() => {
    const { flashcardWords, readingExams } = useWordProgressStore.getState();
    const now = Date.now();
    return findWords((wordIds ?? "").split(",").filter(Boolean))
      .filter(
        (word) =>
          getWritingExamStatus(
            flashcardWords[word.vocabularyId],
            readingExams[word.vocabularyId],
            now,
            "reading",
          ).status === "ready",
      )
      .slice(0, READING_EXAM_SIZE);
  });

  return <ReadingExam words={words} />;
}

function ReadingExam({ words }: { words: Word[] }) {
  const router = useRouter();
  const { t } = useTranslation(["sets"]);
  const exitTo = useGameStore((state) => state.returnTo) ?? "/vocabulary";
  const exam = useReadingExam(words);

  if (exam.isEmpty) {
    return (
      <Screen>
        <BackButton href={exitTo} />
        <Text className="mt-6 font-nunito text-body text-text">
          Сейчас нет слов, готовых к экзамену по переводу.
        </Text>
      </Screen>
    );
  }

  if (exam.finished) {
    const passed = exam.outcomes.filter((o) => o.verdict === "passed").length;
    return (
      <Screen>
        <Title>Экзамен по переводу</Title>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          <View className="items-center gap-2 py-4">
            <SealMark size={56} />
            <Text className="font-nunitoBold text-title text-text">
              Сдано {passed} из {exam.outcomes.length}
            </Text>
          </View>

          <View className="gap-3">
            {exam.outcomes.map((outcome) => (
              <View
                key={outcome.word.vocabularyId}
                className="flex-row items-center gap-3 rounded-2xl bg-surface px-4 py-3"
              >
                <View className="flex-1">
                  <View className="flex-row items-baseline gap-2">
                    <Hanzi size={24}>{outcome.word.hanzi}</Hanzi>
                    <Pinyin size="sm">{outcome.word.pinyin}</Pinyin>
                  </View>
                  <Text
                    numberOfLines={1}
                    className="font-nunito text-small text-text"
                  >
                    {t(outcome.word.translation)}
                  </Text>
                </View>
                {outcome.verdict === "passed" ? (
                  <CheckIcon width={28} height={28} className="text-primary" />
                ) : (
                  <Text className="font-nunito text-caption text-textSecondary">
                    {VERDICT_SHORT[outcome.verdict]}
                  </Text>
                )}
              </View>
            ))}
          </View>

          <Pressable
            onPress={() => router.replace(exitTo)}
            className="mt-6 min-h-12 items-center justify-center rounded-full bg-primary px-8 py-3 active:opacity-80"
            accessibilityRole="button"
          >
            <Text className="font-nunitoBold text-body text-white">Готово</Text>
          </Pressable>
        </ScrollView>
      </Screen>
    );
  }

  const { current, chosen, verdict } = exam;
  if (!current) return null;
  const correctId = current.word.vocabularyId;

  return (
    <Screen>
      <View className="flex-row items-center gap-3 pb-3 pr-4">
        <BackButton href={exitTo} />
        <View className="flex-1">
          <ProgressBar progress={exam.progress} />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 16, gap: 20 }}
      >
        <View className="items-center gap-2">
          <Text className="font-nunito text-small text-textSecondary">
            Экзамен по переводу · какой иероглиф значит
          </Text>
          <Text className="text-center font-nunitoBold text-title text-text">
            {t(current.word.translation)}
          </Text>
        </View>

        <View className="flex-row flex-wrap justify-between gap-y-3">
          {current.options.map((option) => {
            const isCorrect = option.vocabularyId === correctId;
            const isChosen = chosen?.vocabularyId === option.vocabularyId;
            const state = !chosen
              ? "idle"
              : isCorrect
                ? "correct"
                : isChosen
                  ? "wrong"
                  : "dimmed";

            return (
              <Pressable
                key={option.vocabularyId}
                onPress={() => exam.choose(option)}
                disabled={!!chosen}
                className={`h-28 items-center justify-center rounded-2xl border-2 px-2 ${
                  state === "correct"
                    ? "border-primary bg-primary/15"
                    : state === "wrong"
                      ? "border-error bg-error/10"
                      : "border-transparent bg-surface active:opacity-70"
                } ${state === "dimmed" ? "opacity-40" : ""}`}
                style={{ width: "48%" }}
                accessibilityRole="button"
                accessibilityLabel={option.hanzi}
              >
                <Hanzi
                  size={Array.from(option.hanzi).length > 2 ? 32 : 44}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  maxFontSizeMultiplier={1.2}
                >
                  {option.hanzi}
                </Hanzi>
                {chosen && (isCorrect || isChosen) && (
                  <Pinyin size="sm">{option.pinyin}</Pinyin>
                )}
              </Pressable>
            );
          })}
        </View>

        {verdict && (
          <View className="items-center gap-1">
            <Text
              className={`font-nunitoBold text-lead ${
                verdict === "passed" ? "text-primary" : "text-error"
              }`}
            >
              {VERDICT_TEXT[verdict].title}
            </Text>
            <Text className="text-center font-nunito text-small text-textSecondary">
              {VERDICT_TEXT[verdict].subtitle}
            </Text>
            <Pressable
              onPress={exam.next}
              className="mt-4 min-h-12 items-center justify-center self-stretch rounded-full bg-primary px-8 py-3 active:opacity-80"
              accessibilityRole="button"
            >
              <Text className="font-nunitoBold text-body text-white">
                Дальше
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
