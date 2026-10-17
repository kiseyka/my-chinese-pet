// app/(tabs)/games/writing/exam.tsx
//
// Экзамен по письму: слово за словом по памяти (сверху только пиньинь и перевод),
// после каждого слова — эталон рядом с твоим написанием и вердикт,
// в конце — итоги с печатями. Логика — в useWritingExam.
//
// wordIds — id слов через запятую. Берём только слова, которые прямо сейчас готовы
// к экзамену: так вернуться назад и пересдать уже сданное слово не выйдет.

import CheckIcon from "@/assets/images/icons/circle-check.svg";
import { Screen } from "@/components/layout/Screen";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Title } from "@/components/ui/Title";
import { WritingCanvas } from "@/components/writing/canvas/WritingCanvas";
import {
  PillButton,
  ResultComparison,
  TaskPill,
  TaskPinyin,
  TrainingHeader,
  WordHeading,
  WrittenChars,
} from "@/components/writing/lesson/LessonParts";
import { ExamResultsList } from "@/components/writing/results/ExamResultsList";
import type { Word } from "@/content/flashcards/types";
import { useSpeakHanzi } from "@/hooks/useSpeakHanzi";
import { useCanvasSize } from "@/hooks/writing/useCanvasSize";
import {
  useWritingExam,
  type ExamStrokeNote,
  type ExamVerdict,
} from "@/hooks/writing/useWritingExam";
import { interopIconColor } from "@/lib/interopIcon";
import {
  getWritingExamStatus,
  useWordProgressStore,
} from "@/store/wordProgressStore";
import { findPracticeWords, syllableOf } from "@/utils/writing/words";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useGameStore } from "@/store/gameStore";
import { useCallback } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

interopIconColor(CheckIcon);

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

function noteText(note: ExamStrokeNote | null, mistakesLeft: number): string {
  if (note?.kind === "moved") return "Черта верная — поставили её на место";
  if (note?.kind === "mistake") return MISTAKE_MESSAGES[note.reason];
  return mistakesLeft > 0
    ? `Можно ошибиться ещё ${mistakesLeft} раз`
    : "Ошибок больше быть не должно";
}

interface WritingExamProps {
  buildWords: () => Word[];
}

function WritingExam({ buildWords }: WritingExamProps) {
  const router = useRouter();
  const size = useCanvasSize();
  const { speakForced } = useSpeakHanzi();
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

  if (!exam.isReady) return <TrainingHeader />;

  // Итоги экзамена
  if (phase === "finished") {
    return (
      <>
        <TrainingHeader>
          <Title>Итоги экзамена</Title>
        </TrainingHeader>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        >
          <ExamResultsList outcomes={outcomes} />

          <Pressable
            // Не router.back(): в табах он уводит на панду. Туда, откуда запускали
            onPress={() =>
              router.replace(
                useGameStore.getState().returnTo ?? "/games/writing/sets",
              )
            }
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
        <TrainingHeader>
          <Title>Экзамен</Title>
        </TrainingHeader>
        <View className="px-4">
          <Text className="font-nunito text-body text-text">
            Сейчас нет слов, готовых к экзамену.
          </Text>
        </View>
      </>
    );
  }

  const hanziList = Array.from(word.hanzi);
  const charHanzi = hanziList[charIndex] ?? word.hanzi;
  const charPinyin = syllableOf(word.pinyin, hanziList.length, charIndex);

  return (
    <>
      <TrainingHeader>
        <ProgressBar progress={exam.progress} />
      </TrainingHeader>

      <View className="items-center gap-3 px-4">
        {/* Слово: только пиньинь и перевод. Нажатие — озвучка */}
        <WordHeading word={word} onSpeak={() => speakForced(word.hanzi)} />

        {phase === "word_result" && verdict ? (
          <>
            <ResultComparison chars={chars} raws={raws} canvasSize={size} />

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

            <PillButton
              label={isLastWord ? "Итоги" : "Дальше"}
              onPress={continueAfterResult}
            />
          </>
        ) : (
          <>
            {/* Что писать: иероглиф по его пиньиню */}
            <TaskPill action="Напиши">
              <TaskPinyin
                pinyin={charPinyin}
                onSpeak={() => speakForced(charHanzi)}
              />
            </TaskPill>

            {/* Уже написанные иероглифы слова */}
            <WrittenChars items={completedRaws.map((raw) => ({ raw }))} />

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

export default function WritingExamRoute() {
  const { wordIds } = useLocalSearchParams<{ wordIds?: string }>();

  const buildWords = useCallback(() => {
    if (!wordIds) return [];

    const { flashcardWords, writingExams } = useWordProgressStore.getState();
    const ids = wordIds.split(",").filter(Boolean);

    return findPracticeWords(ids).filter(
      (word) =>
        getWritingExamStatus(
          flashcardWords[word.vocabularyId],
          writingExams[word.vocabularyId],
        ).status === "ready",
    );
  }, [wordIds]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Screen>
        <WritingExam buildWords={buildWords} />
      </Screen>
    </GestureHandlerRootView>
  );
}
