import { GameHeader } from "@/components/game/GameHeader";
import { ToneQuestion } from "@/components/game/ToneQuestion";
import { Screen } from "@/components/layout/Screen";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useToneGame } from "@/hooks/useToneGame";
import { useSettingsStore } from "@/store/settingsStore";
import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

export default function ToneGameScreen() {
  const [isExitModalVisible, setIsExitModalVisible] = useState(false);
  const router = useRouter();

  const showPinyin = useSettingsStore((s) => s.showPinyin);
  const hanziEnabled = useSettingsStore((s) => s.hanziEnabled);

  const {
    currentQuestion,
    selectedTone,
    isAnswered,
    progressPercent,
    handleSelectTone,
    handlePlayAudio,
    handlePlaySlowAudio,
  } = useToneGame();

  if (!currentQuestion) return null;

  return (
    <Screen>
      <View className="flex-col gap-4 px-4 pt-2">
        <ConfirmModal
          isVisible={isExitModalVisible}
          onClose={() => setIsExitModalVisible(false)}
          onConfirm={() => {
            setIsExitModalVisible(false);
            router.replace("/games");
          }}
        />
        <GameHeader
          progress={progressPercent}
          onExit={() => setIsExitModalVisible(true)}
          showPinyin={false}
          showSound={false}
          showHanzi
        />

        <ToneQuestion
          hanzi={currentQuestion.hanzi}
          blankedPinyin={currentQuestion.blankedPinyin}
          fullPinyin={currentQuestion.pinyin}
          correctTone={currentQuestion.correctTone}
          selectedTone={selectedTone}
          isAnswered={isAnswered}
          showHanzi={hanziEnabled}
          showPinyin={showPinyin}
          onSelectTone={handleSelectTone}
          onPlayAudio={handlePlayAudio}
          onPlaySlowAudio={handlePlaySlowAudio}
        />
      </View>
    </Screen>
  );
}
