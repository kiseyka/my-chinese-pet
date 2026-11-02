// app/(tabs)/games/flashcards/[setId].tsx
//
// Тренировка карточками: свой набор, ступень HSK или «Повторение».
// Режим (mode) выбирают в панели «Как будем тренироваться?»:
//   по умолчанию — выбор перевода (даёт точки чтения): вопрос прямой
//     (иероглиф → перевод) или обратный (перевод → иероглиф из похожих,
//     ReverseQuestion; только у слов, где уже есть точка перевода);
//     следующий вопрос — по кнопке «Продолжить» внизу (до ответа неактивна);
//     в обратном вопросе глаза пиньиня в шапке нет (пиньинь там до ответа скрыт);
//   mode=self — самопроверка «Знаю / Сомневаюсь / Не знаю» (без точек).

import { FlashcardQuestion } from "@/components/game/FlashcardQuestion";
import { GameHeader } from "@/components/game/GameHeader";
import { ReverseQuestion } from "@/components/game/ReverseQuestion";
import { SelfCheckQuestion } from "@/components/game/SelfCheckQuestion";
import { Screen } from "@/components/layout/Screen";
import { BackButton } from "@/components/ui/BackButton";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useFlashcardGame } from "@/hooks/useFlashcardGame";
import { SELF_CHECK_MODE, useSelfCheckGame } from "@/hooks/useSelfCheckGame";
import { MIN_SET_WORDS } from "@/store/customSetsStore";
import { useGameStore } from "@/store/gameStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useWordProgressStore } from "@/store/wordProgressStore";
import type { FlashcardSource } from "@/utils/flashcards/source";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

export default function FlashcardTrainingScreen() {
  const { setId, mode } = useLocalSearchParams<{
    setId: string;
    mode?: string;
  }>();

  return mode === SELF_CHECK_MODE ? (
    <SelfCheckTraining setId={setId} />
  ) : (
    <ChoiceTraining setId={setId} />
  );
}

// ── Выбор перевода ───────────────────────────────────────────────────────────

function ChoiceTraining({ setId }: { setId: string }) {
  const showPinyin = useSettingsStore((s) => s.showPinyin);

  const {
    source,
    currentQuestion,
    selected,
    isAnswered,
    progressPercent,
    isLast,
    handleSelect,
    next,
  } = useFlashcardGame({ setId });


  if (!source || !currentQuestion) return <NoWords source={source} />;


  // Кнопка видна всегда, до ответа неактивна: после ответа экран не прыгает
  const continueButton = (
    <ContinueButton enabled={isAnswered} isLast={isLast} onPress={next} />
  );

  if (currentQuestion.direction === "reverse" && currentQuestion.optionWords) {
    return (
      <TrainingFrame
        progress={progressPercent}
        showPinyinToggle={false}
        footer={continueButton}
      >
        <ReverseQuestion
          key={currentQuestion.id}
          translation={currentQuestion.translation}
          options={currentQuestion.optionWords}
          correctId={currentQuestion.correctAnswer}
          selected={selected}
          isAnswered={isAnswered}
          onSelect={handleSelect}
        />
      </TrainingFrame>
    );
  }

  return (
    <TrainingFrame progress={progressPercent} footer={continueButton}>
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
    </TrainingFrame>
  );
}

// ── Самопроверка ─────────────────────────────────────────────────────────────

function SelfCheckTraining({ setId }: { setId: string }) {
  const showPinyin = useSettingsStore((s) => s.showPinyin);
  const review = useWordProgressStore((s) => s.review);
  const toggleReview = useWordProgressStore(
    (s) => s.toggleReview,
  );

  const {
    source,
    currentWord,
    answer,
    isLast,
    progressPercent,
    choose,
    next,
  } = useSelfCheckGame({ setId });

  if (!source || !currentWord) return <NoWords source={source} />;

  return (
    <TrainingFrame progress={progressPercent}>
      <SelfCheckQuestion
        key={currentWord.vocabularyId}
        hanzi={currentWord.hanzi}
        pinyin={currentWord.pinyin}
        translation={currentWord.translation}
        showPinyin={showPinyin}
        answer={answer}
        isLast={isLast}
        inReview={!!review[currentWord.vocabularyId]}
        onToggleReview={() => toggleReview(currentWord.vocabularyId)}
        onAnswer={choose}
        onNext={next}
      />
    </TrainingFrame>
  );
}

// ── Общее ────────────────────────────────────────────────────────────────────

/**
 * Экран тренировки: шкала прогресса, выход с подтверждением.
 * footer — прижат к низу экрана (кнопка «Продолжить»).
 */
function TrainingFrame({
  progress,
  showPinyinToggle = true,
  footer,
  children,
}: {
  progress: number;
  showPinyinToggle?: boolean;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const router = useRouter();
  const [isExitModalVisible, setIsExitModalVisible] = useState(false);
  // Выход — туда, откуда запустили: на путь (returnTo) или в «Словарь»
  const exitTo = useGameStore((state) => state.returnTo) ?? "/vocabulary";

  return (
    <Screen>
      <ConfirmModal
        isVisible={isExitModalVisible}
        onClose={() => setIsExitModalVisible(false)}
        onConfirm={() => {
          setIsExitModalVisible(false);
          router.replace(exitTo);
        }}
      />

      <GameHeader
        progress={progress}
        showPinyin={showPinyinToggle}
        onExit={() => setIsExitModalVisible(true)}
      />

      <View className="flex-1">{children}</View>
      {footer}
    </Screen>
  );
}

/** «Продолжить»: видна всегда, до ответа неактивна (приглушена и не нажимается). */
function ContinueButton({
  enabled,
  isLast,
  onPress,
}: {
  enabled: boolean;
  isLast: boolean;
  onPress: () => void;
}) {
  return (
    <View className="pb-2 pt-3">
      <Pressable
        onPress={onPress}
        disabled={!enabled}
        className={`min-h-14 items-center justify-center rounded-2xl px-5 ${
          enabled ? "bg-primary active:opacity-80" : "bg-primary/30"
        }`}
        accessibilityRole="button"
        accessibilityState={{ disabled: !enabled }}
      >
        <Text className="font-nunitoBold text-body text-white">
          {isLast ? "Завершить" : "Продолжить"}
        </Text>
      </Pressable>
    </View>
  );
}

/** Набор удалили или в нём не хватает слов (вопросов нет). */
function NoWords({ source }: { source: FlashcardSource | null }) {
  const exitTo = useGameStore((state) => state.returnTo) ?? "/vocabulary";

  return (
    <Screen>
      <View className="flex-row items-center">
        <BackButton href={exitTo} />
      </View>
      <Text className="mt-6 font-nunito text-body text-text">
        {source
          ? `Для тренировки в наборе нужно хотя бы ${MIN_SET_WORDS} слова.`
          : "Набор не найден."}
      </Text>
    </Screen>
  );
}
