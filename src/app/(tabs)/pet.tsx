// src/screens/PandaScreen.tsx

import UserIcon from "@/assets/images/icons/user-round.svg";
import practiceImg from "@/assets/images/practice.png";
import shopImg from "@/assets/images/shop.png";
import { CoinBalance } from "@/components/CoinBalance";
import { Screen } from "@/components/layout/Screen";
import { PandaScene } from "@/components/panda/PandaScene";
import { ThoughtTestPanel } from "@/components/panda/ThoughtTestPanel";
import { usePandaThought } from "@/hooks/panda/usePandaThought";
import { NavIconButton } from "@/components/ui/NavIconButton";
import { getLevelInfo, useProgressStore } from "@/store/userProgressStore";
import { colors } from "@/theme/colors";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
const PandaScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const xp = useProgressStore((s) => s.xp);
  const { level, xpIntoLevel, xpForNextLevel } = getLevelInfo(xp);
  const progressPercent = Math.min(100, (xpIntoLevel / xpForNextLevel) * 100);
  // Любой тап по панде — сцена разговора: фраза дня (если над головой облачко,
  // utils/panda/thoughts), затем меню игр (utils/panda/play). С облачком сначала
  // доигрывает анимация тапа
  const openTalk = () => router.push("/panda-talk" as any);
  const thought = usePandaThought(openTalk);
  const tapPanda = () => {
    if (thought.thought) thought.tapPanda();
    else openTalk();
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
          Тап по панде — сцена разговора: фраза дня и игры, см. app/(tabs)/panda-talk */}
      <View className="flex-1" />

      {/* Ряд навигационных иконок — обе просто переводят на отдельный
          экран, никакого локального state/анимации тут больше нет. */}
      <View className="flex-row justify-between pb-2">
        <NavIconButton
          image={practiceImg}
          label="Практика"
          onPress={() => router.push("/games")}
        />

        <NavIconButton
          image={shopImg}
          label="Магазин"
          onPress={() => router.push("/shop")}
        />
      </View>

    </Screen>
  );
};

export default PandaScreen;
