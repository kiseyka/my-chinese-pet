// src/screens/PandaScreen.tsx

import { Screen } from "@/components/layout/Screen";
import { PandaScene } from "@/components/panda/PandaScene";
import { NavIconButton } from "@/components/ui/NavIconButton";
import { usePandaStore } from "@/store/pandaStore";
import { getLevelInfo, useProgressStore } from "@/store/userProgressStore";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PandaScreen = () => {
  const { t } = useTranslation(["panda"]);
  const router = useRouter();
  const pendingResult = usePandaStore((s) => s.pendingTrainingResult);
  const clearPendingResult = usePandaStore((s) => s.clearPendingTrainingResult);
  const increaseBond = usePandaStore((s) => s.increaseBond);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const xp = useProgressStore((s) => s.xp);
  const coins = useProgressStore((s) => s.coins);
  const { level, xpIntoLevel, xpForNextLevel } = getLevelInfo(xp);
  const progressPercent = Math.min(100, (xpIntoLevel / xpForNextLevel) * 100);

  const handleCloseDialog = () => {
    if (pendingResult) {
      increaseBond(1);
    }

    setIsDialogOpen(false);
    clearPendingResult();
  };

  return (
    <Screen>
      <View className="flex-row justify-between items-center px-2 z-10">
        <View className="flex-col gap-1" style={{ width: "50%" }}>
          <Text className="font-nunito text-lg tracking-wide text-text">
            УРОВЕНЬ {level}
          </Text>

          <View className="w-full h-2.5 rounded-full overflow-hidden bg-progress-inactive/50 ">
            <View
              className="h-full rounded-full bg-progress-active opacity-100"
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

        {/* Правая колонка: монеты */}
        <View className="flex-col items-center gap-1">
          <View className="flex-row items-center gap-1">
            <Image
              style={{ width: 30, height: 30, opacity: 0.7 }}
              source={require("@/assets/images/coin.png")}
              resizeMode="contain"
            />
            <Text className="font-nunito text-xl text-text" numberOfLines={1}>
              {coins}
            </Text>
          </View>
        </View>
      </View>

      {/* Сцена с пандой — на весь экран под шапкой. Раньше тут была
          анимация сжатия снизу под панель магазина — панели больше нет,
          сцена больше ничем не ужимается. */}
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
            bottom: insets.bottom,
          }}
        >
          <PandaScene />
        </View>
      </View>

      <View className="flex-1" />

      <View className="flex-1 relative">
        {isDialogOpen && (
          <Pressable
            onPress={handleCloseDialog}
            className="absolute bottom-24 self-center"
          >
            <View className="rounded-full px-4 py-2">
              <Text className="text-white">Понятно!</Text>
            </View>
          </Pressable>
        )}
      </View>

      {/* Ряд навигационных иконок — обе просто переводят на отдельный
          экран, никакого локального state/анимации тут больше нет. */}
      <View className="flex-row justify-center items-start gap-8 pb-2">
        <NavIconButton
          icon={<Text style={{ fontSize: 24 }}>🎓</Text>}
          label="Тренировки"
          onPress={() => router.push("/games")}
        />
        <NavIconButton
          icon={<Text style={{ fontSize: 24 }}>🛍️</Text>}
          label="Магазин"
          onPress={() => router.push("/shop")}
        />
      </View>
    </Screen>
  );
};

export default PandaScreen;
