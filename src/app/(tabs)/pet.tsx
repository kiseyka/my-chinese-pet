// src/screens/PandaScreen.tsx

import { DailySetupSheet } from "@/components/daily/DailySetupSheet";
import { Screen } from "@/components/layout/Screen";
import { PandaHeader } from "@/components/panda/PandaHeader";
import { PandaNavBar } from "@/components/panda/PandaNavBar";
import { PandaScene } from "@/components/panda/PandaScene";
import { PandaTalkSheet } from "@/components/panda/PandaTalkSheet";
import { usePandaThought } from "@/hooks/panda/usePandaThought";
import { useDaily } from "@/hooks/useDaily";
import { useDailyStore } from "@/store/dailyStore";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
const PandaScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // Любой тап по панде — шторка разговора: фраза дня (если над головой облачко,
  // utils/panda/thoughts), затем меню игр (utils/panda/play). С облачком сначала
  // доигрывает анимация тапа
  const [talkId, setTalkId] = useState<number | null>(null);
  const openTalk = () => setTalkId(Date.now());
  const thought = usePandaThought(openTalk);
  const tapPanda = () => {
    if (thought.thought) thought.tapPanda();
    else openTalk();
  };
  const closeTalk = () => {
    setTalkId(null);
    thought.closed();
  };
  // «Ещё» на странице игры (/panda-talk) возвращает сюда с play — снова меню игр
  const { play } = useLocalSearchParams<{ play?: string }>();
  useEffect(() => {
    if (play) setTalkId(Date.now());
  }, [play]);

  // Слова дня (utils/daily): при первом заходе сами спрашиваем, сколько новых в день
  const daily = useDaily();
  const [setupOpen, setSetupOpen] = useState<{
    current: typeof daily.perDay;
  } | null>(null);
  useEffect(() => {
    const { perDay, setupOffered } = useDailyStore.getState();
    if (!perDay && !setupOffered) setSetupOpen({ current: null });
  }, []);
  const closeSetup = () => {
    setSetupOpen(null);
    useDailyStore.getState().setSetupOffered();
  };

  return (
    <Screen className="bg-[#EDE0CE]">
      {/* Шапка: профиль, уровень и опыт, монеты — пергамент, как нижняя панель */}
      <PandaHeader />

      {/* Сцена с пандой — на весь экран под шапкой. */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: insets.bottom,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        >
          <PandaScene
            hasThought={thought.hasCloud}
            onPandaPress={tapPanda}
          />
        </View>
      </View>

      <View className="flex-1" />

      {/* Новости панды не показываются: копятся тихо (utils/panda/news).
          Тап по панде — шторка разговора: фраза дня и игры, см. PandaTalkSheet */}
      <View className="flex-1" />

      {/* Нижняя панель: тренировки, слова дня (всплывашка «Слова / Письмо»), магазин */}
      <PandaNavBar
        onTrainings={() => router.push("/games")}
        onShop={() => router.push("/shop")}
        daily={{
          configured: !!daily.perDay,
          reading: daily.reading,
          writing: daily.writing,
          onStart: daily.start,
          onSettings: () => setSetupOpen({ current: daily.perDay }),
        }}
      />

      <PandaTalkSheet openId={talkId} onClose={closeTalk} />
      <DailySetupSheet
        open={setupOpen}
        onClose={closeSetup}
        onSave={(perDay) => {
          daily.saveSettings(perDay);
          setSetupOpen(null);
        }}
      />
    </Screen>
  );
};

export default PandaScreen;
