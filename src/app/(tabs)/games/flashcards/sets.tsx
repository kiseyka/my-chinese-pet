// app/(game)/sets.tsx

import BookIcon from "@/assets/images/icons/vocabulary.svg";
import { SetCard } from "@/components/game/SetCard";
import { SetPreviewModal } from "@/components/game/SetPreviewModal";
import { Screen } from "@/components/layout/Screen";
import { BackButton } from "@/components/ui/BackButton";
import { Title } from "@/components/ui/Title";
import { practiceSets } from "@/content/flashcards/sets";
import { colors } from "@/theme/colors";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";

type PracticeSet = (typeof practiceSets)[number];

export default function PracticeSetsScreen() {
  const { t } = useTranslation(["sets"]);
  const router = useRouter();

  const [selectedSet, setSelectedSet] = useState<PracticeSet | null>(null);

  return (
    <Screen>
      <View className="flex-row items-center justify-between">
        <BackButton href="/games" />

        <Title>{t("common.title")}</Title>

        <Pressable
          onPress={() => router.push("/vocabulary")}
          hitSlop={8}
          className="h-10 w-10 items-center justify-center active:opacity-60"
          accessibilityRole="button"
          accessibilityLabel="Словарь"
        >
          <BookIcon width={26} height={26} color={colors.text} />
        </Pressable>
      </View>

      <View className="py-2 text-text text-lg">
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
        contentContainerStyle={{ paddingVertical: 16 }}
      >
        <View className="gap-4">
          {practiceSets.map((practiceSet) => (
            <SetCard
              key={practiceSet.id}
              practiceSet={practiceSet}
              onPress={setSelectedSet}
            />
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
