// app/(tabs)/games/flashcards/[setId].tsx
//
// Тренировка карточками по своему набору.

import { FlashcardQuestion } from "@/components/game/FlashcardQuestion";
import { GameHeader } from "@/components/game/GameHeader";
import { Screen } from "@/components/layout/Screen";
import { BackButton } from "@/components/ui/BackButton";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useFlashcardGame } from "@/hooks/useFlashcardGame";
import { MIN_SET_WORDS } from "@/store/customSetsStore";
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
    currentQuestion,
    selected,
    isAnswered,
    progressPercent,
    handleSelect,
  } = useFlashcardGame({
    setId,
  });

  // Набор удалили или в нём не хватает слов (вопросов нет)
  if (!practiceSet || !currentQuestion) {
    return (
      <Screen>
        <View className="flex-row items-center">
          <BackButton href="/games/flashcards/sets" />
        </View>
        <Text className="mt-6 font-nunito text-body text-text">
          {practiceSet
            ? `Для тренировки в наборе нужно хотя бы ${MIN_SET_WORDS} слова.`
            : "Набор не найден."}
        </Text>
      </Screen>
    );
  }

  return (
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
  );
}
