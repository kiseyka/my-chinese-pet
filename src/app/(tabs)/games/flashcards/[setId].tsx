// app/(tabs)/games/flashcards/[setsId].tsx

import { FlashcardQuestion } from "@/components/game/FlashcardQuestion";
import { GameHeader } from "@/components/game/GameHeader";
import { Screen } from "@/components/layout/Screen";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useFlashcardGame } from "@/hooks/useFlashcardGame";
import { useSettingsStore } from "@/store/settingsStore";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";

export default function LevelGameScreen() {
  const router = useRouter();
  const [isExitModalVisible, setIsExitModalVisible] = useState(false);
  const { setId } = useLocalSearchParams<{
    setId: string;
  }>();

  const showPinyin = useSettingsStore((s) => s.showPinyin);

  const {
    practiceSet,
    questions,
    currentQuestion,
    currentIndex,
    selected,
    isAnswered,
    progressPercent,
    handleSelect,
  } = useFlashcardGame({
    setId,
  });

  if (!practiceSet || !currentQuestion) {
    return (
      <View>
        <Text>Level not found</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 relative w-full h-full">
      <Screen>
        <ConfirmModal
          isVisible={isExitModalVisible}
          onClose={() => setIsExitModalVisible(false)}
          onConfirm={() => {
            setIsExitModalVisible(false);
            router.replace("/games/flashcards/sets");
          }}
        />

        <GameHeader
          progress={progressPercent}
          onExit={() => setIsExitModalVisible(true)}
        />

        <FlashcardQuestion
          hanzi={currentQuestion.hanzi}
          pinyin={currentQuestion.pinyin}
          options={currentQuestion.options}
          correctAnswer={currentQuestion.correctAnswer}
          selected={selected}
          isAnswered={isAnswered}
          showPinyin={showPinyin}
          onSelect={handleSelect}
        />
      </Screen>
    </View>
  );
}
