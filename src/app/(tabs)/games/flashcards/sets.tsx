// app/(game)/sets.tsx

import { MasteryBar } from "@/components/game/MasteryBar";
import { SetPreviewModal } from "@/components/game/SetPreviewModal";
import { Screen } from "@/components/layout/Screen";
import { BackButton } from "@/components/ui/BackButton";
import { practiceSets } from "@/content/flashcards/sets";
import {
  getMasteryBucket,
  useWordProgressStore,
} from "@/store/wordProgressStore";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function PracticeSetsScreen() {
  const { t } = useTranslation(["sets"]);
  const router = useRouter();

  const flashcardWords = useWordProgressStore((state) => state.flashcardWords);
  const vocabularyWords = useWordProgressStore(
    (state) => state.vocabularyWords,
  );

  const [selectedSet, setSelectedSet] = useState<
    (typeof practiceSets)[number] | null
  >(null);

  return (
    <Screen>
      <View className="flex-row items-center justify-between">
        <BackButton href="/games" />

        <Text className="text-text pr-4 text-3xl font-nunito">
          {t("common.title")}
        </Text>
        <View className="w-10" />
      </View>

      <View className="flex-col gap-2 pb-4 mt-4 border-b border-border/20">
        <Text>{t("common.subtitle")}</Text>
      </View>
      <SetPreviewModal
        visible={!!selectedSet}
        practiceSet={selectedSet}
        onClose={() => setSelectedSet(null)}
        onStart={() => {
          if (!selectedSet) return;
          router.push({
            pathname: "/games/flashcards/[setId]",
            params: { setId: selectedSet.id },
          });
          setSelectedSet(null);
        }}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingVertical: 16,
        }}
      >
        <View className="gap-4">
          {practiceSets.map((practiceSet) => {
            const words = practiceSet.words;

            const buckets = words.map((word) => {
              const skillProgress = flashcardWords[word.vocabularyId];
              const vocabWordProgress = vocabularyWords[word.vocabularyId];

              return getMasteryBucket(
                skillProgress,
                vocabWordProgress?.isKnown ?? false,
                ["reading"],
              );
            });

            const masteredCount = buckets.filter((b) => b === "learned").length;
            const learningCount = buckets.filter(
              (b) => b === "recognizing",
            ).length;

            return (
              <Pressable
                key={practiceSet.id}
                onPress={() => setSelectedSet(practiceSet)}
                className="bg-background rounded-2xl overflow-hidden active:opacity-70"
                style={{
                  shadowColor: "#a89e91",
                  shadowOffset: {
                    width: -2,
                    height: 5,
                  },
                  shadowOpacity: 1,
                  shadowRadius: 6,
                  elevation: 5,
                }}
              >
                <View className="flex-row h-30">
                  <View className="flex-1 p-5 justify-between">
                    <View className="flex-row justify-between items-center">
                      <Text className="text-text text-lg font-['NotoSansSCMedium']">
                        {t(practiceSet.title)}
                      </Text>
                      <Text className="text-text text-xs">
                        {t("common.masteredCount", {
                          count: masteredCount,
                          total: words.length,
                        })}
                      </Text>
                    </View>

                    <MasteryBar
                      total={words.length}
                      learningCount={learningCount}
                      masteredCount={masteredCount}
                    />
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
