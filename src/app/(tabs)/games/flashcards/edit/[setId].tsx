// app/(tabs)/games/flashcards/edit/[setId].tsx
//
// Редактирование своего набора:
//   - поиск по всей базе слов (иероглиф, пиньинь без тонов, перевод);
//     в результатах слово добавляется или убирается одним нажатием;
//   - без поиска — «Добавить из ступеней HSK» (StepPickerSheet) и список слов набора
//     с точками чтения, «✕» убирает слово;
//   - в шапке: тап по названию или карандаш — переименовать, корзина — удалить;
//   - внизу «Начать», когда в наборе хватает слов.

import { SetTitleModal } from "@/components/flashcards/SetTitleModal";
import { SetWordRow } from "@/components/flashcards/SetWordRow";
import { StepPickerSheet } from "@/components/flashcards/StepPickerSheet";
import PlusIcon from "@/assets/images/icons/circle-plus.svg";
import PencilIcon from "@/assets/images/icons/pencil.svg";
import TrashIcon from "@/assets/images/icons/trash.svg";
import { Screen } from "@/components/layout/Screen";
import { BackButton } from "@/components/ui/BackButton";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { SearchField } from "@/components/ui/SearchField";
import { allWords, findWords } from "@/content/words/vocabulary";
import {
  MIN_SET_WORDS,
  useCustomSet,
  useCustomSetsStore,
} from "@/store/customSetsStore";
import { getWordLevel, useWordProgressStore } from "@/store/wordProgressStore";
import { colors } from "@/theme/colors";
import { searchWords } from "@/utils/searchWords";
import { pluralWords } from "@/utils/writing/labels";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function EditSetScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { setId } = useLocalSearchParams<{ setId: string }>();

  const set = useCustomSet(setId);
  const toggleWord = useCustomSetsStore((state) => state.toggleWord);
  const removeWord = useCustomSetsStore((state) => state.removeWord);
  const renameSet = useCustomSetsStore((state) => state.renameSet);
  const deleteSet = useCustomSetsStore((state) => state.deleteSet);

  const flashcardWords = useWordProgressStore((state) => state.flashcardWords);
  const vocabularyWords = useWordProgressStore(
    (state) => state.vocabularyWords,
  );

  const [query, setQuery] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPicking, setIsPicking] = useState(false);

  // Экран может оставаться смонтированным: при каждом заходе поиск пустой
  useFocusEffect(
    useCallback(() => {
      setQuery("");
    }, []),
  );

  const words = useMemo(() => (set ? findWords(set.wordIds) : []), [set]);
  const inSet = useMemo(() => new Set(set?.wordIds ?? []), [set]);

  // Один колбэк на весь список (строки в memo не перерисовываются зря)
  const toggleInSet = useCallback(
    (wordId: string) => {
      if (setId) toggleWord(setId, wordId);
    },
    [setId, toggleWord],
  );
  const removeFromSet = useCallback(
    (wordId: string) => {
      if (setId) removeWord(setId, wordId);
    },
    [setId, removeWord],
  );

  const isSearching = query.trim().length > 0;
  const results = useMemo(
    () => (isSearching ? searchWords(allWords, query, (key) => t(key)) : []),
    [isSearching, query, t],
  );

  const goHome = () => router.replace("/games/flashcards/sets");

  if (!set) {
    // Набор удалён (или ссылка устарела)
    return (
      <Screen>
        <View className="flex-row items-center">
          <BackButton href="/games/flashcards/sets" />
        </View>
        <Text className="mt-6 font-nunito text-body text-text">
          Набор не найден.
        </Text>
      </Screen>
    );
  }

  const total = words.length;
  const missing = Math.max(MIN_SET_WORDS - total, 0);

  const levelOf = (wordId: string) =>
    getWordLevel(
      flashcardWords[wordId],
      vocabularyWords[wordId]?.isKnown ?? false,
      ["reading"],
    );

  return (
    <Screen>
      <SetTitleModal
        visible={isRenaming}
        heading="Название набора"
        initialTitle={set.title}
        confirmLabel="Сохранить"
        onClose={() => setIsRenaming(false)}
        onConfirm={(title) => {
          renameSet(set.id, title);
          setIsRenaming(false);
        }}
      />

      <StepPickerSheet
        setId={isPicking ? set.id : null}
        onClose={() => setIsPicking(false)}
      />

      <ConfirmModal
        isVisible={isDeleting}
        onClose={() => setIsDeleting(false)}
        onConfirm={() => {
          setIsDeleting(false);
          goHome();
          deleteSet(set.id);
        }}
        title="Удалить набор?"
        message="Слова останутся в словаре, и их прогресс сохранится."
        cancelLabel="Отмена"
        confirmLabel="Удалить"
        isDestructive
      />

      {/* Шапка: назад, название (тап — переименовать), карандаш и корзина */}
      <View className="flex-row items-center gap-2">
        <BackButton href="/games/flashcards/sets" />
        <Pressable
          onPress={() => setIsRenaming(true)}
          className="ml-1 flex-1 active:opacity-60"
          accessibilityRole="button"
          accessibilityHint="Переименовать набор"
        >
          <Text
            numberOfLines={1}
            className="font-nunitoBold text-title text-text"
          >
            {set.title}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setIsRenaming(true)}
          hitSlop={6}
          className="h-10 w-10 items-center justify-center rounded-full active:bg-text/10"
          accessibilityRole="button"
          accessibilityLabel="Переименовать набор"
        >
          <PencilIcon width={22} height={22} color={colors.text} />
        </Pressable>
        <Pressable
          onPress={() => setIsDeleting(true)}
          hitSlop={6}
          className="h-10 w-10 items-center justify-center rounded-full active:bg-error/10"
          accessibilityRole="button"
          accessibilityLabel="Удалить набор"
        >
          <TrashIcon width={22} height={22} color={colors.error} />
        </Pressable>
      </View>

      <SearchField
        value={query}
        onChangeText={setQuery}
        placeholder="Добавить слово: иероглиф, пиньинь, перевод"
        accessibilityLabel="Поиск слова для набора"
        className="my-3"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 16, gap: 8 }}
      >
        {isSearching ? (
          results.length > 0 ? (
            results.map((word) => (
              <SetWordRow
                key={word.id}
                word={word}
                action={inSet.has(word.id) ? "added" : "add"}
                onPress={toggleInSet}
              />
            ))
          ) : (
            <Text className="font-nunito text-body text-text">
              Ничего не нашлось. Пиньинь можно писать без тонов: «nihao».
            </Text>
          )
        ) : (
          <>
            {/* Добавить слова из ступеней HSK */}
            <Pressable
              onPress={() => setIsPicking(true)}
              className="min-h-12 flex-row items-center justify-between gap-3 rounded-2xl border border-dashed border-primary px-4 py-3 active:opacity-70"
              accessibilityRole="button"
            >
              <Text className="flex-1 font-nunitoBold text-body text-primary">
                Добавить из ступеней HSK
              </Text>
              <PlusIcon width={22} height={22} color={colors.primary} />
            </Pressable>

            {total === 0 && (
              <Text className="mt-2 font-nunito text-body text-text">
                В наборе пока нет слов. Найди слово через поиск или выбери из
                ступеней.
              </Text>
            )}

            {/* Подпись над списком: «Слова в наборе · 12» */}
            {total > 0 && (
              <View className="mt-2 flex-row items-baseline justify-between">
                <Text className="font-nunitoBold text-body text-text">
                  Слова в наборе
                </Text>
                <Text className="font-nunito text-body text-textSecondary">
                  {total}
                </Text>
              </View>
            )}

            {words.map((word) => (
              <SetWordRow
                key={word.id}
                word={word}
                action="remove"
                level={levelOf(word.id)}
                onPress={removeFromSet}
              />
            ))}
          </>
        )}
      </ScrollView>

      {/* Низ: старт или сколько слов не хватает. Пока идёт поиск, не мешаем */}
      {!isSearching && (
        <View className="pb-2 pt-3">
          {missing > 0 ? (
            <Text className="text-center font-nunito text-small text-textSecondary">
              Для тренировки нужно ещё {missing} {pluralWords(missing)}
            </Text>
          ) : (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/games/flashcards/[setId]",
                  params: { setId: set.id },
                })
              }
              className="min-h-14 items-center justify-center rounded-2xl bg-primary px-5 py-4 active:opacity-80"
              accessibilityRole="button"
            >
              <Text className="font-nunitoBold text-body text-white">
                Начать тренировку
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </Screen>
  );
}
