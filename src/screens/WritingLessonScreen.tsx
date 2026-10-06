// src/screens/WritingLessonScreen.tsx
//
// Экран урока письма. Какие слова и в каком формате проходить, решает buildPlan.

import { Screen } from "@/components/layout/Screen";
import { BackButton } from "@/components/ui/BackButton";
import { Title } from "@/components/ui/Title";
import { DemoCanvas } from "@/components/writing/DemoCanvas";
import { HanziView } from "@/components/writing/HanziView";
import { WritingCanvas } from "@/components/writing/WritingCanvas";
import { useWritingLesson } from "@/hooks/writing/useWritingLesson";
import type { StrokeCheckReason } from "@/utils/strokeCheck";
import type { LessonItem } from "@/utils/writingLessons";
import * as Speech from "expo-speech";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

/** Набор переводов, где лежат переводы слов (ключи вида «greetings.thanks»). */
const WORDS_NAMESPACE = "sets";

const MESSAGES: Record<StrokeCheckReason, string> = {
  too_short: "Линия слишком короткая",
  wrong_direction: "Попробуй провести в другую сторону",
  wrong_shape: "Не совсем похоже, попробуй ещё раз",
};

interface WritingLessonProps {
  buildPlan: () => LessonItem[];
}

function WritingLesson({ buildPlan }: WritingLessonProps) {
  const { width, height } = useWindowDimensions();
  const size = Math.min(width - 32, 340, Math.round(height * 0.4));

  const { t } = useTranslation([WORDS_NAMESPACE]);
  const lesson = useWritingLesson(buildPlan);
  const [replayKey, setReplayKey] = useState(0);

  const {
    word,
    data,
    stage,
    roleLabel,
    phase,
    lastReason,
    assisted,
    finalRaw,
    isLastWord,
    outlineIndices,
    snappedIndices,
    rawStrokes,
    hintIndex,
    handleStroke,
    finishDemo,
    continueAfterResult,
  } = lesson;
  if (!lesson.isReady) return null;
  if (!lesson.hasWords || !word || !data || !stage) {
    return (
      <Text className="font-nunito text-base text-text">
        Пока нет иероглифов для тренировки.
      </Text>
    );
  }

  const speak = () => {
    Speech.stop();
    Speech.speak(word.hanzi, { language: "zh-CN" });
  };

  const isDemo = stage.mode === "demo";

  return (
    <View className="items-center gap-3">
      <Text className="font-nunito text-sm text-text">
        {roleLabel} · слово {lesson.wordIndex + 1} из {lesson.wordCount}
      </Text>

      {/* Что нужно написать: звук и перевод. Сам иероглиф показывает холст */}
      <View className="items-center gap-1">
        <View className="flex-row items-center gap-3">
          <Text className="font-nunito text-3xl text-text">{word.pinyin}</Text>
          <Pressable
            onPress={speak}
            hitSlop={8}
            className="h-11 w-11 items-center justify-center rounded-full bg-primary"
          >
            <Text style={{ fontSize: 20 }}>🔊</Text>
          </Pressable>
        </View>
        <Text className="font-nunito text-lg text-text">
          {t(word.translation)}
        </Text>
      </View>

      {phase === "word_result" ? (
        <>
          <View className="flex-row gap-4">
            <View className="items-center gap-1">
              <HanziView size={size / 2 - 8} strokes={data.strokes} />
              <Text className="font-nunito text-sm text-text">Эталон</Text>
            </View>

            <View className="items-center gap-1">
              <HanziView size={size / 2 - 8} rawStrokes={finalRaw} />
              <Text className="font-nunito text-sm text-text">Твоё</Text>
            </View>
          </View>

          <Text className="font-nunito text-xl text-text">
            {assisted ? "Написано с подсказками" : "Отлично, написано сам!"}
          </Text>

          <Pressable
            onPress={continueAfterResult}
            className="min-h-12 justify-center rounded-full bg-primary px-8 py-3"
          >
            <Text className="font-nunito text-base text-white">
              {isLastWord ? "Завершить" : "Дальше"}
            </Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text className="font-nunito text-base text-text">
            {stage.title} · {stage.modeLabel}
          </Text>
          <Text className="font-nunito text-xs text-text">
            Этап {lesson.stageIndex + 1} из {lesson.stageCount}
          </Text>

          {isDemo ? (
            <>
              <DemoCanvas
                key={`${word.vocabularyId}-${stage.id}`}
                size={size}
                strokes={data.strokes}
                medians={data.medians}
                strokeIndices={stage.strokeIndices}
                replayKey={replayKey}
              />

              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => setReplayKey((key) => key + 1)}
                  className="min-h-12 justify-center rounded-full bg-surface px-6 py-3"
                >
                  <Text className="font-nunito text-base text-text">
                    Ещё раз
                  </Text>
                </Pressable>

                <Pressable
                  onPress={finishDemo}
                  className="min-h-12 justify-center rounded-full bg-primary px-8 py-3"
                >
                  <Text className="font-nunito text-base text-white">
                    Дальше
                  </Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <WritingCanvas
                size={size}
                strokes={data.strokes}
                outlineIndices={outlineIndices}
                snappedIndices={snappedIndices}
                rawStrokes={rawStrokes}
                hintIndex={hintIndex}
                disabled={phase !== "active"}
                onStroke={handleStroke}
              />

              <Text className="font-nunito text-base text-text">
                {lastReason ? MESSAGES[lastReason] : " "}
                {hintIndex !== null ? ". Нужная черта подсвечена" : ""}
              </Text>
            </>
          )}
        </>
      )}
    </View>
  );
}

interface WritingLessonScreenProps {
  title: string;
  /** Должна быть стабильной ссылкой (функция уровня модуля), а не создаваться при каждом рендере. */
  buildPlan: () => LessonItem[];
}

export default function WritingLessonScreen({
  title,
  buildPlan,
}: WritingLessonScreenProps) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Screen>
        <View className="flex-row items-center justify-between pb-3">
          <BackButton />
          <Title>{title}</Title>
          <View style={{ width: 40 }} />
        </View>

        <View className="px-4">
          <WritingLesson buildPlan={buildPlan} />
        </View>
      </Screen>
    </GestureHandlerRootView>
  );
}
