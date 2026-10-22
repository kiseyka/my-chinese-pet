// app/(tabs)/panda-riddle.tsx
//
// Загадка панды «напиши слово»: мысль с облачком (source=thought, utils/panda/thoughts)
// или игра по тапу на панду (source=play, utils/panda/play — с опытом за слово):
// сверху пиньинь и перевод, слово пишется по памяти (логика — useRiddleWriting).
// В конце — эталон и твоё написание (тап по своему — в галерею), «Готово» закрывает
// мысль и возвращает к панде. Ушли раньше — мысль остаётся, облачко ждёт.
//
// wordId — id слова из «Повторения».
// mode=stroke — «Допиши черту»: иероглиф без одной черты, дописать её (только игра).

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
import { RewardBadge } from "@/components/panda/PandaRiddles";
import {
  STROKE_PERFECT_REWARD,
  STROKE_REWARD,
  WRITE_PERFECT_REWARD,
  WRITE_REWARD,
  finishPlay,
} from "@/utils/panda/play";
import { useMissingStroke } from "@/hooks/panda/useMissingStroke";
import { resolveThought } from "@/utils/panda/thoughts";
import { syllableOf } from "@/utils/writing/words";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const RESULT_SIZE = 96;

export default function PandaRiddleRoute() {
  const { wordId, source, mode } = useLocalSearchParams<{
    wordId?: string;
    source?: string;
    /** stroke — «Допиши черту» (игра по тапу), иначе — написать слово целиком. */
    mode?: string;
  }>();
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
        {word && mode === "stroke" && (
          <MissingStroke key={`${word.vocabularyId}-${visit}`} word={word} />
        )}
        {word && mode !== "stroke" && (
          <RiddleWriting
            key={`${word.vocabularyId}-${visit}`}
            word={word}
            isPlay={source === "play"}
          />
        )}
      </Screen>
    </GestureHandlerRootView>
  );
}

function RiddleWriting({ word, isPlay }: { word: Word; isPlay: boolean }) {
  const router = useRouter();
  const { t } = useTranslation("pandaThoughts");
  const size = useCanvasSize();
  const { speakForced } = useSpeakHanzi();
  const riddle = useRiddleWriting(word);
  const [toSave, setToSave] = useState<GalleryCandidate | null>(null);

  const { chars, charIndex, charData, phase } = riddle;

  // Игра по тапу: опыт и привязанность — один раз, как только слово написано
  const reward =
    riddle.mistakes === 0 ? WRITE_PERFECT_REWARD : WRITE_REWARD;
  const rewarded = useRef(false);
  useEffect(() => {
    if (!isPlay || phase !== "done" || rewarded.current) return;
    rewarded.current = true;
    finishPlay(word.vocabularyId, reward);
  }, [isPlay, phase, reward, word.vocabularyId]);

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

        <View className="items-center gap-2">
          <Text className="text-center font-nunitoBold text-title text-text">
            {riddle.mistakes === 0
              ? t("riddleWrite.clean")
              : t("riddleWrite.mistakes", { count: riddle.mistakes })}
          </Text>
          {isPlay && <RewardBadge xp={reward} />}
        </View>

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

// ── Допиши черту ─────────────────────────────────────────────────────────────

function MissingStroke({ word }: { word: Word }) {
  const router = useRouter();
  const { t } = useTranslation("pandaThoughts");
  const size = useCanvasSize();
  const { speakForced } = useSpeakHanzi();
  const game = useMissingStroke(word);
  const { target } = game;

  const reward = game.mistakes === 0 ? STROKE_PERFECT_REWARD : STROKE_REWARD;
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
            label={t("riddleWrite.done")}
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
