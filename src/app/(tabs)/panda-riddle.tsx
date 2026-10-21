// app/(tabs)/panda-riddle.tsx
//
// Загадка панды «напиши слово» (мысль riddle/write, см. utils/panda/thoughts):
// сверху пиньинь и перевод, слово пишется по памяти (логика — useRiddleWriting).
// В конце — эталон и твоё написание (тап по своему — в галерею), «Готово» закрывает
// мысль и возвращает к панде. Ушли раньше — мысль остаётся, облачко ждёт.
//
// wordId — id слова из «Повторения».

import { Screen } from "@/components/layout/Screen";
import { BackButton } from "@/components/ui/BackButton";
import { HanziView } from "@/components/writing/canvas/HanziView";
import { WritingCanvas } from "@/components/writing/canvas/WritingCanvas";
import {
  GallerySaveDialog,
  type GalleryCandidate,
} from "@/components/writing/gallery/GallerySaveDialog";
import { SavableHanzi } from "@/components/writing/gallery/SavableHanzi";
import {
  PillButton,
  TaskPill,
  TaskPinyin,
  WordHeading,
  WrittenChars,
} from "@/components/writing/lesson/LessonParts";
import type { Word } from "@/content/flashcards/types";
import { findWord } from "@/content/words/vocabulary";
import { useRiddleWriting } from "@/hooks/panda/useRiddleWriting";
import { useSpeakHanzi } from "@/hooks/useSpeakHanzi";
import { useCanvasSize } from "@/hooks/writing/useCanvasSize";
import { usePandaStore } from "@/store/pandaStore";
import { resolveThought } from "@/utils/panda/thoughts";
import { syllableOf } from "@/utils/writing/words";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const RESULT_SIZE = 96;

export default function PandaRiddleRoute() {
  const { wordId } = useLocalSearchParams<{ wordId?: string }>();
  // Экран остаётся смонтированным между заходами — каждый заход начинаем заново
  const [visit, setVisit] = useState(0);
  useFocusEffect(useCallback(() => setVisit((n) => n + 1), []));

  const word = wordId ? findWord(wordId) : undefined;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Screen>
        <View className="flex-row items-center pb-3 pr-4">
          <BackButton href="/pet" />
        </View>
        {word && <RiddleWriting key={`${word.vocabularyId}-${visit}`} word={word} />}
      </Screen>
    </GestureHandlerRootView>
  );
}

function RiddleWriting({ word }: { word: Word }) {
  const router = useRouter();
  const { t } = useTranslation("pandaThoughts");
  const size = useCanvasSize();
  const { speakForced } = useSpeakHanzi();
  const riddle = useRiddleWriting(word);
  const [toSave, setToSave] = useState<GalleryCandidate | null>(null);

  const { chars, charIndex, charData, phase } = riddle;
  if (!chars || !charData) return null;

  const hanziList = Array.from(word.hanzi);

  const finish = () => {
    // Мысль закрываем, только если это всё ещё она (не устарела)
    const thought = usePandaStore.getState().thought;
    if (thought?.kind === "riddle" && thought.wordId === word.vocabularyId) {
      resolveThought("done");
    }
    router.replace("/pet");
  };

  if (phase === "done") {
    return (
      <View className="items-center gap-5 px-4">
        <WordHeading word={word} onSpeak={() => speakForced(word.hanzi)} />

        <View className="items-center gap-1">
          <Text className="font-nunito text-small text-textSecondary">Эталон</Text>
          <View className="flex-row gap-3">
            {chars.map((data, i) => (
              <HanziView key={i} size={RESULT_SIZE} strokes={data.strokes} />
            ))}
          </View>
        </View>

        <View className="items-center gap-1">
          <Text className="font-nunito text-small text-textSecondary">Твоё</Text>
          <View className="flex-row gap-3">
            {chars.map((_, i) => (
              <SavableHanzi
                key={i}
                hanzi={hanziList[i]}
                strokes={riddle.raws[i] ?? []}
                size={RESULT_SIZE}
                onSave={(hanzi, strokes) => setToSave({ hanzi, strokes })}
              />
            ))}
          </View>
          <Text className="text-center font-nunito text-caption text-textSecondary">
            {t("riddleWrite.saveHint")}
          </Text>
        </View>

        <Text className="text-center font-nunitoBold text-title text-text">
          {riddle.mistakes === 0
            ? t("riddleWrite.clean")
            : t("riddleWrite.mistakes", { count: riddle.mistakes })}
        </Text>

        <PillButton label={t("riddleWrite.done")} onPress={finish} />

        <GallerySaveDialog candidate={toSave} onClose={() => setToSave(null)} />
      </View>
    );
  }

  const charHanzi = hanziList[charIndex] ?? word.hanzi;
  const charPinyin = syllableOf(word.pinyin, hanziList.length, charIndex);

  return (
    <View className="items-center gap-3 px-4">
      <WordHeading word={word} onSpeak={() => speakForced(word.hanzi)} />

      <TaskPill action={t("riddleWrite.task")}>
        <TaskPinyin pinyin={charPinyin} onSpeak={() => speakForced(charHanzi)} />
      </TaskPill>

      <WrittenChars items={riddle.completedRaws.map((raw) => ({ raw }))} />

      <WritingCanvas
        key={`${word.vocabularyId}-${charIndex}`}
        size={size}
        strokes={charData.strokes}
        outlineIndices={riddle.hintIndex !== null ? [riddle.hintIndex] : []}
        snappedIndices={[]}
        rawStrokes={riddle.rawStrokes}
        hintIndex={riddle.hintIndex}
        disabled={phase !== "active"}
        onStroke={riddle.handleStroke}
      />

      <Text className="min-h-6 text-center font-nunito text-body text-textSecondary">
        {riddle.isHinting ? t("riddleWrite.hint") : " "}
      </Text>
    </View>
  );
}
