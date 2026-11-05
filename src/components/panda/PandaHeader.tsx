// src/components/panda/PandaHeader.tsx
//
// Шапка экрана панды — одна плашка-пергамент (components/ui/Parchment), как нижняя
// панель: профиль · уровень и опыт | монеты. Тап по левой части — профиль.
// Тап по монетам — магазин. Между частями — тонкая линия, как между пунктами нижней панели.

import UserIcon from "@/assets/images/icons/user-round.svg";
import { PARCHMENT, Parchment } from "@/components/ui/Parchment";
import { interopIconColor } from "@/lib/interopIcon";
import { getLevelInfo, useProgressStore } from "@/store/userProgressStore";
import { colors } from "@/theme/colors";
import { useRouter } from "expo-router";
import { Image, Pressable, Text, View } from "react-native";

interopIconColor(UserIcon);

const coin = require("@/assets/images/paw-coin.png");

export function PandaHeader() {
  const router = useRouter();
  const xp = useProgressStore((s) => s.xp);
  const coins = useProgressStore((s) => s.coins);
  const { level, xpIntoLevel, xpForNextLevel } = getLevelInfo(xp);
  const progressPercent = Math.min(100, (xpIntoLevel / xpForNextLevel) * 100);

  return (
    <Parchment
      className="z-10 flex-row items-center p-2"
      radius={36}
    >
      <Pressable
        onPress={() => router.push("/profile")}
        className="flex-1 flex-row items-center gap-3 active:opacity-70"
        accessibilityRole="button"
        accessibilityLabel={`Профиль: уровень ${level}`}
      >
        <View
          className="h-11 w-11 items-center justify-center rounded-full border"
          style={{
            borderColor: PARCHMENT.border,
            backgroundColor: "rgba(228, 214, 190, 0.5)",
          }}
        >
          <UserIcon width={22} height={22} strokeWidth={1.5} color={colors.primary} />
        </View>

        <View className="flex-1 gap-1">
          <Text
            className="font-nunitoBold text-body tracking-wide"
            style={{ color: PARCHMENT.ink }}
          >
            УРОВЕНЬ {level}
          </Text>
          <View
            className="h-2 w-full overflow-hidden rounded-full border"
            style={{ borderColor: PARCHMENT.border, backgroundColor: PARCHMENT.line }}
          >
            <View
              className="h-full rounded-full bg-primary"
              style={{ width: `${progressPercent}%` }}
            />
          </View>
          <Text
            className="font-nunito text-xs tracking-wide"
            style={{ color: PARCHMENT.ink, opacity: 0.75 }}
          >
            ОПЫТ {xpIntoLevel} / {xpForNextLevel}
          </Text>
        </View>
      </Pressable>

      {/* Тонкая линия между уровнем и монетами */}
      <View className="mx-3 w-px self-stretch my-1" style={{ backgroundColor: PARCHMENT.border }} />

      <Pressable
        onPress={() => router.push("/shop")}
        className="min-h-11 flex-row items-center gap-2 pr-3 active:opacity-70"
        accessibilityRole="button"
        accessibilityLabel={`Монеты: ${coins}. Открыть магазин`}
      >
        <Image source={coin} style={{ width: 28, height: 28 }} />
        <Text className="font-nunito text-xl" style={{ color: PARCHMENT.ink }}>
          {coins}
        </Text>
      </Pressable>
    </Parchment>
  );
}
