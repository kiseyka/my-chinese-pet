// src/screens/PandaScreen.tsx

import UserIcon from "@/assets/images/icons/user-round.svg";
import { CoinBalance } from "@/components/CoinBalance";
import { DailySetupSheet } from "@/components/daily/DailySetupSheet";
import { Screen } from "@/components/layout/Screen";
import { PandaNavBar } from "@/components/panda/PandaNavBar";
import { PandaScene } from "@/components/panda/PandaScene";
import { PandaTalkSheet } from "@/components/panda/PandaTalkSheet";
import { ThoughtTestPanel } from "@/components/panda/ThoughtTestPanel";
import { usePandaThought } from "@/hooks/panda/usePandaThought";
import { useDaily } from "@/hooks/useDaily";
import { useDailyStore } from "@/store/dailyStore";
import { getLevelInfo, useProgressStore } from "@/store/userProgressStore";
import { colors } from "@/theme/colors";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
const PandaScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const xp = useProgressStore((s) => s.xp);
  const { level, xpIntoLevel, xpForNextLevel } = getLevelInfo(xp);
  const progressPercent = Math.min(100, (xpIntoLevel / xpForNextLevel) * 100);
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
      <View className="flex-row justify-between items-center px-2 z-10">
        {/* Левая колонка: профиль, уровень и опыт */}
        <View className="flex-row items-center gap-3" style={{ width: "60%" }}>
          <Pressable
            onPress={() => router.push("/profile")}
            className="items-center justify-center rounded-full border border-primary/30 bg-surface active:opacity-70"
            style={{ width: 44, height: 44 }}
            accessibilityRole="button"
            accessibilityLabel="Профиль"
            hitSlop={6}
          >
            <UserIcon width={24} height={24} color={colors.primary} />
          </Pressable>

          <View className="flex-1 flex-col gap-1">
            <Text className="font-nunito text-lg tracking-wide text-text">
              УРОВЕНЬ {level}
            </Text>

            <View className="w-full h-2.5 rounded-full overflow-hidden bg-surface border border-primary/30">
              <View
                className="h-full rounded-full bg-primary opacity-100"
                style={{ width: `${progressPercent}%` }}
              />
            </View>

            <View className="flex-row gap-2 items-center">
              <Text className="font-nunito text-xs tracking-wide text-text">
                ОПЫТ
              </Text>
              <Text className="font-nunito text-xs text-text">
                {xpIntoLevel} / {xpForNextLevel}
              </Text>
            </View>
          </View>
        </View>

        {/* Правая колонка: монеты */}
        <CoinBalance />
      </View>

      {/* Только в режиме разработки: запустить облачко для проверки */}
      <ThoughtTestPanel />

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
