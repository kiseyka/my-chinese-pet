// src/screens/WritingExamScreen.tsx
//
// Экран экзамена по письму: слово за словом по памяти (сверху только пиньинь и перевод),
// после каждого слова — эталон рядом с твоим написанием и вердикт,
// в конце — итоги с печатями. Логика — в useWritingExam.

import CheckIcon from "@/assets/images/icons/circle-check.svg";
import { Screen } from "@/components/layout/Screen";
import { BackButton } from "@/components/ui/BackButton";
import { Hanzi } from "@/components/ui/Hanzi";
import { Pinyin } from "@/components/ui/Pinyin";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Title } from "@/components/ui/Title";
import { HanziView } from "@/components/writing/HanziView";
import { SealMark } from "@/components/writing/SealMark";
import { WritingCanvas } from "@/components/writing/WritingCanvas";
import type { Word } from "@/content/flashcards/types";
import {
  useWritingExam,
  type ExamStrokeNote,
  type ExamVerdict,
} from "@/hooks/writing/useWritingExam";
import { useRouter } from "expo-router";
import * as Speech from "expo-speech";
import { cssInterop } from "nativewind";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

cssInterop(CheckIcon, {
  className: { target: "style", nativeStyleToProp: { color: true } },
});

/** Набор переводов, где лежат переводы слов (как на экране урока). */
const WORDS_NAMESPACE = "sets";

/** Сравнение в конце слова: отступы экрана (px-4) и промежуток между иероглифами (gap-3). */
const SIDE_PADDING = 32;
const RESULT_GAP = 12;

const MISTAKE_MESSAGES = {
  wrong_position: "Черта в стороне — это ошибка. Попробуй ещё раз",
  wrong_direction: "Не в ту сторону — это ошибка. Попробуй ещё раз",
  wrong_shape: "Не та черта — это ошибка. Попробуй ещё раз",
} as const;

const VERDICT_TEXT: Record<ExamVerdict, { title: string; subtitle: string }> = {
  passed: { title: "Сдано!", subtitle: "Экзамен по слову сдан" },
  retry: { title: "Не сдано", subtitle: "Пересдать можно через сутки" },
  dropped: {
    title: "Не сдано",
    subtitle: "Второй провал подряд: слово теряет одну точку",
  },
};

/** Короткая подпись вердикта для итогов. */
const VERDICT_SHORT: Record<ExamVerdict, string> = {
  passed: "Сдано",
  retry: "Через сутки",
  dropped: "−1 точка",
};

function noteText(note: ExamStrokeNote | null, mistakesLeft: number): string {
  if (note?.kind === "moved") return "Черта верная — поставили её на место";
  if (note?.kind === "mistake") return MISTAKE_MESSAGES[note.reason];
  return mistakesLeft > 0
    ? `Можно ошибиться ещё ${mistakesLeft} раз`
    : "Ошибок больше быть не должно";
}

/**
 * Слог пиньиня для одного иероглифа слова («nǐ hǎo», 1 → «hǎo»).
 * Если слоги не совпадают по числу с иероглифами, возвращает пиньинь всего слова.
 */
function syllableOf(pinyin: string, charCount: number, charIndex: number) {
  const syllables = pinyin.trim().split(/\s+/);
  return syllables.length === charCount ? syllables[charIndex] : pinyin;
}

function speak(text: string) {
  Speech.stop();
  Speech.speak(text, { language: "zh-CN" });
}

function ExamHeader({ children }: { children?: ReactNode }) {
  return (
    <View className="flex-row items-center gap-3 pb-3 pr-4">
      <BackButton />
      <View className="flex-1">{children}</View>
    </View>
  );
}

interface WritingExamProps {
  buildWords: () => Word[];
}

function WritingExam({ buildWords }: WritingExamProps) {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const size = Math.min(width - 32, 340, Math.round(height * 0.38));

  const { t } = useTranslation([WORDS_NAMESPACE]);
  const exam = useWritingExam(buildWords);

  const {
    word,
    chars,
    charIndex,
    charData,
    phase,
    note,
    mistakesLeft,
    verdict,
    raws,
    completedRaws,
    rawStrokes,
    isLastWord,
    outcomes,
    handleStroke,
    continueAfterResult,
  } = exam;

  if (!exam.isReady) return <ExamHeader />;

  // Итоги экзамена
  if (phase === "finished") {
    const passed = outcomes.filter((o) => o.verdict === "passed").length;

    return (
      <>
        <ExamHeader>
          <Title>Итоги экзамена</Title>
        </ExamHeader>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        >
          <View className="items-center gap-2 py-4">
            <SealMark size={56} />
            <Text className="font-nunitoBold text-title text-text">
              Сдано {passed} из {outcomes.length}
            </Text>
          </View>

          <View className="gap-3">
            {outcomes.map((outcome) => (
              <View
                key={outcome.word.vocabularyId}
                className="flex-row items-center gap-3 rounded-2xl bg-surface px-4 py-3"
              >
                <View className="flex-row gap-1">
                  {outcome.chars.map((_, index) => (
                    <HanziView
                      key={index}
                      size={52}
                      rawStrokes={outcome.raws[index] ?? []}
                    />
                  ))}
                </View>

                <View className="flex-1">
                  <View className="flex-row items-baseline gap-2">
                    <Hanzi size={24}>{outcome.word.hanzi}</Hanzi>
                    <Pinyin size="sm">{outcome.word.pinyin}</Pinyin>
                  </View>
                  <Text
                    className="font-nunito text-small text-text"
                    numberOfLines={1}
                  >
                    {t(outcome.word.translation)}
                  </Text>
                </View>

                {outcome.verdict === "passed" ? (
                  <CheckIcon width={28} height={28} className="text-primary" />
                ) : (
                  <Text className="font-nunito text-caption text-text opacity-70">
                    {VERDICT_SHORT[outcome.verdict]}
                  </Text>
                )}
              </View>
            ))}
          </View>

          <Pressable
            onPress={() => router.back()}
            className="mt-6 min-h-12 items-center justify-center rounded-full bg-primary px-8 py-3"
          >
            <Text className="font-nunito text-body text-white">Готово</Text>
          </Pressable>
        </ScrollView>
      </>
    );
  }

  if (!exam.hasWords || !word || !chars || !charData) {
    return (
      <>
        <ExamHeader>
          <Title>Экзамен</Title>
        </ExamHeader>
        <View className="px-4">
          <Text className="font-nunito text-body text-text">
            Сейчас нет слов, готовых к экзамену.
          </Text>
        </View>
      </>
    );
  }

  const hanziList = Array.from(word.hanzi);
  const charPinyin = syllableOf(word.pinyin, hanziList.length, charIndex);
  // Ширина строки: экран минус боковые отступы (px-4) и промежутки gap-3 между иероглифами.
  // Подписи «Эталон» и «Твоё» стоят над строками и ширину не занимают
  const resultSize = Math.floor(
    Math.min(
      size / 2,
      (width - SIDE_PADDING - RESULT_GAP * (chars.length - 1)) / chars.length,
    ),
  );

  return (
    <>
      <ExamHeader>
        <ProgressBar progress={exam.progress} />
      </ExamHeader>

      <View className="items-center gap-3 px-4">
        {/* Слово: только пиньинь и перевод. Нажатие — озвучка */}
        <View className="items-center gap-1">
          <Pressable onPress={() => speak(word.hanzi)} hitSlop={12}>
            <Pinyin>{word.pinyin}</Pinyin>
          </Pressable>
          <Text className="font-nunito text-body text-text">
            {t(word.translation)}
          </Text>
        </View>

        {phase === "word_result" && verdict ? (
          <>
            <View className="items-center gap-3">
              <View className="items-center gap-1">
                <Text className="font-nunito text-small text-text opacity-70">
                  Эталон
                </Text>
                <View className="flex-row gap-3">
                  {chars.map((data, index) => (
                    <HanziView
                      key={`ref${index}`}
                      size={resultSize}
                      strokes={data.strokes}
                    />
                  ))}
                </View>
              </View>

              <View className="items-center gap-1">
                <Text className="font-nunito text-small text-text opacity-70">
                  Твоё
                </Text>
                <View className="flex-row gap-3">
                  {chars.map((_, index) => (
                    <HanziView
                      key={`raw${index}`}
                      size={resultSize}
                      rawStrokes={raws[index] ?? []}
                    />
                  ))}
                </View>
              </View>
            </View>

            <View className="items-center gap-1">
              {verdict === "passed" && (
                <CheckIcon width={44} height={44} className="text-primary" />
              )}
              <Text className="font-nunito text-title text-text">
                {VERDICT_TEXT[verdict].title}
              </Text>
              <Text className="text-center font-nunito text-small text-text opacity-70">
                {VERDICT_TEXT[verdict].subtitle}
              </Text>
            </View>

            <Pressable
              onPress={continueAfterResult}
              className="min-h-12 justify-center rounded-full bg-primary px-8 py-3"
            >
              <Text className="font-nunito text-body text-white">
                {isLastWord ? "Итоги" : "Дальше"}
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            {/* Что писать: иероглиф по его пиньиню */}
            <View className="min-h-14 flex-row items-center gap-3 rounded-full bg-surface px-6 py-2">
              <Text className="font-nunito text-lead text-text">Напиши</Text>
              <Pressable
                onPress={() => speak(hanziList[charIndex] ?? word.hanzi)}
                hitSlop={12}
              >
                <Pinyin size="lg">{charPinyin}</Pinyin>
              </Pressable>
            </View>

            {/* Уже написанные иероглифы слова */}
            {completedRaws.length > 0 && (
              <View className="flex-row gap-2">
                {completedRaws.map((raw, index) => (
                  <HanziView key={`done${index}`} size={52} rawStrokes={raw} />
                ))}
              </View>
            )}

            <WritingCanvas
              key={`${word.vocabularyId}-${charIndex}`}
              size={size}
              strokes={charData.strokes}
              outlineIndices={[]}
              snappedIndices={[]}
              rawStrokes={rawStrokes}
              hintIndex={null}
              disabled={phase !== "active"}
              onStroke={handleStroke}
            />

            <Text className="text-center font-nunito text-body text-text">
              {noteText(note, mistakesLeft)}
            </Text>
          </>
        )}
      </View>
    </>
  );
}

export default function WritingExamScreen({ buildWords }: WritingExamProps) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Screen>
        <WritingExam buildWords={buildWords} />
      </Screen>
    </GestureHandlerRootView>
  );
}
