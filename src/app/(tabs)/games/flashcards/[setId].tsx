// app/(tabs)/games/flashcards/[levelId].tsx

import { FlashcardQuestion } from "@/components/game/FlashcardQuestion";
import { GameHeader } from "@/components/game/GameHeader";
import { Screen } from "@/components/layout/Screen";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useFlashcardGame } from "@/hooks/useFlashcardGame";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Image, Text, View, useWindowDimensions } from "react-native";

export default function LevelGameScreen() {
  const router = useRouter();

  const { setId } = useLocalSearchParams<{
    setId: string;
  }>();

  const [isExitModalVisible, setIsExitModalVisible] = useState(false);

  const { width, height } = useWindowDimensions();

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
      <Image
        source={require("@/assets/images/bg/game-1.png")}
        resizeMode="cover"
        style={{
          position: "absolute",
          width,
          height,
          bottom: 0,
          opacity: 0.8,
          zIndex: 0,
        }}
      />

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
          currentQuestion={currentIndex + 1}
          totalQuestions={questions.length}
          onExit={() => setIsExitModalVisible(true)}
        />

        <FlashcardQuestion
          hanzi={currentQuestion.hanzi}
          pinyin={currentQuestion.pinyin}
          options={currentQuestion.options}
          correctAnswer={currentQuestion.correctAnswer}
          selected={selected}
          isAnswered={isAnswered}
          onSelect={handleSelect}
        />
      </Screen>
    </View>
  );
}
