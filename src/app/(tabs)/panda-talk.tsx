// app/(tabs)/panda-talk.tsx
//
// Страница игры с пандой: сверху панда крупным планом (PandaTalkStage,
// panda_talk_thinking.riv), снизу — игра лентой, с прокруткой. Правило: где будут
// анимации панды — целая страница, где нет (фраза дня, меню «Чем займёмся?») —
// модальная шторка на экране панды (PandaTalkSheet).
//   game=pick   — «Угадай слово», раунд из 3 загадок;
//   game=listen — «Послушай и угадай», раунд из 3 загадок.
// Панда отзывается на игру через PandaMood (думает над загадкой, радуется, удивляется)
// и «говорит», пока звучит озвучка (store/speechStore).
//
// «Назад» и «Готово» — к панде; «Ещё» — к панде со шторкой меню (параметр play).
// Экран остаётся смонтированным между заходами (вкладка) — каждый заход начинаем заново:
// у каждого перехода сюда свой параметр run, по нему игра монтируется с нуля ровно один
// раз. (Раньше счётчик заходов менялся в useFocusEffect уже после первого рендера —
// игра и Rive-панда собирались дважды, и страница открывалась с задержкой.)

import BackIcon from "@/assets/images/icons/arrow-left.svg";
import {
  PandaMoodContext,
  type PandaMood,
  type PandaReaction,
  type PandaWaiting,
} from "@/components/panda/PandaMood";
import { PlayContent, type PageGame } from "@/components/panda/PandaPlayContent";
import { PandaTalkStage } from "@/components/panda/PandaTalkStage";
import { colors } from "@/theme/colors";
import * as Speech from "expo-speech";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Насколько панель диалога заходит на сцену (скруглённый верх поверх панды). */
const PANEL_OVERLAP = 24;

const GAMES: PageGame[] = ["pick", "listen"];

export default function PandaTalkRoute() {
  const { game, run } = useLocalSearchParams<{ game?: string; run?: string }>();
  useFocusEffect(
    useCallback(() => {
      // Ушли со сцены — панда замолкает
      return () => {
        Speech.stop();
      };
    }, []),
  );

  const kind = GAMES.find((g) => g === game) ?? "pick";
  return <PandaTalk key={`${kind}-${run ?? ""}`} game={kind} />;
}

function PandaTalk({ game }: { game: PageGame }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

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
  // «Ещё» — снова меню игр: экран панды откроет шторку (параметр play — каждый раз новый)
  const backToMenu = () =>
    router.navigate({ pathname: "/pet", params: { play: String(Date.now()) } });

  return (
    <PandaMoodContext.Provider value={mood}>
      <View className="flex-1 bg-[#EDE0CE]" style={{ paddingTop: insets.top }}>
        {/* Снизу запас на заход панели: панель ложится на него, а не на лапки */}
        <View style={{ paddingBottom: PANEL_OVERLAP }}>
          <PandaTalkStage waiting={waiting} reaction={reaction} />
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
            <PlayContent game={game} onClose={goPet} onMore={backToMenu} />
          </ScrollView>
        </View>
      </View>
    </PandaMoodContext.Provider>
  );
}
