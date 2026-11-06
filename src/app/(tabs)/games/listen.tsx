// app/(tabs)/games/listen.tsx
//
// «Слушай и повторяй»: урок, где ничего не нужно нажимать — звучит фраза,
// пауза, чтобы повторить вслух, фраза ещё раз. Фразы — сеты по ситуациям
// (content/listen/sets.ts), голос — телефона (expo-speech).
// Сценарий — utils/listen/script.ts, проигрывание — hooks/useListenLesson.ts.
//
// Экраны: выбор (сет, перевод вслух, скорость) → урок (фраза крупно, что делать
// сейчас, скорость, пауза) → готово.

import { Screen } from "@/components/layout/Screen";
import { BackButton } from "@/components/ui/BackButton";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { LISTEN_SETS } from "@/content/listen/sets";
import { useListenLesson } from "@/hooks/useListenLesson";
import { useSettingsStore } from "@/store/settingsStore";
import type { ListenStep } from "@/utils/listen/script";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

/** Скорость китайского голоса: ступени вместо ползунка (ползунку нужен нативный модуль). */
const RATES = [0.6, 0.7, 0.8, 0.9, 1];

const PHASE: Record<ListenStep["kind"], string> = {
  zh: "Слушай",
  translation: "Перевод",
  repeat: "Повтори вслух",
  gap: "Слушай",
};

export default function ListenScreen() {
  const lesson = useListenLesson();
  const withTranslation = useSettingsStore((s) => s.listenTranslation);
  const toggleTranslation = useSettingsStore((s) => s.toggleListenTranslation);
  const rate = useSettingsStore((s) => s.listenRate);
  const setRate = useSettingsStore((s) => s.setListenRate);

  const [setId, setSetId] = useState(LISTEN_SETS[0].id);
  const current = LISTEN_SETS.find((s) => s.id === setId) ?? LISTEN_SETS[0];

  const changeRate = (value: number) => {
    setRate(value);
    lesson.setRate(value);
  };

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
          <ScrollView className="mt-4 flex-1" contentContainerClassName="gap-5 pb-4">
            <View className="gap-2">
              {LISTEN_SETS.map((set) => {
                const selected = set.id === setId;
                return (
                  <Pressable
                    key={set.id}
                    onPress={() => setSetId(set.id)}
                    className={`min-h-14 flex-row items-center justify-between rounded-2xl border px-4 ${
                      selected ? "border-primary bg-primary/10" : "border-primary/30 bg-surface"
                    } active:opacity-80`}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <Text className="font-nunitoBold text-body text-text">{set.title}</Text>
                    <Text className="font-nunito text-small text-textSecondary">
                      {set.phrases.length} фраз
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

            <RatePicker rate={rate} onChange={changeRate} />

            <Text className="font-nunito text-body text-textSecondary">
              Фраза звучит, потом пауза — повтори вслух, фраза ещё раз. Два круга:
              второй вперемешку и без перевода.
            </Text>
          </ScrollView>

          <BottomButton
            label="Начать"
            onPress={() => lesson.start(current.phrases, withTranslation, rate)}
          />
        </>
      )}

      {inLesson && step && (
        <>
          <ProgressBar progress={lesson.progress * 100} className="mt-4" />

          <View className="flex-1 items-center justify-center gap-3 px-2">
            <Text className="font-nunito text-body text-textSecondary">
              {PHASE[step.kind]}
            </Text>
            <Text className="text-center font-chinese text-4xl text-text">
              {step.phrase.hanzi}
            </Text>
            <Text className="text-center text-xl text-primary">{step.phrase.pinyin}</Text>
            <Text className="text-center font-nunito text-lead text-textSecondary">
              {step.phrase.ru}
            </Text>
          </View>

          <RatePicker rate={rate} onChange={changeRate} />

          <View className="mt-4 gap-1 pb-2">
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
              {current.title}: {current.phrases.length} фраз, два круга
            </Text>
          </View>
          <BottomButton
            label="Ещё раз"
            onPress={() => lesson.start(current.phrases, withTranslation, rate)}
          />
          <Pressable
            onPress={lesson.stop}
            className="mb-2 min-h-12 items-center justify-center active:opacity-60"
            accessibilityRole="button"
          >
            <Text className="font-nunito text-body text-textSecondary">Выбрать другой сет</Text>
          </Pressable>
        </>
      )}
    </Screen>
  );
}

/** Скорость китайского: «медленно … обычно». Меняется и во время урока. */
function RatePicker({ rate, onChange }: { rate: number; onChange: (rate: number) => void }) {
  return (
    <View className="gap-2">
      <View className="flex-row justify-between">
        <Text className="font-nunitoBold text-body text-text">Скорость</Text>
        <Text className="font-nunito text-small text-textSecondary">
          {rate === 1 ? "обычная" : `×${rate}`}
        </Text>
      </View>
      <View className="flex-row gap-2">
        {RATES.map((value) => {
          const selected = Math.abs(value - rate) < 0.01;
          return (
            <Pressable
              key={value}
              onPress={() => onChange(value)}
              className={`h-11 flex-1 items-center justify-center rounded-xl border ${
                selected ? "border-primary bg-primary" : "border-primary/30 bg-surface"
              } active:opacity-80`}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`Скорость ${value}`}
            >
              <Text className={`font-nunitoBold text-small ${selected ? "text-white" : "text-text"}`}>
                {value === 1 ? "1" : value.toFixed(1)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function BottomButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="mb-2 min-h-14 items-center justify-center rounded-2xl bg-primary px-5 active:opacity-80"
      accessibilityRole="button"
    >
      <Text className="font-nunitoBold text-body text-white">{label}</Text>
    </Pressable>
  );
}
