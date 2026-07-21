// app/(game)/sets.tsx

import { Screen } from "@/components/layout/Screen";
import { BackButton } from "@/components/ui/BackButton";
import { practiceSets } from "@/content/flashcards/sets";
import { loadProgress } from "@/services/storage/progressStorage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function PracticeSetsScreen() {
  const router = useRouter();
  const { t } = useTranslation();

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
    <Screen>
      {/* Header */}
      <View className="px-4 pt-2 flex-row items-center justify-between">
        <BackButton href="/games" />

        <Text className="text-text font-bold text-2xl pr-4 font-['NotoSansSCBold']">
          Practice Sets
        </Text>

        <View className="w-10" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 24,
          paddingBottom: 60,
        }}
      >
        <Text className="text-textSecondary text-base mb-6 font-['NunitoRegular']">
          Choose a topic to practice
        </Text>

        <View className="gap-4">
          {practiceSets.map((practiceSet, index) => {
            const stats = progress?.flashcards?.sets?.[practiceSet.id];

            const isCompleted = !!stats;

            const accuracy = stats?.accuracy ?? 0;

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
                className="bg-background border border-border/50 rounded-2xl p-5 active:opacity-70"
              >
                <View className="flex-row items-center">
                  {/* Иконка */}
                  <View className="w-14 h-14 rounded-full bg-[#E2D9CD] items-center justify-center mr-4">
                    <Text className="text-2xl">
                      {index === 0 ? "👋" : index === 1 ? "123" : "👨‍👩‍👧"}
                    </Text>
                  </View>

                  {/* Основная информация */}
                  <View className="flex-1">
                    <Text className="text-text text-xl font-['NotoSansSCMedium']">
                      {practiceSet.title}
                    </Text>

                    {practiceSet.description && (
                      <Text
                        numberOfLines={2}
                        className="text-textSecondary text-sm mt-1 font-['NunitoRegular']"
                      >
                        {practiceSet.description}
                      </Text>
                    )}

                    <Text className="text-textSecondary text-xs mt-2">
                      {practiceSet.words.length} words
                    </Text>
                  </View>

                  {/* Статус */}
                  <View className="items-end ml-3">
                    {isCompleted ? (
                      <>
                        <Text className="text-primary text-lg font-bold">
                          {accuracy}%
                        </Text>

                        <Text className="text-textSecondary text-xs mt-1">
                          Completed
                        </Text>
                      </>
                    ) : (
                      <Text className="text-textSecondary text-xs">
                        Not started
                      </Text>
                    )}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </Screen>
  );
}
