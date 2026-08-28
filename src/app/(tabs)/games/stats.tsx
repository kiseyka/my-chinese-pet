// app/(tabs)/games/stats.tsx
import DotSvg from "@/assets/images/svg/dot.svg";
import LineSvg from "@/assets/images/svg/line.svg";
import RedLineSvg from "@/assets/images/svg/redLine.svg";
import { Screen } from "@/components/layout/Screen";
import { BrushProgressCircle } from "@/components/ui/BrushProgressCircle";
import { WordCard } from "@/components/ui/WordCard";
import { useGameStore } from "@/store/gameStore";
import { useVocabularyStore } from "@/store/vocabularyStore";
import { colors } from "@/theme/colors";
import { calculateCoinsEarned } from "@/utils/calculateCoinsEarned";
import { formatDuration } from "@/utils/formatDuration";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, Pressable, ScrollView, Text, View } from "react-native";

export default function GeneralStatsScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const progress = useVocabularyStore((s) => s.progress);
  const toggleFavorite = useVocabularyStore((s) => s.toggleFavorite);

  const { xp } = useLocalSearchParams<{ xp: string }>();
  const earnedXp = Number(xp);

  const score = useGameStore((s) => s.score);
  const duration = useGameStore((s) => s.duration);
  const results = useGameStore((s) => s.results);

  const correctCount = score;
  const totalCount = results.length;
  const wrongAnswers = results.filter((r) => !r.isCorrect);
  const scorePercentage =
    totalCount === 0 ? 0 : Math.round((correctCount / totalCount) * 100);

  const coinsEarned = calculateCoinsEarned(scorePercentage);

  const [showWrongAnswers] = useState(true);

  return (
    <Screen>
      <View
        style={{
          paddingBottom: 16,
        }}
        className="flex-1 justify-around gap-10"
      >
        <Text className="text-text text-xl text-center tracking-widest font-nunitoMedium">
          {t("games.stats.success")}
        </Text>

        <View className="items-center flex-row justify-between px-5">
          <View className="items-center justify-center gap-2">
            <View>
              <Text className="text-3xl text-text text-center">
                +{correctCount}
              </Text>
              <Text className="text-sm text-center">
                XP {t("games.stats.gained")}
              </Text>
            </View>

            <View className=" items-center justify-center mt-2">
              <Text className="text-3xl text-text font-nunitoMedium">
                +{coinsEarned}
              </Text>
              <View className="flex-row items-center">
                <Image
                  style={{ width: 30, height: 30, opacity: 0.7 }}
                  source={require("@/assets/images/coins.png")}
                  resizeMode="contain"
                />
                <Text className="text-sm text-center">Получено</Text>
              </View>
            </View>
          </View>

          <View className="items-center justify-center">
            <BrushProgressCircle
              percentage={scorePercentage}
              size={140}
              strokeWidth={12}
              progressColor={colors.primary}
              backgroundColor={colors.progress.inactive}
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

        <View className="flex-1 w-full">
          {wrongAnswers.length > 0 ? (
            <View className="flex-1 flex-col gap-8">
              <View className="relative justify-center items-center py-2">
                <LineSvg
                  stroke={colors.progress.inactive}
                  fill={colors.progress.inactive}
                  className="absolute top-1/2 left-0 z-0"
                  width="100%"
                  height={10}
                />
                <View className="absolute top-0 z-10 bg-background px-3">
                  <Text className="text-lg mb-2 text-text">
                    {t("games.stats.mistakes")}
                  </Text>
                  <DotSvg width="100%" height={5} />
                </View>
              </View>

              <ScrollView
                className="w-full"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 16 }}
              >
                {showWrongAnswers && (
                  <View className="flex-col gap-2">
                    {wrongAnswers.map((item) => {
                      const wordProgress =
                        progress?.vocabulary.words[item.vocabularyId];

                      return (
                        <WordCard
                          key={item.vocabularyId}
                          hanzi={item.hanzi}
                          pinyin={item.pinyin}
                          translation={item.translation}
                          isFavorite={wordProgress?.isFavorite ?? false}
                          onToggleFavorite={() =>
                            toggleFavorite(item.vocabularyId)
                          }
                        />
                      );
                    })}
                  </View>
                )}
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

        <View className="w-full px-12 flex-col gap-3">
          <Pressable
            onPress={() => router.replace("/pet")}
            className="bg-primary active:bg-primaryDark rounded-xl"
          >
            <Text className="text-background text-lg p-5 text-center font-chineseMedium">
              {t("games.stats.continue")}
            </Text>
          </Pressable>

          {wrongAnswers.length > 0 && (
            <Pressable
              onPress={() => router.replace("/games")}
              className="bg-transparent items-center active:bg-primaryDark/10"
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
