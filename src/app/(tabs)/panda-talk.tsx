// app/(tabs)/panda-talk.tsx
//
// Сцена разговора с пандой: сверху панда крупным планом (PandaTalkStage,
// panda_talk.riv), снизу — диалог лентой, с прокруткой. Сюда ведёт любой тап по панде:
//   есть облачко — сначала фраза дня (PandaThoughtContent), после «Понятно» — меню игр;
//   нет облачка  — сразу меню игр (PandaPlayContent). В меню — «Фраза дня», если её
//                  уже читали сегодня: открыть ещё раз.
// Панда крупным планом — только в меню игр и загадках; у фразы её нет (решено 25 октября:
// анимаций под фразы пока не будет), там сверху только «назад».
// Панда отзывается на диалог через PandaMood (ждёт ответа, радуется, удивляется)
// и «говорит», пока звучит озвучка (store/speechStore).
//
// «Назад» — к панде; недочитанная фраза остаётся, облачко вернётся.
// Экран остаётся смонтированным между заходами (вкладка) — каждый заход начинаем заново.

import BackIcon from "@/assets/images/icons/arrow-left.svg";
import {
  PandaMoodContext,
  type PandaMood,
  type PandaReaction,
  type PandaWaiting,
} from "@/components/panda/PandaMood";
import { PlayContent } from "@/components/panda/PandaPlayContent";
import { PandaTalkStage } from "@/components/panda/PandaTalkStage";
import { PhraseOfDay } from "@/components/panda/PandaThoughtContent";
import { usePandaStore } from "@/store/pandaStore";
import { colors } from "@/theme/colors";
import { resolveThought } from "@/utils/panda/thoughts";
import * as Speech from "expo-speech";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Насколько панель диалога заходит на сцену (скруглённый верх поверх панды). */
const PANEL_OVERLAP = 24;

export default function PandaTalkRoute() {
  const [visit, setVisit] = useState(0);
  useFocusEffect(
    useCallback(() => {
      setVisit((n) => n + 1);
      // Ушли со сцены — панда замолкает
      return () => {
        Speech.stop();
      };
    }, []),
  );

  return (
    <PandaTalk key={visit} />
  );
}

type Step =
  | { kind: "menu" }
  /**
   * again — фраза, прочитанная сегодня, открыта ещё раз из меню;
   * room — фраза о комнате (в коллекцию не идёт).
   */
  | { kind: "phrase"; phraseId: string; again: boolean; room?: boolean };

function PandaTalk() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Есть фраза дня — начинаем с неё, иначе сразу меню игр
  const [step, setStep] = useState<Step>(() => {
    const thought = usePandaStore.getState().thought;
    return thought
      ? {
          kind: "phrase",
          phraseId: thought.phraseId,
          again: false,
          room: thought.kind === "room",
        }
      : { kind: "menu" };
  });

  const [waiting, setWaiting] = useState<PandaWaiting | null>(null);
  const [reaction, setReaction] = useState<{ kind: PandaReaction; id: number } | null>(
    null,
  );
  const mood = useMemo<PandaMood>(
    () => ({
      setWaiting,
      react: (next) => setReaction((prev) => ({ kind: next, id: (prev?.id ?? 0) + 1 })),
    }),
    [],
  );

  const goPet = () => router.navigate("/pet");
  const showStage = step.kind !== "phrase";

  return (
    <PandaMoodContext.Provider value={mood}>
      <View className="flex-1 bg-[#EDE0CE]" style={{ paddingTop: insets.top }}>
        {/* Снизу запас на заход панели: панель ложится на него, а не на лапки.
            Без панды (фраза) — только строка с «назад» */}
        <View style={{ paddingBottom: PANEL_OVERLAP, minHeight: showStage ? 0 : 76 }}>
          {showStage && <PandaTalkStage waiting={waiting} reaction={reaction} />}
          <Pressable
            onPress={goPet}
            hitSlop={12}
            className="absolute left-4 top-2 h-11 w-11 items-center justify-center rounded-full bg-surface/80 active:opacity-70"
            accessibilityRole="button"
            accessibilityLabel="Назад"
          >
            <BackIcon width={24} height={24} color={colors.text} />
          </Pressable>
        </View>

        <View
          className="flex-1 rounded-t-3xl bg-background"
          style={{ marginTop: -PANEL_OVERLAP }}
        >
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 24,
              paddingBottom: insets.bottom + 24,
            }}
            keyboardShouldPersistTaps="handled"
          >
            {step.kind === "menu" ? (
              <PlayContent
                onClose={goPet}
                onOpenPhrase={(phraseId) =>
                  setStep({ kind: "phrase", phraseId, again: true })
                }
              />
            ) : (
              <PhraseOfDay
                key={`${step.phraseId}-${step.again}`}
                phraseId={step.phraseId}
                again={step.again}
                collect={!step.room}
                onDone={() => {
                  if (!step.again) resolveThought();
                  setStep({ kind: "menu" });
                }}
                // Ушли на экран этапа — недочитанная фраза остаётся
                onLeave={() => {}}
              />
            )}
          </ScrollView>
        </View>
      </View>
    </PandaMoodContext.Provider>
  );
}
