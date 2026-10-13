// app/(tabs)/games/flashcards/edit/[setId].tsx
//
// Редактирование своего набора:
//   - поиск по всей базе слов (иероглиф, пиньинь без тонов, перевод);
//     в результатах слово добавляется или убирается одним нажатием;
//   - без поиска — список слов набора с точками чтения, «✕» убирает слово;
//   - «Переименовать» и «Удалить набор»;
//   - внизу «Начать», когда в наборе хватает слов.

import { SetTitleModal } from "@/components/flashcards/SetTitleModal";
import { SetWordRow } from "@/components/flashcards/SetWordRow";
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

  // Экран может оставаться смонтированным: при каждом заходе поиск пустой
  useFocusEffect(
    useCallback(() => {
      setQuery("");
    }, []),
  );

  const words = useMemo(() => (set ? findWords(set.wordIds) : []), [set]);
  const inSet = useMemo(() => new Set(set?.wordIds ?? []), [set]);

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

      <ConfirmModal
        isVisible={isDeleting}
        onClose={() => setIsDeleting(false)}
        onConfirm={() => {
          setIsDeleting(false);
          goHome();
          deleteSet(set.id);
        }}
        titleKey="Удалить набор?"
        messageKey="Слова останутся в словаре, и их прогресс сохранится."
        cancelTextKey="Отмена"
        confirmTextKey="Удалить"
      />

      {/* Шапка: назад и название */}
      <View className="flex-row items-center gap-3">
        <BackButton href="/games/flashcards/sets" />
        <Pressable
          onPress={() => setIsRenaming(true)}
          className="flex-1 active:opacity-60"
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
      </View>

      {/* Сколько слов и действия с набором */}
      <View className="mt-1 flex-row items-center justify-between">
        <Text className="font-nunito text-small text-textSecondary">
          {total} {pluralWords(total)}
        </Text>
        <View className="flex-row gap-4">
          <Pressable onPress={() => setIsRenaming(true)} hitSlop={8}>
            <Text className="font-nunito text-small text-primary">
              Переименовать
            </Text>
          </Pressable>
          <Pressable onPress={() => setIsDeleting(true)} hitSlop={8}>
            <Text className="font-nunito text-small text-error">Удалить</Text>
          </Pressable>
        </View>
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
                onPress={() => toggleWord(set.id, word.id)}
              />
            ))
          ) : (
            <Text className="font-nunito text-body text-text">
              Ничего не нашлось. Пиньинь можно писать без тонов: «nihao».
            </Text>
          )
        ) : total === 0 ? (
          <Text className="font-nunito text-body text-text">
            В наборе пока нет слов. Найди слово через поиск и нажми «+».
          </Text>
        ) : (
          words.map((word) => (
            <SetWordRow
              key={word.id}
              word={word}
              action="remove"
              level={levelOf(word.id)}
              onPress={() => removeWord(set.id, word.id)}
            />
          ))
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
