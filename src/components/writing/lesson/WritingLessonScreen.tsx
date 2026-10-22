// src/components/writing/lesson/WritingLessonScreen.tsx
//
// Экран урока письма. Лежит не в app/, потому что его открывают несколько маршрутов
// (free / review / classic): каждый передаёт свой buildPlan — какие слова и в каком
// формате проходить. Ход урока — в useWritingLesson.

import { Screen } from "@/components/layout/Screen";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Title } from "@/components/ui/Title";
import { DemoCanvas } from "../canvas/DemoCanvas";
import { WritingCanvas } from "../canvas/WritingCanvas";
import {
  PillButton,
  ResultComparison,
  TaskPill,
  TaskPinyin,
  TrainingHeader,
  WordHeading,
  WrittenChars,
} from "./LessonParts";
import { useSpeakHanzi } from "@/hooks/useSpeakHanzi";
import { useCanvasSize } from "@/hooks/writing/useCanvasSize";
import { useWritingLesson } from "@/hooks/writing/useWritingLesson";
import type { LessonItem } from "@/utils/writing/plans";
import type { StageMode } from "@/utils/writing/stages";
import type { StrokeCheckReason } from "@/utils/writing/strokeCheck";
import { syllableOf } from "@/utils/writing/words";
import { useState } from "react";
import { Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

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

interface WritingLessonProps {
  title: string;
  buildPlan: () => LessonItem[];
}

function WritingLesson({ title, buildPlan }: WritingLessonProps) {
  const size = useCanvasSize();
  const { speakForced } = useSpeakHanzi();
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

  if (!lesson.isReady) return <TrainingHeader />;

  if (!lesson.hasWords || !word || !chars || !stage || !slot || !slotData) {
    return (
      <>
        <TrainingHeader>
          <Title>{title}</Title>
        </TrainingHeader>
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
  const canvasKey = `${word.vocabularyId}-${stage.id}-${lesson.slotIndex}`;

  // Текущий иероглиф слова (для пиньиня в этапе и озвучки)
  const hanziList = Array.from(word.hanzi);
  const slotHanzi = hanziList[slot.charIndex] ?? word.hanzi;
  const slotPinyin = syllableOf(word.pinyin, hanziList.length, slot.charIndex);

  return (
    <>
      <TrainingHeader>
        <ProgressBar progress={lesson.progress} />
      </TrainingHeader>

      <View className="items-center gap-3 px-4">
        {/* Слово, которое выбрали тренировать. Нажатие — озвучка */}
        <WordHeading word={word} onSpeak={() => speakForced(word.hanzi)} />

        {phase === "word_result" ? (
          <>
            <ResultComparison chars={chars} raws={finalRaws} canvasSize={size} />

            <Text className="font-nunito text-title text-text">
              {assisted ? "Написано с подсказками" : "Отлично, сам написал!"}
            </Text>

            <PillButton
              label={isLastWord ? "Завершить" : "Дальше"}
              onPress={continueAfterResult}
            />
          </>
        ) : (
          <>
            {/* Что сейчас делать и с чем. Часть — её знак, иероглиф — пиньинь */}
            <TaskPill action={ACTIONS[stage.mode]}>
              {slot.target.kind === "part" ? (
                <Text
                  className="text-primary"
                  style={{ fontSize: 34, lineHeight: 42 }}
                >
                  {slot.target.label}
                </Text>
              ) : (
                <TaskPinyin
                  pinyin={slotPinyin}
                  onSpeak={() => speakForced(slotHanzi)}
                />
              )}
            </TaskPill>

            {/* Уже написанные иероглифы слова: по памяти — твоё, иначе эталон */}
            <WrittenChars
              items={completedSlots.map((done) =>
                isMemory
                  ? { raw: done.raw }
                  : { strokes: chars[done.charIndex].strokes },
              )}
            />

            {isDemo ? (
              <>
                <DemoCanvas
                  key={canvasKey}
                  size={size}
                  strokes={slotData.strokes}
                  medians={slotData.medians}
                  strokeIndices={slot.strokeIndices}
                  replayKey={replayKey}
                />

                <View className="flex-row gap-3">
                  <PillButton
                    label="Ещё раз"
                    variant="secondary"
                    onPress={() => setReplayKey((key) => key + 1)}
                  />
                  <PillButton label="Дальше" onPress={finishDemo} />
                </View>
              </>
            ) : (
              <>
                <WritingCanvas
                  key={canvasKey}
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

                {/* По памяти: не помнишь — контур всего иероглифа (считается подсказкой).
                    Место под кнопку есть всегда, чтобы холст не прыгал */}
                {stage.mode === "memory" && (
                  <View
                    style={{ opacity: lesson.canRevealOutline ? 1 : 0 }}
                    pointerEvents={lesson.canRevealOutline ? "auto" : "none"}
                  >
                    <PillButton
                      label="Не помню — показать контур"
                      variant="secondary"
                      onPress={lesson.revealOutline}
                    />
                  </View>
                )}
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

export function WritingLessonScreen({
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
