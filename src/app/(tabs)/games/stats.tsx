// app/(tabs)/games/stats.tsx
//
// Экран итогов любой тренировки.
//   - Заголовок и сводка: точность (круг), XP, монеты, время — в стиле новых экранов
//     (шкала размеров из tailwind.config.js: title / lead / body).
//   - Слова: у карточек — «Ошибки» и «Верно», у письма — «С подсказками» и
//     «Без подсказок» (с твоим написанием); у обоих — «Повторение» своего навыка
//     и панель слова (наборы). У тонов — ошибки.
//   - Внизу две кнопки: «Завершить» (к панде) и «Продолжить» — обратно на экран,
//     откуда запускали тренировку (ступени, наборы, «Написание», путь).

import { FlashcardResultsList } from "@/components/flashcards/FlashcardResultsList";
import { WordSheet } from "@/components/flashcards/WordSheet";
import { Screen } from "@/components/layout/Screen";
import { BrushProgressCircle } from "@/components/ui/BrushProgressCircle";
import { WordCard } from "@/components/ui/WordCard";
import { WritingResultsList } from "@/components/writing/results/WritingResultsList";
import type { Word } from "@/content/flashcards/types";
import { useGameStore } from "@/store/gameStore";
import { useWordProgressStore } from "@/store/wordProgressStore";
import { colors } from "@/theme/colors";
import { describeStep, findWordStep } from "@/utils/flashcards/steps";
import type { GameId } from "@/utils/finishTraining";
import { formatDuration } from "@/utils/formatDuration";
import { SELF_CHECK_MODE } from "@/hooks/useSelfCheckGame";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useState, type ReactNode } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";

/** Куда ведёт «Продолжить»: экран выбора, с которого запускали тренировку. */
const RETURN_TO: Record<GameId, Href> = {
  flashcards: "/vocabulary",
  writing: "/vocabulary",
  tones: "/games",
};

export default function GeneralStatsScreen() {
  const router = useRouter();

  const vocabularyWords = useWordProgressStore((s) => s.vocabularyWords);
  const toggleFavorite = useWordProgressStore((s) => s.toggleFavorite);

  const { gameId, mode } = useLocalSearchParams<{
    gameId?: GameId;
    mode?: string;
  }>();
  // Самопроверка карточек: без точек и наград, слова по ответам «знаю / сомневаюсь / не знаю»
  const isSelfCheck = gameId === "flashcards" && mode === SELF_CHECK_MODE;

  // После письма показываем все написанные слова, а не только ошибки
  const writingResults = useGameStore((s) => s.writingResults);
  const isWriting = gameId === "writing" && writingResults.length > 0;
  const isFlashcards = gameId === "flashcards";

  const score = useGameStore((s) => s.score);
  const duration = useGameStore((s) => s.duration);
  const results = useGameStore((s) => s.results);
  // Награду считает сама тренировка (у тонов свои формулы), здесь только показываем
  const rewards = useGameStore((s) => s.rewards);

  const totalCount = results.length;
  const wrongAnswers = results.filter((r) => !r.isCorrect);
  const accuracy =
    totalCount === 0 ? 0 : Math.round((score / totalCount) * 100);

  // Панель слова (карточки): перевод, озвучка, повторение, наборы
  const [opened, setOpened] = useState<Word | null>(null);
  const openedStep = opened ? findWordStep(opened.vocabularyId) : null;

  // Запуск с пути — обратно на путь, иначе на экран своего режима
  const customReturnTo = useGameStore((s) => s.returnTo);
  const returnTo = customReturnTo ?? (gameId ? RETURN_TO[gameId] : "/games");

  return (
    <Screen>
      <WordSheet
        word={opened}
        skill={isWriting ? "writing" : "reading"}
        location={
          // Ступени письма и карточек не совпадают — место показываем только для карточек
          openedStep && !isWriting
            ? describeStep(openedStep.level, openedStep.index)
            : undefined
        }
        onClose={() => setOpened(null)}
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 24, paddingBottom: 24, gap: 32 }}
      >
        {/* Заголовок и сводка */}
        <View className="gap-5">
          <Text className="text-center font-nunitoBold text-heading text-text">
            {isSelfCheck ? "Самопроверка завершена" : "Тренировка завершена"}
          </Text>

          <View className="flex-row items-center gap-5 rounded-2xl bg-surface p-4">
            <BrushProgressCircle
              percentage={accuracy}
              size={108}
              strokeWidth={10}
              progressColor={colors.primary}
              backgroundColor={colors.progress.inactive}
              label={isSelfCheck ? "Знаю" : "Точность"}
            />

            <View className="flex-1">
              {isSelfCheck ? (
                <>
                  <StatRow label="Слов" value={`${totalCount}`} />
                  <StatRow label="Знаю" value={`${score}`} />
                </>
              ) : (
                <>
                  <StatRow label="Опыт" value={`+${rewards.xp} XP`} />
                  <StatRow
                    label="Монеты"
                    value={`+${rewards.coins}`}
                    icon={
                      <Image
                        className="h-5 w-5"
                        source={require("@/assets/images/paw-coin.png")}
                        resizeMode="contain"
                      />
                    }
                  />
                </>
              )}
              <StatRow label="Время" value={formatDuration(duration)} last />
            </View>
          </View>
        </View>

        {/* Слова */}
        {isWriting ? (
          <WritingResultsList results={writingResults} onOpenWord={setOpened} />
        ) : isFlashcards ? (
          <FlashcardResultsList
            results={results}
            selfCheck={isSelfCheck}
            onOpenWord={setOpened}
          />
        ) : wrongAnswers.length > 0 ? (
          <View className="gap-3">
            <Text className="font-nunitoBold text-title text-text">
              Ошибки · {wrongAnswers.length}
            </Text>
            {wrongAnswers.map((item) => (
              <WordCard
                key={item.vocabularyId}
                hanzi={item.hanzi}
                pinyin={item.pinyin}
                translation={item.translation}
                isFavorite={
                  vocabularyWords[item.vocabularyId]?.isFavorite ?? false
                }
                onToggleFavorite={() => toggleFavorite(item.vocabularyId)}
              />
            ))}
          </View>
        ) : (
          <View className="items-center gap-1 rounded-2xl bg-surface px-5 py-5">
            <Text className="font-nunitoBold text-title text-primary">
              Без ошибок!
            </Text>
            <Text className="text-center font-nunito text-body text-text">
              Все ответы были верны. Отличная работа.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Внизу: к панде или обратно к выбору тренировки */}
      <View className="flex-row gap-3 pb-2 pt-3">
        <Pressable
          onPress={() => router.replace("/pet")}
          className="min-h-14 flex-1 items-center justify-center rounded-2xl border border-primary px-4 active:bg-primary/10"
          accessibilityRole="button"
        >
          <Text className="font-nunitoBold text-body text-primary">
            Завершить
          </Text>
        </Pressable>
        <Pressable
          onPress={() => router.replace(returnTo)}
          className="min-h-14 flex-1 items-center justify-center rounded-2xl bg-primary px-4 active:opacity-80"
          accessibilityRole="button"
        >
          <Text className="font-nunitoBold text-body text-white">
            Продолжить
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}

function StatRow({
  label,
  value,
  icon,
  last = false,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
  last?: boolean;
}) {
  return (
    <View
      className={`flex-row items-center justify-between py-2.5 ${
        last ? "" : "border-b border-progress-inactive"
      }`}
    >
      <Text
        numberOfLines={1}
        className="flex-1 pr-2 font-nunito text-body text-text"
      >
        {label}
      </Text>

      <View className="flex-row items-center gap-1">
        <Text className="font-nunitoBold text-lead text-text">{value}</Text>
        {icon}
      </View>
    </View>
  );
}
