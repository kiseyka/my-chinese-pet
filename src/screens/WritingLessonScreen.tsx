// src/screens/WritingLessonScreen.tsx
//
// Экран урока письма. Какие слова и в каком формате проходить, решает buildPlan.

import { Screen } from "@/components/layout/Screen";
import { BackButton } from "@/components/ui/BackButton";
import { Pinyin } from "@/components/ui/Pinyin";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Title } from "@/components/ui/Title";
import { DemoCanvas } from "@/components/writing/DemoCanvas";
import { HanziView } from "@/components/writing/HanziView";
import { WritingCanvas } from "@/components/writing/WritingCanvas";
import { useWritingLesson } from "@/hooks/writing/useWritingLesson";
import type { StrokeCheckReason } from "@/utils/strokeCheck";
import type { LessonItem } from "@/utils/writingLessons";
import type { StageMode } from "@/utils/writingStages";
import * as Speech from "expo-speech";
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

/** Набор переводов, где лежат переводы слов (ключи вида «greetings.thanks»). */
const WORDS_NAMESPACE = "sets";

/** Сравнение в конце слова: отступы экрана (px-4) и промежуток между иероглифами (gap-3). */
const SIDE_PADDING = 32;
const RESULT_GAP = 12;

const MESSAGES: Record<StrokeCheckReason, string> = {
  too_short: "Линия слишком короткая",
  wrong_position: "Почти! Черта верная, но чуть в стороне",
  wrong_direction: "Попробуй провести в другую сторону",
  wrong_shape: "Не совсем похоже, попробуй ещё раз",
};

/** Глагол этапа: что делать с текущей частью или иероглифом. */
const ACTIONS: Record<StageMode, string> = {
  demo: "Как пишется",
  outline: "Обведи",
  memory: "Напиши",
};

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

/** Шапка урока: кнопка «назад» и шкала прогресса (или заголовок, если шкалы нет). */
function LessonHeader({ children }: { children?: ReactNode }) {
  return (
    <View className="flex-row items-center gap-3 pb-3 pr-4">
      <BackButton />
      <View className="flex-1">{children}</View>
    </View>
  );
}

interface WritingLessonProps {
  title: string;
  buildPlan: () => LessonItem[];
}

function WritingLesson({ title, buildPlan }: WritingLessonProps) {
  const { width, height } = useWindowDimensions();
  const size = Math.min(width - 32, 340, Math.round(height * 0.38));

  const { t } = useTranslation([WORDS_NAMESPACE]);
  const lesson = useWritingLesson(buildPlan);
  const [replayKey, setReplayKey] = useState(0);

  const {
    word,
    chars,
    stage,
    slot,
    slotData,
    phase,
    lastReason,
    assisted,
    finalRaws,
    completedSlots,
    isLastWord,
    outlineIndices,
    snappedIndices,
    rawStrokes,
    hintIndex,
    handleStroke,
    finishDemo,
    continueAfterResult,
  } = lesson;

  if (!lesson.isReady) return <LessonHeader />;

  if (!lesson.hasWords || !word || !chars || !stage || !slot || !slotData) {
    return (
      <>
        <LessonHeader>
          <Title>{title}</Title>
        </LessonHeader>
        <View className="px-4">
          <Text className="font-nunito text-body text-text">
            Пока нет иероглифов для тренировки.
          </Text>
        </View>
      </>
    );
  }

  const isDemo = stage.mode === "demo";
  const isMemory = stage.mode === "memory";
  const isResult = phase === "word_result";

  // Текущий иероглиф слова (для пиньиня в этапе и озвучки)
  const hanziList = Array.from(word.hanzi);
  const slotHanzi = hanziList[slot.charIndex] ?? word.hanzi;
  const slotPinyin = syllableOf(word.pinyin, hanziList.length, slot.charIndex);

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
      <LessonHeader>
        <ProgressBar progress={lesson.progress} />
      </LessonHeader>

      <View className="items-center gap-3 px-4">
        {/* Заголовок: слово, которое выбрали тренировать. Нажатие — озвучка слова */}
        <View className="items-center gap-1">
          <Pressable onPress={() => speak(word.hanzi)} hitSlop={12}>
            <Pinyin>{word.pinyin}</Pinyin>
          </Pressable>
          <Text className="font-nunito text-body text-text">
            {t(word.translation)}
          </Text>
        </View>

        {isResult ? (
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
                      rawStrokes={finalRaws[index] ?? []}
                    />
                  ))}
                </View>
              </View>
            </View>

            <Text className="font-nunito text-title text-text">
              {assisted ? "Написано с подсказками" : "Отлично, сам написал!"}
            </Text>

            <Pressable
              onPress={continueAfterResult}
              className="min-h-12 justify-center rounded-full bg-primary px-8 py-3"
            >
              <Text className="font-nunito text-body text-white">
                {isLastWord ? "Завершить" : "Дальше"}
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            {/* Этап: что сейчас делать и с чем. Часть — её знак, иероглиф — пиньинь */}
            <View className="min-h-14 flex-row items-center gap-3 rounded-full bg-surface px-6 py-2">
              <Text className="font-nunito text-lead text-text">
                {ACTIONS[stage.mode]}
              </Text>

              {slot.target.kind === "part" ? (
                <Text
                  className="text-primary"
                  style={{ fontSize: 34, lineHeight: 42 }}
                >
                  {slot.target.label}
                </Text>
              ) : (
                <Pressable onPress={() => speak(slotHanzi)} hitSlop={12}>
                  <Pinyin size="lg">{slotPinyin}</Pinyin>
                </Pressable>
              )}
            </View>

            {/* Уже написанные иероглифы слова */}
            {completedSlots.length > 0 && (
              <View className="flex-row gap-2">
                {completedSlots.map((done, index) => (
                  <HanziView
                    key={`done${index}`}
                    size={52}
                    strokes={
                      isMemory ? undefined : chars[done.charIndex].strokes
                    }
                    rawStrokes={isMemory ? done.raw : undefined}
                  />
                ))}
              </View>
            )}

            {isDemo ? (
              <>
                <DemoCanvas
                  key={`${word.vocabularyId}-${stage.id}-${lesson.slotIndex}`}
                  size={size}
                  strokes={slotData.strokes}
                  medians={slotData.medians}
                  strokeIndices={slot.strokeIndices}
                  replayKey={replayKey}
                />

                <View className="flex-row gap-3">
                  <Pressable
                    onPress={() => setReplayKey((key) => key + 1)}
                    className="min-h-12 justify-center rounded-full bg-surface px-6 py-3"
                  >
                    <Text className="font-nunito text-body text-text">
                      Ещё раз
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={finishDemo}
                    className="min-h-12 justify-center rounded-full bg-primary px-8 py-3"
                  >
                    <Text className="font-nunito text-body text-white">
                      Дальше
                    </Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <WritingCanvas
                  key={`${word.vocabularyId}-${stage.id}-${lesson.slotIndex}`}
                  size={size}
                  strokes={slotData.strokes}
                  outlineIndices={outlineIndices}
                  snappedIndices={snappedIndices}
                  rawStrokes={rawStrokes}
                  hintIndex={hintIndex}
                  disabled={phase !== "active"}
                  onStroke={handleStroke}
                />

                <Text className="font-nunito text-body text-text">
                  {lastReason ? MESSAGES[lastReason] : " "}
                  {hintIndex !== null ? ". Нужная черта подсвечена" : ""}
                </Text>
              </>
            )}
          </>
        )}
      </View>
    </>
  );
}

interface WritingLessonScreenProps {
  /** Показывается в шапке, только если слов для тренировки нет (иначе там шкала). */
  title: string;
  /** Должна быть стабильной ссылкой (функция уровня модуля или useCallback). */
  buildPlan: () => LessonItem[];
}

export default function WritingLessonScreen({
  title,
  buildPlan,
}: WritingLessonScreenProps) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Screen>
        <WritingLesson title={title} buildPlan={buildPlan} />
      </Screen>
    </GestureHandlerRootView>
  );
}
