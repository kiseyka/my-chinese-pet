// src/screens/PandaScreen.tsx

import ArrowR from "@/assets/images/icons/chevron-right.svg";
import { Screen } from "@/components/layout/Screen";
import {
  PandaCompanion,
  type PandaState,
} from "@/components/panda/PandaCompanion";
import { PandaMessage } from "@/components/panda/PandaMessage";
import { getPandaGreeting } from "@/content/panda/pandaGreetings";
import { getPandaMessage } from "@/services/panda/getPandaMessage";
import { usePandaStore } from "@/store/pandaStore";
import { getLevelInfo, useProgressStore } from "@/store/userProgressStore";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, Pressable, Text, View } from "react-native";

const MOCK_HOURS_SINCE_VISIT: number | null = 5;

const PandaScreen = () => {
  const { t } = useTranslation(["panda"]);
  const router = useRouter();
  const pendingResult = usePandaStore((s) => s.pendingTrainingResult);
  const clearPendingResult = usePandaStore((s) => s.clearPendingTrainingResult);
  const increaseBond = usePandaStore((s) => s.increaseBond);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const xp = useProgressStore((s) => s.xp);
  const coins = useProgressStore((s) => s.coins);
  const { level, xpIntoLevel, xpForNextLevel } = getLevelInfo(xp);
  const progressPercent = Math.min(100, (xpIntoLevel / xpForNextLevel) * 100);

  const pandaState: PandaState = pendingResult ? "wants_to_talk" : "idle";
  const pandaWantsToTalk = pandaState === "wants_to_talk";

  const greeting = getPandaGreeting({
    hoursSinceLastVisit: MOCK_HOURS_SINCE_VISIT,
    timeOfDay: getTimeOfDay(),
  });

  const trainingPhrase = useMemo(() => {
    if (!pendingResult) return null;

    const accuracy =
      pendingResult.total > 0
        ? Math.round((pendingResult.score / pendingResult.total) * 100)
        : 0;

    return getPandaMessage({ type: "set_completed", accuracy });
  }, [pendingResult]);

  const handlePandaPress = () => {
    if (pandaState === "wants_to_talk") {
      setIsDialogOpen(true);
    }
  };

  const handleCloseDialog = () => {
    if (pendingResult) {
      increaseBond(1);
    }

    setIsDialogOpen(false);
    clearPendingResult();
  };

  const messageTitle =
    isDialogOpen && trainingPhrase
      ? t(trainingPhrase.textKey)
      : pandaWantsToTalk
        ? "Эй..."
        : greeting.title;

  const messageSubtitle =
    isDialogOpen && trainingPhrase
      ? undefined
      : pandaWantsToTalk
        ? "Нажми на меня, я хочу тебе кое-что рассказать!"
        : "";

  return (
    <Screen>
      {/* Верхняя панель: уровень / опыт / валюта */}
      <View className="flex-row items-center px-4 gap-3">
        {/* Карточка уровня */}
        <View className="border border-border rounded-2xl p-2 items-center">
          <Text className="font-nunito text-xs tracking-wide text-text">
            УРОВЕНЬ
          </Text>
          <Text className="font-nunitoBold text-2xl text-text border-b px-1 border-b-text">
            {level}
          </Text>
          {/* <LineSvg width="100%" height={2} color="black" /> */}
        </View>

        {/* Шкала опыта */}
        <View className="flex-1 justify-center relative">
          <View className="flex-row gap-2 items-center mb-1 absolute left-0 bottom-3">
            <Text className="font-nunito text-xs tracking-wide text-text">
              ОПЫТ
            </Text>
            <Text className="font-nunito text-xs text-text">
              {xpIntoLevel} / {xpForNextLevel}
            </Text>
          </View>
          <View className="w-full h-2.5 rounded-full overflow-hidden bg-progress-inactive relative">
            <View
              className="absolute top-0 bottom-0 left-0 rounded-full bg-progress-active"
              style={{ width: `${progressPercent}%` }}
            />
          </View>
        </View>

        {/* Валюта */}
        <View className="border flex-row border-border rounded-2xl h-12 px-3 items-center ">
          <Image
            style={{ width: 30, height: 30, opacity: 0.7 }}
            source={require("../../../assets/images/coins.png")}
            resizeMode="contain"
          />
          <Text className="font-nunito text-sm text-text" numberOfLines={1}>
            {coins}
          </Text>
        </View>
      </View>

      <View className="flex-1 relative">
        <View className="flex-1 items-center justify-center">
          <PandaCompanion state={pandaState} onPress={handlePandaPress} />
        </View>

        <View
          className="absolute left-0 right-0 items-center px-6"
          style={{ top: 24 }}
        >
          <PandaMessage title={messageTitle} subtitle={messageSubtitle} />
        </View>

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

      {/* Нижняя панель: тренировки / магазин */}
      <View className="flex-row gap-3 pb-4">
        <Pressable
          onPress={() => router.push("/games")}
          className="flex-1 flex-row items-center justify-around rounded-2xl px-2 pl-4 py-4"
          style={{ backgroundColor: "#D9E3D3" }}
        >
          <Image
            style={{ width: 26, height: 30 }}
            source={require("@/assets/training.png")}
            resizeMode="contain"
          />
          <Text className="text-text  text-sm">ТРЕНИРОВКИ</Text>
          <ArrowR height={22} width={22} color="#4A4A4A" strokeWidth={1} />
        </Pressable>

        <Pressable
          onPress={() => router.push("/games")}
          className="flex-1 flex-row items-center justify-around gap-2 rounded-2xl py-4"
          style={{ backgroundColor: "#E8DCC8" }}
        >
          <Image
            style={{ width: 26, height: 26 }}
            source={require("@/assets/shop.png")}
            resizeMode="contain"
          />
          <Text className="text-text text-sm">МАГАЗИН</Text>
          <ArrowR height={22} width={22} color="#4A4A4A" strokeWidth={1} />
          {/* <Text className="text-text text-3xl">{"›"}</Text> */}
        </Pressable>
      </View>
    </Screen>
  );
};

function getTimeOfDay(): "morning" | "day" | "evening" | "night" {
  const hour = new Date().getHours();

  if (hour < 6) return "night";
  if (hour < 12) return "morning";
  if (hour < 18) return "day";

  return "evening";
}

export default PandaScreen;
