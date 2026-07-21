// app/(tabs)/games/stats.tsx
import DotSvg from "@/assets/images/svg/dot.svg";
import LineSvg from "@/assets/images/svg/line.svg";
import RedLineSvg from "@/assets/images/svg/redLine.svg";
import { WordCard } from "@/components/game/WordCard";
import { Screen } from "@/components/layout/Screen";
import { BrushProgressCircle } from "@/components/ui/BrushProgressCircle";
import { useGameStore } from "@/store/gameStore";
import { formatDuration } from "@/utils/formatDuration";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

export default function GeneralStatsScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const { gameId, xp } = useLocalSearchParams<{
    gameId: string;
    xp: string;
  }>();
  const earnedXp = Number(xp);
  const score = useGameStore((s) => s.score);
  const duration = useGameStore((s) => s.duration);
  const results = useGameStore((s) => s.results);
  const correctCount = score;
  const totalCount = results.length;
  const correctAnswers = results.filter((r) => r.isCorrect);
  const { width, height } = useWindowDimensions();
  const wrongAnswers = results.filter((r) => !r.isCorrect);
  const wrongCount = totalCount - correctCount;
  const [showWrongAnswers, setShowWrongAnswers] = useState(true);
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(false);
  const scorePercentage =
    totalCount === 0 ? 0 : Math.round((correctCount / totalCount) * 100);
  const radius = 60;
  const strokeWidth = 10;

  const circumference = 2 * Math.PI * radius;

  const offset = circumference * (1 - scorePercentage / 100);

  return (
    <Screen>
      <Image
        source={require("@/assets/images/bg/bg-stats.png")}
        resizeMode="cover"
        style={{
          position: "absolute",
          width,
          height,
          bottom: 50,
          opacity: 0.6,
          zIndex: 0,
        }}
      />
      <View className="flex-1 justify-around my-8 gap-10">
        <Text className="text-text mt-5 text-xl text-center tracking-widest font-nunitoMedium">
          {t("games.stats.success")}
        </Text>

        <View className="items-center flex-row justify-between px-5">
          <View>
            <Text className="text-3xl text-center">+{earnedXp}</Text>
            <Text className="text-sm text-center">
              XP {t("games.stats.gained")}
            </Text>
          </View>

          <View className="items-center justify-center">
            <BrushProgressCircle
              percentage={scorePercentage}
              size={140}
              strokeWidth={12}
              progressColor="#A03927" // Темный графитовый для заполненной части
              backgroundColor="#E2D9CD" // Серо-бежевый для незаполненной части
              label="Точность"
            />
          </View>
          <View>
            <Text className="text-3xl text-center">
              {formatDuration(duration)}
            </Text>
            <Text className="text-sm text-center">{t("games.stats.time")}</Text>
          </View>
        </View>

        {/* ScrollView с фиксированной высотой */}
        <View className="flex-1 w-full">
          {wrongAnswers.length > 0 ? (
            <View className="flex-1 flex-col gap-8">
              <View className="relative justify-center items-center py-2">
                <LineSvg
                  stroke="#E2D9CD"
                  fill="#E2D9CD"
                  className="absolute top-1/2 left-0 z-0"
                  width="100%"
                  height={10}
                />
                <View className="absolute top-0 z-10 bg-[#F7F4ED] px-3">
                  <Text className="text-lg mb-2 text-text">
                    {t("games.stats.mistakes")}
                  </Text>
                  <DotSvg width="100%" height={5} />
                </View>
              </View>
              <ScrollView
                className="w-full"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                  paddingBottom: 16,
                }}
              >
                <View className="flex-col gap-2">
                  {showWrongAnswers &&
                    wrongAnswers.map((item) => (
                      <WordCard
                        key={item.hanzi}
                        hanzi={item.hanzi}
                        pinyin={item.pinyin}
                        translation={item.translation}
                      />
                    ))}
                </View>
              </ScrollView>
            </View>
          ) : (
            <View className="flex-1 items-center justify-center px-8">
              <Text className="text-2xl text-primary mb-3">
                🎉 {t("games.stats.perfect")}
              </Text>

              <Text className="text-text text-center text-base leading-6">
                {t("games.stats.perfectMessage")}
              </Text>
            </View>
          )}
        </View>

        {/* Кнопки вынесены за пределы ScrollView */}
        <View className="w-full px-12 flex-col gap-3">
          <Pressable
            onPress={() => {
              if (gameId === "flashcards") {
                router.replace("/games/flashcards/sets");
              } else {
                router.replace("/games");
              }
            }}
            className="bg-primary active:bg-[#5E1D13] rounded-xl"
          >
            <Text className="text-background text-lg p-5 text-center font-chineseMedium">
              {t("games.stats.continue")}
            </Text>
          </Pressable>
          {wrongAnswers.length > 0 && (
            <Pressable
              onPress={() => router.replace("/games")}
              className="bg-transparent items-center active:bg-[#6B6257]/10"
            >
              <Text className="text-text px-5 leading-5 mb-2 text-center font-chineseMedium">
                {t("games.stats.review")}
              </Text>
              <RedLineSvg width="100%" height={12} />
            </Pressable>
          )}
        </View>
      </View>
    </Screen>
  );
}
