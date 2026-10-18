// src/screens/PandaScreen.tsx

import UserIcon from "@/assets/images/icons/user-round.svg";
import practiceImg from "@/assets/images/practice.png";
import shopImg from "@/assets/images/shop.png";
import { CoinBalance } from "@/components/CoinBalance";
import { Screen } from "@/components/layout/Screen";
import { PandaDialogBubble } from "@/components/panda/PandaDialogBubble";
import { PandaScene } from "@/components/panda/PandaScene";
import { NavIconButton } from "@/components/ui/NavIconButton";
import { usePandaDialog } from "@/hooks/panda/usePandaDialog";
import { getLevelInfo, useProgressStore } from "@/store/userProgressStore";
import { colors } from "@/theme/colors";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
const PandaScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { step, selectReply, close, speakPhrase } = usePandaDialog();
  const xp = useProgressStore((s) => s.xp);
  const { level, xpIntoLevel, xpForNextLevel } = getLevelInfo(xp);
  const progressPercent = Math.min(100, (xpIntoLevel / xpForNextLevel) * 100);

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
          <PandaScene />
        </View>
      </View>

      <View className="flex-1" />

      {/* Диалог панды: появляется после тренировки, если есть что сказать */}
      <View className="flex-1 relative">
        {step && (
          <View className="absolute bottom-4 left-4 right-4">
            <PandaDialogBubble
              text={step.text}
              phrase={step.phrase}
              replies={step.replies}
              onReply={selectReply}
              onSpeakPhrase={speakPhrase}
              onClose={close}
            />
          </View>
        )}
      </View>

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
