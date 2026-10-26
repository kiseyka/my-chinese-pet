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

import { SCREEN_TOP_GAP } from "@/components/layout/Screen";
import {
  PandaMoodContext,
  type PandaMood,
  type PandaReaction,
  type PandaWaiting,
} from "@/components/panda/PandaMood";
import {
  PlayContent,
  type PageGame,
} from "@/components/panda/PandaPlayContent";
import { PandaTalkStage } from "@/components/panda/PandaTalkStage";
import { BackButton } from "@/components/ui/BackButton";
import * as Speech from "expo-speech";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  const [reaction, setReaction] = useState<{
    kind: PandaReaction;
    id: number;
  } | null>(null);
  const mood = useMemo<PandaMood>(
    () => ({
      setWaiting,
      react: (next) =>
        setReaction((prev) => ({ kind: next, id: (prev?.id ?? 0) + 1 })),
    }),
    [],
  );

  const goPet = () => router.navigate("/pet");
  // «Ещё» — снова меню игр: экран панды откроет шторку (параметр play — каждый раз новый)
  const backToMenu = () =>
    router.navigate({ pathname: "/pet", params: { play: String(Date.now()) } });

  return (
    <PandaMoodContext.Provider value={mood}>
      {/* Один фон на всю страницу: панда стоит прямо на нём (у артборда фон прозрачный) */}
      <View className="flex-1 bg-background" style={{ paddingTop: insets.top + SCREEN_TOP_GAP }}>
        <View>
          <PandaTalkStage waiting={waiting} reaction={reaction} />
          {/* Стрелка «назад» — как везде в приложении, без подложки */}
          <View className="absolute left-4 top-2">
            <BackButton href="/pet" />
          </View>
        </View>

        {/* Игра сама делит место: загадка прокручивается, кнопки прибиты к низу */}
        <View className="flex-1">
          <PlayContent game={game} onClose={goPet} onMore={backToMenu} />
        </View>
      </View>
    </PandaMoodContext.Provider>
  );
}
