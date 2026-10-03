// components/game/SetCard.tsx

import { ProgressBar } from "@/components/ui/ProgressBar";
import type { practiceSets } from "@/content/flashcards/sets";
import {
  getMasteryBucket,
  useWordProgressStore,
} from "@/store/wordProgressStore";
import { useTranslation } from "react-i18next";
import { Image, Pressable, Text, View } from "react-native";

type PracticeSet = (typeof practiceSets)[number];

type SetCardProps = {
  practiceSet: PracticeSet;
  onPress: (practiceSet: PracticeSet) => void;
};

export function SetCard({ practiceSet, onPress }: SetCardProps) {
  const { t } = useTranslation(["sets"]);

  const flashcardWords = useWordProgressStore((state) => state.flashcardWords);
  const vocabularyWords = useWordProgressStore(
    (state) => state.vocabularyWords,
  );

  const words = practiceSet.words;

  const masteredCount = words.filter(
    (word) =>
      getMasteryBucket(
        flashcardWords[word.vocabularyId],
        vocabularyWords[word.vocabularyId]?.isKnown ?? false,
        ["reading"],
      ) === "learned",
  ).length;

  const progress = words.length > 0 ? (masteredCount / words.length) * 100 : 0;

  return (
    <Pressable
      onPress={() => onPress(practiceSet)}
      className="bg-surface rounded-2xl overflow-hidden active:opacity-70"
      style={{
        shadowColor: "#a89e91",
        shadowOffset: { width: -2, height: 5 },
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

          <View className="flex-row items-center">
            <View className="flex-1">
              <ProgressBar progress={progress} />
            </View>
            <Image
              source={require("@/assets/images/bamboo.png")}
              className="h-6 w-8"
              resizeMode="cover"
            />
          </View>
        </View>
      </View>
    </Pressable>
  );
}
