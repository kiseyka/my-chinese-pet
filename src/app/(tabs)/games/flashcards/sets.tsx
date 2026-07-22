// app/(game)/sets.tsx

import { BackButton } from "@/components/ui/BackButton";
import { practiceSets } from "@/content/flashcards/sets";
import { loadProgress } from "@/services/storage/progressStorage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

export default function PracticeSetsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const [progress, setProgress] = useState<any>(null);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const savedProgress = await loadProgress();
        setProgress(savedProgress);
      };

      load();
    }, []),
  );

  return (
    <View className="flex-1 p-4 mt-8 relative">
      {/* Header */}
      <Image
        source={require("@/assets/images/bg/sets1.png")}
        resizeMode="cover"
        style={{
          position: "absolute",
          width,
          height,
          bottom: 0,
          opacity: 0.6,
          zIndex: 0,
        }}
      />
      <View className=" py-2 flex-row items-center justify-between">
        <BackButton href="/games" />

        <Text className="text-text text-xl pr-4 font-chineseMedium">
          {t("games.flashcards.title")}
        </Text>
        <View className="w-10" />
      </View>

      <Text className="text-text text-base mb-6 font-['NunitoRegular']">
        {t("games.flashcards.mascotBubble")}
      </Text>
      <View className="flex-col gap-2 mb-4">
        <Text className="text-xl ml-2">
          {t("games.flashcards.sectionTitle")}
        </Text>
        <Text> {t("games.flashcards.sectionSubtitle")}</Text>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 20,
        }}
      >
        <View className="gap-4">
          {practiceSets.map((practiceSet) => {
            // Все слова текущего сета
            const words = practiceSet.words;

            // Прогресс каждого слова
            const wordProgress = words.map(
              (word) => progress?.flashcards?.words?.[word.id],
            );

            // Сколько слов уже встречались пользователю
            const learnedWords = wordProgress.filter(
              (word) => word && word.mastery > 0,
            ).length;

            // Сколько слов достигли mastery 5
            const masteredWords = wordProgress.filter(
              (word) => word && word.mastery === 5,
            ).length;

            // Средний mastery по сету
            const totalMastery = wordProgress.reduce(
              (sum, word) => sum + (word?.mastery ?? 0),
              0,
            );

            const maxMastery = words.length * 5;

            const masteryPercent =
              maxMastery > 0
                ? Math.round((totalMastery / maxMastery) * 100)
                : 0;

            return (
              <Pressable
                key={practiceSet.id}
                onPress={() =>
                  router.push({
                    pathname: "/games/flashcards/[setId]",
                    params: {
                      setId: practiceSet.id,
                    },
                  })
                }
                className="bg-background rounded-2xl overflow-hidden active:opacity-70"
                style={{
                  shadowColor: "#E6DBCA",
                  shadowOffset: {
                    width: -2,
                    height: 5,
                  },
                  shadowOpacity: 0.84,
                  shadowRadius: 6,
                  elevation: 5,
                }}
              >
                <View className="flex-row h-30">
                  {/* Image */}
                  <Image
                    source={practiceSet.image}
                    resizeMode="cover"
                    className="h-full w-28 rounded-full"
                  />

                  {/* Main content */}
                  <View className="flex-1 p-5 justify-between">
                    <View className="flex-row justify-between items-center">
                      <Text className="text-text text-xl font-['NotoSansSCMedium']">
                        {t(practiceSet.title)}
                      </Text>
                      <Text className="text-text text-xs">
                        {practiceSet.words.length}
                        {t("games.flashcards.wordsCount")}
                      </Text>
                    </View>

                    {/* Mastery progress */}
                    <View className="mt-3">
                      <View className="flex-row justify-between mb-1">
                        <Text className="text-text text-xs">
                          {t("games.flashcards.mastery")}
                        </Text>

                        <Text className="text-text text-xs">
                          {masteryPercent}%
                        </Text>
                      </View>

                      <View className="h-2 bg-[#E2D9CD] rounded-full overflow-hidden">
                        <View
                          className="h-full bg-primary rounded-full"
                          style={{
                            width: `${masteryPercent}%`,
                          }}
                        />
                      </View>
                    </View>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
