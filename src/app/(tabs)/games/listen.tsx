// app/(tabs)/games/listen.tsx
//
// «Слушай и повторяй»: урок, где ничего не нужно нажимать — звучит слово,
// пауза, чтобы повторить вслух, слово ещё раз. Можно выключить экран.
// Сценарий — utils/listen/script.ts, проигрывание — hooks/useListenLesson.ts,
// слова — utils/listen/words.ts.
//
// Экраны: выбор (какие слова, перевод вслух) → урок (слово крупно, что делать
// сейчас, пауза) → готово.

import { Screen } from "@/components/layout/Screen";
import { BackButton } from "@/components/ui/BackButton";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { Word } from "@/content/flashcards/types";
import { useListenLesson } from "@/hooks/useListenLesson";
import { useSettingsStore } from "@/store/settingsStore";
import { getListenWords, type ListenSource } from "@/utils/listen/words";
import type { ListenStep } from "@/utils/listen/script";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

const SOURCES: { id: ListenSource; title: string }[] = [
  { id: "learning", title: "Изучаемые" },
  { id: "review", title: "Выученные" },
];

/** Примерная длина урока: ~12 с на слово с переводом, ~10 без. */
const estimateMinutes = (count: number, withTranslation: boolean) =>
  Math.max(1, Math.round((count * (withTranslation ? 12 : 10)) / 60));

const PHASE: Record<ListenStep["kind"], string> = {
  zh: "Слушай",
  translation: "Перевод",
  repeat: "Повтори вслух",
  gap: "Слушай",
};

export default function ListenScreen() {
  const { t } = useTranslation(["sets"]);
  const lesson = useListenLesson();
  const withTranslation = useSettingsStore((s) => s.listenTranslation);
  const toggleTranslation = useSettingsStore((s) => s.toggleListenTranslation);

  const [source, setSource] = useState<ListenSource>("learning");
  // Пересчитываем слова при каждом заходе: прогресс мог измениться
  const [focusKey, setFocusKey] = useState(0);
  useFocusEffect(useCallback(() => setFocusKey((k) => k + 1), []));
  const words = useMemo<Word[]>(
    () => getListenWords(source),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [source, focusKey],
  );

  const step = lesson.step;
  const inLesson = lesson.state === "playing" || lesson.state === "paused";

  return (
    <Screen>
      <View className="flex-row items-center justify-between">
        <BackButton href="/games" />
        <Text className="font-nunito text-2xl text-text">Слушай и повторяй</Text>
        <View className="w-11" />
      </View>

      {lesson.state === "idle" && (
        <>
          <View className="mt-6 flex-1 gap-5">
            <View className="flex-row gap-2">
              {SOURCES.map(({ id, title }) => {
                const selected = source === id;
                return (
                  <Pressable
                    key={id}
                    onPress={() => setSource(id)}
                    className={`h-11 flex-1 items-center justify-center rounded-xl border ${
                      selected ? "border-primary bg-primary" : "border-primary/30 bg-surface"
                    } active:opacity-80`}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <Text
                      className={`font-nunitoBold text-body ${selected ? "text-white" : "text-text"}`}
                    >
                      {title}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={toggleTranslation}
              className="min-h-14 flex-row items-center justify-between rounded-2xl border border-primary/30 bg-surface px-4 active:opacity-80"
              accessibilityRole="switch"
              accessibilityState={{ checked: withTranslation }}
            >
              <View className="flex-1 pr-3">
                <Text className="font-nunitoBold text-body text-text">Перевод вслух</Text>
                <Text className="font-nunito text-small text-textSecondary">
                  Если не смотришь в экран
                </Text>
              </View>
              <View
                className={`h-7 w-12 justify-center rounded-full px-1 ${
                  withTranslation ? "items-end bg-primary" : "items-start bg-primary/20"
                }`}
              >
                <View className="h-5 w-5 rounded-full bg-white" />
              </View>
            </Pressable>

            {words.length > 0 ? (
              <Text className="font-nunito text-body text-textSecondary">
                {words.length} слов · около {estimateMinutes(words.length, withTranslation)} мин.
                {"\n"}Слово звучит, потом пауза — повтори вслух. Экран можно выключить.
              </Text>
            ) : (
              <Text className="font-nunito text-body text-textSecondary">
                {source === "review"
                  ? "Выученных слов с озвучкой пока нет."
                  : "Слов с озвучкой пока нет: озвучен только HSK 1."}
              </Text>
            )}
          </View>

          <BottomButton
            label="Начать"
            disabled={words.length === 0}
            onPress={() => lesson.start(words, withTranslation)}
          />
        </>
      )}

      {inLesson && step && (
        <>
          <ProgressBar progress={lesson.progress * 100} className="mt-4" />

          <View className="flex-1 items-center justify-center gap-3">
            <Text className="font-nunito text-body text-textSecondary">
              {PHASE[step.kind]}
            </Text>
            <Text className="text-center font-chinese text-6xl text-text">
              {step.word.hanzi}
            </Text>
            <Text className="text-center text-2xl text-primary">{step.word.pinyin}</Text>
            <Text
              className="text-center font-nunito text-lead text-textSecondary"
              numberOfLines={2}
            >
              {t(step.word.translation)}
            </Text>
          </View>

          <View className="gap-3 pb-2">
            {lesson.state === "playing" ? (
              <BottomButton label="Пауза" onPress={lesson.pause} />
            ) : (
              <BottomButton label="Продолжить" onPress={lesson.resume} />
            )}
            <Pressable
              onPress={lesson.stop}
              className="min-h-12 items-center justify-center active:opacity-60"
              accessibilityRole="button"
            >
              <Text className="font-nunito text-body text-textSecondary">Закончить</Text>
            </Pressable>
          </View>
        </>
      )}

      {lesson.state === "finished" && (
        <>
          <View className="flex-1 items-center justify-center gap-2">
            <Text className="font-nunitoBold text-title text-text">Готово</Text>
            <Text className="font-nunito text-body text-textSecondary">
              {words.length} слов, два круга
            </Text>
          </View>
          <BottomButton
            label="Ещё раз"
            onPress={() => lesson.start(getListenWords(source), withTranslation)}
          />
        </>
      )}
    </Screen>
  );
}

function BottomButton({
  label,
  onPress,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`mb-2 min-h-14 items-center justify-center rounded-2xl px-5 ${
        disabled ? "bg-primary/40" : "bg-primary active:opacity-80"
      }`}
      accessibilityRole="button"
    >
      <Text className="font-nunitoBold text-body text-white">{label}</Text>
    </Pressable>
  );
}
