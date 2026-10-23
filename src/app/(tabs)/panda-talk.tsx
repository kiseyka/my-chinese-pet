// app/(tabs)/panda-talk.tsx
//
// Сцена разговора с пандой: сверху панда крупным планом (PandaTalkStage,
// panda_talk.riv), снизу — диалог лентой, с прокруткой.
//   kind=thought — мысль из облачка (PandaThoughtContent): фраза, вопрос, загадка;
//   kind=play    — игра по тапу без облачка (PandaPlayContent).
// Панда отзывается на диалог через PandaMood (ждёт ответа, радуется, удивляется)
// и «говорит», пока звучит озвучка (store/speechStore).
//
// «Назад» — к панде; мысль без ответа остаётся, облачко вернётся.
// Экран остаётся смонтированным между заходами (вкладка) — каждый заход начинаем заново.

import BackIcon from "@/assets/images/icons/arrow-left.svg";
import {
  PandaMoodContext,
  type PandaMood,
  type PandaReaction,
} from "@/components/panda/PandaMood";
import { PlayContent } from "@/components/panda/PandaPlayContent";
import { PandaTalkStage } from "@/components/panda/PandaTalkStage";
import { ThoughtContent } from "@/components/panda/PandaThoughtContent";
import { usePandaStore } from "@/store/pandaStore";
import { colors } from "@/theme/colors";
import { resolveThought } from "@/utils/panda/thoughts";
import * as Speech from "expo-speech";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Насколько панель диалога заходит на сцену (скруглённый верх поверх панды). */
const PANEL_OVERLAP = 24;

export default function PandaTalkRoute() {
  const { kind } = useLocalSearchParams<{ kind?: string }>();
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
    <PandaTalk key={`${kind}-${visit}`} kind={kind === "play" ? "play" : "thought"} />
  );
}

function PandaTalk({ kind }: { kind: "thought" | "play" }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Мысль — какой она была при входе: после ответа она закрывается в сторе,
  // а на экране должна остаться до «Понятно»
  const [thought] = useState(() => usePandaStore.getState().thought);

  const [listening, setListening] = useState(false);
  const [reaction, setReaction] = useState<{ kind: PandaReaction; id: number } | null>(
    null,
  );
  const mood = useMemo<PandaMood>(
    () => ({
      setListening,
      react: (next) => setReaction((prev) => ({ kind: next, id: (prev?.id ?? 0) + 1 })),
    }),
    [],
  );

  const goPet = () => router.navigate("/pet");

  return (
    <PandaMoodContext.Provider value={mood}>
      <View className="flex-1 bg-[#EDE0CE]" style={{ paddingTop: insets.top }}>
        <View>
          <PandaTalkStage listening={listening} reaction={reaction} />
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
            {kind === "play" ? (
              <PlayContent onClose={goPet} />
            ) : thought ? (
              <ThoughtContent
                thought={thought}
                onDone={() => {
                  resolveThought("done");
                  goPet();
                }}
                // Ушли на экран письма или этапа — мысль остаётся
                onLeave={() => {}}
              />
            ) : null}
          </ScrollView>
        </View>
      </View>
    </PandaMoodContext.Provider>
  );
}
