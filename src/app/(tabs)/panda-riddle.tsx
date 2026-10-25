// app/(tabs)/panda-riddle.tsx
//
// Игра с пандой «Допиши черту» (utils/panda/play): иероглиф без одной черты, её нужно
// дописать. +1 опыт. «Назад» — просто выйти.
// «Напиши слово» отсюда убрано 25 октября: для игры слишком сложно, для письма есть
// полноценные тренировки.
//
// wordId — id слова; run — номер захода (каждый заход начинается заново).

import { Screen } from "@/components/layout/Screen";
import { BackButton } from "@/components/ui/BackButton";
import { WritingCanvas } from "@/components/writing/canvas/WritingCanvas";
import {
  PillButton,
  TaskPill,
  TaskPinyin,
  WordHeading,
  WrittenChars,
} from "@/components/writing/lesson/LessonParts";
import type { Word } from "@/content/flashcards/types";
import { findWord } from "@/content/words/vocabulary";
import { useSpeakHanzi } from "@/hooks/useSpeakHanzi";
import { useCanvasSize } from "@/hooks/writing/useCanvasSize";
import { RewardBadge } from "@/components/panda/PandaRiddles";
import { STROKE_REWARD, finishPlay } from "@/utils/panda/play";
import { useMissingStroke } from "@/hooks/panda/useMissingStroke";
import { syllableOf } from "@/utils/writing/words";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function PandaRiddleRoute() {
  const { wordId, run } = useLocalSearchParams<{ wordId?: string; run?: string }>();
  const word = wordId ? findWord(wordId) : undefined;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Screen>
        <View className="flex-row items-center pb-3 pr-4">
          <BackButton href="/pet" />
        </View>
        {word && <MissingStroke key={`${word.vocabularyId}-${run ?? ""}`} word={word} />}
      </Screen>
    </GestureHandlerRootView>
  );
}

// ── Допиши черту ─────────────────────────────────────────────────────────────

function MissingStroke({ word }: { word: Word }) {
  const router = useRouter();
  const { t } = useTranslation("pandaThoughts");
  const size = useCanvasSize();
  const { speakForced } = useSpeakHanzi();
  const game = useMissingStroke(word);
  const { target } = game;

  const reward = STROKE_REWARD;
  const rewarded = useRef(false);
  useEffect(() => {
    if (!game.done || rewarded.current) return;
    rewarded.current = true;
    finishPlay(word.vocabularyId, reward);
    speakForced(word.hanzi);
  }, [game.done, reward, word, speakForced]);

  if (!target) return null;

  const hanziList = Array.from(word.hanzi);
  const charHanzi = hanziList[target.charIndex] ?? word.hanzi;
  const charPinyin = syllableOf(word.pinyin, hanziList.length, target.charIndex);

  return (
    <View className="items-center gap-3 px-4">
      <WordHeading word={word} onSpeak={() => speakForced(word.hanzi)} />

      <TaskPill action={t("stroke.task")}>
        <TaskPinyin pinyin={charPinyin} onSpeak={() => speakForced(charHanzi)} />
      </TaskPill>

      {/* Остальные иероглифы слова — готовыми, маленькими */}
      {hanziList.length > 1 && (
        <WrittenChars
          items={target.chars.map((data, i) =>
            i === target.charIndex ? { strokes: [] } : { strokes: data.strokes },
          )}
        />
      )}

      <WritingCanvas
        key={`${word.vocabularyId}-stroke`}
        size={size}
        strokes={target.data.strokes}
        outlineIndices={[]}
        snappedIndices={game.snappedIndices}
        rawStrokes={[]}
        hintIndex={game.hintIndex}
        disabled={game.done}
        onStroke={game.handleStroke}
      />

      {game.done ? (
        <View className="items-center gap-3">
          <View className="flex-row items-center gap-3">
            <Text className="font-nunitoBold text-title text-text">
              {game.mistakes === 0 ? t("stroke.clean") : t("stroke.done")}
            </Text>
            <RewardBadge xp={reward} />
          </View>
          <PillButton
            label={t("stroke.finish")}
            onPress={() => router.replace("/pet")}
          />
        </View>
      ) : (
        <Text className="min-h-6 text-center font-nunito text-body text-textSecondary">
          {game.hintIndex !== null ? t("stroke.hint") : t("stroke.hintIdle")}
        </Text>
      )}
    </View>
  );
}
