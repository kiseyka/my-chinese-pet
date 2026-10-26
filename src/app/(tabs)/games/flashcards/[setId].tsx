// app/(tabs)/games/flashcards/[setId].tsx
//
// Тренировка карточками: свой набор, ступень HSK или «Повторение».
// Слово, которое человек видит впервые (ни одного ответа по переводу), сначала
// показывается карточкой знакомства (WordIntroCard), потом сразу вопрос.
// Режим (mode) выбирают в панели «Как будем тренироваться?»:
//   по умолчанию — выбор перевода (даёт точки чтения): вопрос прямой
//     (иероглиф → перевод) или обратный (перевод → иероглиф из похожих,
//     ReverseQuestion; только у слов, где уже есть точка перевода);
//   mode=self — самопроверка «Знаю / Сомневаюсь / Не знаю» (без точек).

import { FlashcardQuestion } from "@/components/game/FlashcardQuestion";
import { GameHeader } from "@/components/game/GameHeader";
import { ReverseQuestion } from "@/components/game/ReverseQuestion";
import { WordIntroCard } from "@/components/game/WordIntroCard";
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
import { useMemo, useState, type ReactNode } from "react";
import { Text, View } from "react-native";

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
    handleSelect,
  } = useFlashcardGame({ setId });

  // Новое слово — ни одного ответа по переводу на момент показа вопроса.
  // Считаем один раз на вопрос: после ответа слово уже не новое, а карточка не нужна
  const [introduced, setIntroduced] = useState<Set<string>>(() => new Set());
  const questionId = currentQuestion?.id;
  const isNew = useMemo(() => {
    if (!currentQuestion) return false;
    const reading =
      useWordProgressStore.getState().flashcardWords[
        currentQuestion.vocabularyId
      ]?.reading;
    return !reading || reading.correctAnswers + reading.incorrectAnswers === 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionId]);

  if (!source || !currentQuestion) return <NoWords source={source} />;

  if (isNew && !introduced.has(currentQuestion.id)) {
    return (
      <TrainingFrame progress={progressPercent}>
        <WordIntroCard
          hanzi={currentQuestion.hanzi}
          pinyin={currentQuestion.pinyin}
          translation={currentQuestion.translation}
          onContinue={() =>
            setIntroduced((previous) =>
              new Set(previous).add(currentQuestion.id),
            )
          }
        />
      </TrainingFrame>
    );
  }

  if (currentQuestion.direction === "reverse" && currentQuestion.optionWords) {
    return (
      <TrainingFrame progress={progressPercent}>
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
    <TrainingFrame progress={progressPercent}>
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

/** Экран тренировки: шкала прогресса, выход с подтверждением. */
function TrainingFrame({
  progress,
  children,
}: {
  progress: number;
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
        onExit={() => setIsExitModalVisible(true)}
      />

      {children}
    </Screen>
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
