// app/(tabs)/games/daily/writing.tsx
//
// Письмо слов дня (utils/daily.ts).
//   1. По каждому слову, которое сегодня ещё не писали: «Знаешь, как пишется?»
//      (виден перевод и пиньинь, иероглифа нет).
//   2. Урок: «знаю» — сразу по памяти (без подсказок — 3 точки и слово уходит
//      из слов дня; с подсказками — в конце работа над ошибками);
//      «не знаю» — обычный урок (новое — полный цикл, начатое — быстрый).

import { GameHeader } from "@/components/game/GameHeader";
import { Screen } from "@/components/layout/Screen";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { WritingLessonScreen } from "@/components/writing/lesson/WritingLessonScreen";
import type { Word } from "@/content/flashcards/types";
import { useSpeakHanzi } from "@/hooks/useSpeakHanzi";
import { getDailyWritingWords } from "@/utils/daily";
import { createDailyPlan } from "@/utils/writing/plans";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

export default function DailyWritingScreen() {
  const router = useRouter();
  const [words, setWords] = useState<Word[] | null>(null);
  const [index, setIndex] = useState(0);
  const [known, setKnown] = useState<Set<string> | null>(null);
  const answers = useRef(new Set<string>());

  useFocusEffect(
    useCallback(() => {
      const list = getDailyWritingWords();
      answers.current = new Set();
      setIndex(0);
      setKnown(null);
      if (list.length === 0) {
        setWords([]);
        router.replace("/pet");
        return;
      }
      setWords(list);
    }, [router]),
  );

  const buildPlan = useCallback(
    () => (words && known ? createDailyPlan(words, known) : []),
    [words, known],
  );

  if (!words || words.length === 0) return <Screen>{null}</Screen>;

  if (known) {
    return <WritingLessonScreen title="Письмо дня" buildPlan={buildPlan} />;
  }

  const answer = (knows: boolean) => {
    const word = words[index];
    if (knows) answers.current.add(word.vocabularyId);
    if (index < words.length - 1) setIndex((i) => i + 1);
    else setKnown(new Set(answers.current));
  };

  return (
    <AskScreen
      word={words[index]}
      progress={(index / words.length) * 100}
      onAnswer={answer}
      onExit={() => router.replace("/pet")}
    />
  );
}

/** «Знаешь, как пишется?»: перевод и пиньинь, две кнопки внизу. */
function AskScreen({
  word,
  progress,
  onAnswer,
  onExit,
}: {
  word: Word;
  progress: number;
  onAnswer: (knows: boolean) => void;
  onExit: () => void;
}) {
  const { t } = useTranslation(["sets"]);
  const { speakForced } = useSpeakHanzi();
  const [isExitVisible, setIsExitVisible] = useState(false);

  return (
    <Screen>
      <ConfirmModal
        isVisible={isExitVisible}
        onClose={() => setIsExitVisible(false)}
        onConfirm={() => {
          setIsExitVisible(false);
          onExit();
        }}
      />

      <GameHeader
        progress={progress}
        showPinyin={false}
        onExit={() => setIsExitVisible(true)}
      />

      <View className="flex-1 items-center justify-center gap-3">
        <Text className="font-nunito text-body text-textSecondary">
          Знаешь, как пишется?
        </Text>
        <Pressable
          onPress={() => speakForced(word.hanzi)}
          accessibilityRole="button"
          accessibilityLabel={`${word.pinyin}: послушать`}
        >
          <Text className="text-center text-3xl text-primary">{word.pinyin}</Text>
        </Pressable>
        <Text
          className="text-center font-nunitoBold text-title text-text"
          numberOfLines={3}
        >
          {t(word.translation)}
        </Text>
      </View>

      <View className="gap-3 pb-2">
        <Pressable
          onPress={() => onAnswer(true)}
          className="min-h-14 items-center justify-center rounded-2xl bg-primary px-5 active:opacity-80"
          accessibilityRole="button"
        >
          <Text className="font-nunitoBold text-body text-white">
            Знаю — напишу по памяти
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onAnswer(false)}
          className="min-h-14 items-center justify-center rounded-2xl border border-primary/30 bg-surface px-5 active:opacity-80"
          accessibilityRole="button"
        >
          <Text className="font-nunitoBold text-body text-text">Не знаю</Text>
        </Pressable>
      </View>
    </Screen>
  );
}
