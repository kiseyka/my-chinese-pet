// app/(tabs)/games/daily/reading.tsx
//
// Перевод слов дня (utils/daily.ts).
//   1. «Помнишь?» — слова пула, у которых уже 3 точки перевода:
//      «знаю» — слово уходит из слов дня; «сомневаюсь» / «не знаю» — остаётся
//      и идёт в тренировку. Точек «помнишь?» не даёт.
//   2. Обычная тренировка перевода по словам, с которыми сегодня не занимались
//      (источник «daily:reading»). Нечего учить — обратно на панду.

import { GameHeader } from "@/components/game/GameHeader";
import { SelfCheckQuestion } from "@/components/game/SelfCheckQuestion";
import { Screen } from "@/components/layout/Screen";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import type { Word } from "@/content/flashcards/types";
import { findWords } from "@/content/words/vocabulary";
import { useDailyStore } from "@/store/dailyStore";
import type { SelfCheckAnswer } from "@/store/gameStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useWordProgressStore } from "@/store/wordProgressStore";
import {
  DAILY_READING_SOURCE,
  getDailyPlan,
  getDailyReadingWords,
} from "@/utils/daily";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Text, View } from "react-native";

export default function DailyReadingScreen() {
  const router = useRouter();
  const showPinyin = useSettingsStore((s) => s.showPinyin);

  const [words, setWords] = useState<Word[] | null>(null);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<SelfCheckAnswer | null>(null);
  const [isExitVisible, setIsExitVisible] = useState(false);
  const known = useRef<string[]>([]);

  /** После «помнишь?»: тренировка по оставшимся словам или обратно на панду. */
  const goTrain = useCallback(() => {
    if (getDailyReadingWords().length === 0) {
      router.replace("/pet");
      return;
    }
    router.replace({
      pathname: "/games/flashcards/[setId]",
      params: { setId: DAILY_READING_SOURCE },
    });
  }, [router]);

  // Каждый заход — заново: что спросить «помнишь?», решаем по сегодняшнему плану
  useFocusEffect(
    useCallback(() => {
      const { pools } = useDailyStore.getState();
      const progress = useWordProgressStore.getState().flashcardWords;
      const check = findWords(
        getDailyPlan("reading", pools.reading, progress).check,
      );
      known.current = [];
      setIndex(0);
      setAnswer(null);
      if (check.length === 0) {
        setWords([]);
        goTrain();
        return;
      }
      setWords(check);
    }, [goTrain]),
  );

  if (!words || words.length === 0) return <Screen>{null}</Screen>;

  const word = words[index];
  const isLast = index >= words.length - 1;

  const choose = (value: SelfCheckAnswer) => {
    if (answer) return;
    setAnswer(value);
    if (value === "know") known.current.push(word.vocabularyId);
  };

  const next = () => {
    if (!isLast) {
      setIndex((i) => i + 1);
      setAnswer(null);
      return;
    }
    // «Знаю» на слове с 3 точками — слово освоено, из слов дня уходит
    useDailyStore.getState().remove("reading", known.current);
    goTrain();
  };

  return (
    <Screen>
      <ConfirmModal
        isVisible={isExitVisible}
        onClose={() => setIsExitVisible(false)}
        onConfirm={() => {
          setIsExitVisible(false);
          router.replace("/pet");
        }}
      />

      <GameHeader
        progress={((index + (answer ? 1 : 0)) / words.length) * 100}
        onExit={() => setIsExitVisible(true)}
      />

      <Text className="mt-2 text-center font-nunitoBold text-lead text-text">
        Помнишь?
      </Text>

      <View className="flex-1">
        <SelfCheckQuestion
          key={word.vocabularyId}
          hanzi={word.hanzi}
          pinyin={word.pinyin}
          translation={word.translation}
          showPinyin={showPinyin}
          answer={answer}
          isLast={false}
          onAnswer={choose}
          onNext={next}
        />
      </View>
    </Screen>
  );
}
