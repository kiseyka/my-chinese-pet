// app/(tabs)/games/flashcards/sets.tsx
//
// Главный экран карточек. Две вкладки одного экрана:
//   - «Ступени» — поиск, разделы HSK чипсами и ступени по 10 слов (StepsTab);
//   - «Мои наборы» — наборы, которые пользователь собирает сам.
// У карточки набора две кнопки: «Открыть» (страница набора) и «Тренировать».

import BookIcon from "@/assets/images/icons/vocabulary.svg";
import { CustomSetCard } from "@/components/flashcards/CustomSetCard";
import { SetTitleModal } from "@/components/flashcards/SetTitleModal";
import { StepsTab } from "@/components/flashcards/StepsTab";
import { Screen } from "@/components/layout/Screen";
import { BackButton } from "@/components/ui/BackButton";
import { SegmentedTabs } from "@/components/ui/SegmentedTabs";
import { Title } from "@/components/ui/Title";
import { findWords } from "@/content/words/vocabulary";
import { useCustomSetsStore } from "@/store/customSetsStore";
import { colors } from "@/theme/colors";
import { stepTrainingId, type ReadingLevel } from "@/utils/flashcards/steps";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

type FlashcardsTab = "steps" | "sets";

const TABS = [
  { key: "steps" as const, label: "Ступени" },
  { key: "sets" as const, label: "Мои наборы" },
];

export default function FlashcardsHomeScreen() {
  const router = useRouter();

  const [tab, setTab] = useState<FlashcardsTab>("steps");
  const [isCreating, setIsCreating] = useState(false);

  const sets = useCustomSetsStore((state) => state.sets);
  const createSet = useCustomSetsStore((state) => state.createSet);

  const startStep = useCallback(
    (level: ReadingLevel, index: number) =>
      router.push({
        pathname: "/games/flashcards/[setId]",
        params: { setId: stepTrainingId(level, index) },
      }),
    [router],
  );

  const openEditor = (setId: string) => {
    router.push({
      pathname: "/games/flashcards/edit/[setId]",
      params: { setId },
    });
  };

  return (
    <Screen>
      <View className="flex-row items-center justify-between">
        <BackButton href="/games" />

        <Title>Карточки</Title>

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

      <SegmentedTabs
        tabs={TABS}
        value={tab}
        onChange={setTab}
        className="mt-4"
      />

      <SetTitleModal
        visible={isCreating}
        heading="Новый набор"
        confirmLabel="Создать"
        onClose={() => setIsCreating(false)}
        onConfirm={(title) => {
          const setId = createSet(title);
          setIsCreating(false);
          // Сразу в редактор: пустой набор без слов бесполезен
          openEditor(setId);
        }}
      />

      {/* Обе вкладки остаются смонтированными, неактивная прячется:
          переключение мгновенное, прокрутка и раскрытые ступени сохраняются */}
      <View
        className="flex-1"
        style={{ display: tab === "steps" ? "flex" : "none" }}
      >
        <StepsTab onStartStep={startStep} />
      </View>

      {tab === "sets" && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 16, gap: 12 }}
        >
          {sets.length === 0 && (
            <View className="gap-2 rounded-2xl bg-surface p-5">
              <Text className="font-nunitoBold text-lead text-text">
                Здесь будут твои наборы
              </Text>
              <Text className="font-nunito text-body text-text">
                Собери слова, которые хочешь потренировать: из урока, сериала
                или просто те, что не запоминаются. Слова можно добавлять и
                убирать в любой момент.
              </Text>
            </View>
          )}

          {sets.map((set) => (
            <CustomSetCard
              key={set.id}
              title={set.title}
              words={findWords(set.wordIds)}
              onOpen={() => openEditor(set.id)}
              onStart={() =>
                router.push({
                  pathname: "/games/flashcards/[setId]",
                  params: { setId: set.id },
                })
              }
            />
          ))}

          <Pressable
            onPress={() => setIsCreating(true)}
            className="min-h-14 items-center justify-center rounded-2xl border border-dashed border-primary px-5 py-4 active:opacity-70"
            accessibilityRole="button"
          >
            <Text className="font-nunitoBold text-body text-primary">
              + Создать набор
            </Text>
          </Pressable>
        </ScrollView>
      )}
    </Screen>
  );
}
