// app/(tabs)/panda-riddle.tsx
//
// Игра с пандой «Допиши черту» (utils/panda/play): раунд из ROUND_SIZE загадок, как
// «Угадай слово». В каждой иероглиф нарисован без одной черты — её нужно дописать.
// +1 опыт за черту, дописанную без подсказки (подсказка — контур после двух ошибок),
// за раунд 0–3. «Назад» — просто выйти, заработанное остаётся.
// Кнопки («Дальше», в конце «Ещё» и «Готово») прибиты к низу экрана.
// «Напиши слово» отсюда убрано 25 октября: для игры слишком сложно, для письма есть
// полноценные тренировки.
//
// wordIds — id слов раунда через запятую; run — номер захода (каждый заход заново).

import { Screen } from "@/components/layout/Screen";
import { RoundResult } from "@/components/panda/PandaPlayContent";
import { MainButton, RewardBadge } from "@/components/panda/PandaRiddles";
import { BackButton } from "@/components/ui/BackButton";
import { WritingCanvas } from "@/components/writing/canvas/WritingCanvas";
import {
  TaskPill,
  TaskPinyin,
  WordHeading,
  WrittenChars,
} from "@/components/writing/lesson/LessonParts";
import type { Word } from "@/content/flashcards/types";
import { findWord } from "@/content/words/vocabulary";
import { useMissingStroke } from "@/hooks/panda/useMissingStroke";
import { useSpeakHanzi } from "@/hooks/useSpeakHanzi";
import { useCanvasSize } from "@/hooks/writing/useCanvasSize";
import { usePandaStore } from "@/store/pandaStore";
import { STROKE_REWARD, finishPlay, getPlaysLeft } from "@/utils/panda/play";
import { syllableOf } from "@/utils/writing/words";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function PandaRiddleRoute() {
  const { wordIds, run } = useLocalSearchParams<{
    wordIds?: string;
    run?: string;
  }>();
  const words = useMemo(
    () =>
      (wordIds ?? "")
        .split(",")
        .map((id) => findWord(id))
        .filter((w): w is Word => !!w),
    [wordIds],
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Screen>
        <View className="flex-row items-center pb-3 pr-4">
          <BackButton href="/pet" />
        </View>
        {words.length > 0 && <StrokeRound key={run ?? ""} words={words} />}
      </Screen>
    </GestureHandlerRootView>
  );
}

// ── Раунд ────────────────────────────────────────────────────────────────────

function StrokeRound({ words }: { words: Word[] }) {
  const router = useRouter();
  const { t } = useTranslation("pandaThoughts");
  const playTimes = usePandaStore((s) => s.playTimes);
  const [index, setIndex] = useState(0);
  const [earned, setEarned] = useState(0);
  const [doneIndex, setDoneIndex] = useState(-1);

  const total = words.length;
  const isLast = index === total - 1;
  const answered = doneIndex === index;

  const finish = () => router.replace("/pet");
  // «Ещё» — снова меню игр: экран панды откроет шторку
  const more = () =>
    router.navigate({ pathname: "/pet", params: { play: String(Date.now()) } });

  return (
    <View className="flex-1">
      <View className="flex-1">
        {total > 1 && (
          <Text className="px-4 pb-2 font-nunito text-small text-textSecondary">
            {t("play.round", { n: index + 1, total })}
          </Text>
        )}
        <MissingStroke
          key={`${words[index].vocabularyId}-${index}`}
          word={words[index]}
          onDone={(xp) => {
            setEarned((n) => n + xp);
            setDoneIndex(index);
          }}
        />
      </View>

      {/* Кнопки — прибиты к низу экрана (Screen уже даёт отступ панели навигации) */}
      <View className="gap-4 px-4 pb-4 pt-3">
        {!isLast ? (
          <View className="flex-row">
            <MainButton
              label={t("play.next")}
              disabled={!answered}
              onPress={() => setIndex(index + 1)}
            />
          </View>
        ) : (
          <>
            {answered && (
              <RoundResult
                xp={earned}
                text={
                  earned === total * STROKE_REWARD
                    ? t("play.roundPerfect")
                    : earned > 0
                      ? t("play.roundGood")
                      : t("play.roundNone")
                }
              />
            )}
            <View className="flex-row gap-3">
              {answered && getPlaysLeft(playTimes) > 0 && (
                <MainButton
                  label={t("play.more")}
                  variant="secondary"
                  onPress={more}
                />
              )}
              <MainButton
                label={t("play.done")}
                onPress={finish}
                disabled={!answered}
              />
            </View>
          </>
        )}
      </View>
    </View>
  );
}

// ── Допиши черту ─────────────────────────────────────────────────────────────

function MissingStroke({
  word,
  onDone,
}: {
  word: Word;
  /** Черта дописана; xp — опыт за неё (0 — дописана после подсказки). */
  onDone: (xp: number) => void;
}) {
  const { t } = useTranslation("pandaThoughts");
  const size = useCanvasSize();
  const { speakForced } = useSpeakHanzi();
  const game = useMissingStroke(word);
  const { target } = game;

  const reward = game.hinted ? 0 : STROKE_REWARD;
  const rewarded = useRef(false);
  useEffect(() => {
    if (!game.done || rewarded.current) return;
    rewarded.current = true;
    // Опыт сразу за каждую черту: ушёл посреди раунда — заработанное остаётся
    finishPlay(word.vocabularyId, reward);
    onDone(reward);
    speakForced(word.hanzi);
  }, [game.done, reward, word, speakForced, onDone]);

  if (!target) return null;

  const hanziList = Array.from(word.hanzi);
  const charHanzi = hanziList[target.charIndex] ?? word.hanzi;
  const charPinyin = syllableOf(
    word.pinyin,
    hanziList.length,
    target.charIndex,
  );

  return (
    <View className="items-center gap-3 px-4">
      <WordHeading word={word} onSpeak={() => speakForced(word.hanzi)} />

      <TaskPill action={t("stroke.task")}>
        <TaskPinyin
          pinyin={charPinyin}
          onSpeak={() => speakForced(charHanzi)}
        />
      </TaskPill>

      {/* Остальные иероглифы слова — готовыми, маленькими */}
      {hanziList.length > 1 && (
        <WrittenChars
          items={target.chars.map((data, i) =>
            i === target.charIndex
              ? { strokes: [] }
              : { strokes: data.strokes },
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

      {/* Одна строка под холстом: подсказка, потом итог черты — высота одна и та же */}
      {game.done ? (
        <View className="min-h-8 flex-row items-center gap-3">
          <Text className="font-nunitoBold text-body text-text">
            {game.mistakes === 0
              ? t("stroke.clean")
              : game.hinted
                ? t("stroke.withHint")
                : t("stroke.done")}
          </Text>
          {reward > 0 && <RewardBadge xp={reward} />}
        </View>
      ) : (
        <Text className="min-h-8 text-center font-nunito text-body text-textSecondary">
          {game.hintIndex !== null ? t("stroke.hint") : t("stroke.hintIdle")}
        </Text>
      )}
    </View>
  );
}
