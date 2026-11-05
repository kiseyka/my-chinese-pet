// src/components/panda/PandaHeader.tsx
//
// Шапка экрана панды в стиле пергамента (components/ui/Parchment), как нижняя
// панель: слева плашка «профиль · уровень · опыт» (тап — профиль), справа плашка
// с монетами. Тексты — «чернила» (ink), шкала опыта — оливковая на светлой бумаге.

import UserIcon from "@/assets/images/icons/user-round.svg";
import { PARCHMENT, Parchment } from "@/components/ui/Parchment";
import { interopIconColor } from "@/lib/interopIcon";
import { getLevelInfo, useProgressStore } from "@/store/userProgressStore";
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
    <View className="z-10 flex-row items-center gap-2">
      <Pressable
        onPress={() => router.push("/profile")}
        className="flex-1 active:opacity-80"
        accessibilityRole="button"
        accessibilityLabel={`Профиль: уровень ${level}`}
      >
        <Parchment
          className="flex-row items-center gap-3 py-2 pl-2 pr-4"
          radius={32}
          // За плашкой: веточка сливы выглядывает над правым краем
          decor={[{ sprig: "plumSmall", width: 92, position: { right: 12, top: -20 } }]}
        >
          <View
            className="h-11 w-11 items-center justify-center rounded-full border"
            style={{ borderColor: PARCHMENT.border, backgroundColor: "rgba(228, 214, 190, 0.5)" }}
          >
            <UserIcon width={22} height={22} color={PARCHMENT.ink} />
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
              ОПЫТ  {xpIntoLevel} / {xpForNextLevel}
            </Text>
          </View>
        </Parchment>
      </Pressable>

      <Parchment className="flex-row items-center gap-2 py-2 pl-2 pr-2" radius={32}>
        <Image source={coin} style={{ width: 30, height: 30 }} />
        <Text className="font-nunitoBold text-lead" style={{ color: PARCHMENT.ink }}>
          {coins}
        </Text>
        <View className="h-6 w-6 items-center justify-center rounded-full bg-primary">
          <Text className="font-nunitoBold text-xs text-white">+</Text>
        </View>
      </Parchment>
    </View>
  );
}
