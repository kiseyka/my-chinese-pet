// src/components/dictionary/WordListSheet.tsx
//
// Панель «Повторения» или «Изученного» в «Словаре».
// «Тренировать» — выбор режима (перевод, самопроверка, письмо), ниже слова списком.
//   «Повторение»: справа «✕» — убрать из повторения. Слово со всеми точками
//   (6, у слова без письма — 3) после этого становится изученным, остальные
//   просто учатся дальше.
//   «Изученное»: справа закладка — вернуть слово в повторение. Когда его оттуда
//   уберут, оно снова будет в «Изученном».
// Слово уходит из списка сразу. Тап по строке закрывает панель и открывает панель
// слова. Когда слов не осталось, панель закрывается сама.

import ReviewIcon from "@/assets/images/icons/bookmark.svg";
import { SetWordRow } from "@/components/flashcards/SetWordRow";
import { BottomSheet } from "@/components/ui/BottomSheet";
import type { Word } from "@/content/flashcards/types";
import { useWordProgressStore } from "@/store/wordProgressStore";
import { colors } from "@/theme/colors";
import { pluralWords } from "@/utils/writing/labels";
import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";

type ListId = "review" | "learned";

interface WordListSheetProps {
  /** Какой список открыт; null — панель закрыта. */
  list: ListId | null;
  words: Word[];
  onSelectWord: (word: Word) => void;
  onTrain: () => void;
  onClose: () => void;
}

const TITLES: Record<ListId, string> = {
  review: "Повторение",
  learned: "Изученное",
};

const HINTS: Record<ListId, string> = {
  review: "«✕» — убрать из повторения",
  learned: "Закладка — вернуть в повторение",
};

export function WordListSheet({
  list,
  words,
  onSelectWord,
  onTrain,
  onClose,
}: WordListSheetProps) {
  const removeFromReview = useWordProgressStore((s) => s.removeFromReview);
  const addToReview = useWordProgressStore((s) => s.addToReview);

  // Убрали всё — закрываем
  useEffect(() => {
    if (list && words.length === 0) onClose();
  }, [list, words.length, onClose]);

  return (
    // item — название списка, а не сами слова: новый массив после «✕»
    // панель приняла бы за повторное открытие. Слова берём из пропсов.
    <BottomSheet item={list} onClose={onClose}>
      {(shown) => (
        <>
          <Text className="text-center font-nunitoBold text-lead text-text">
            {TITLES[shown]}
          </Text>
          <Text className="mt-1 text-center font-nunito text-small text-textSecondary">
            {words.length} {pluralWords(words.length)} · {HINTS[shown]}
          </Text>

          <Pressable
            onPress={onTrain}
            className="mt-4 items-center rounded-2xl bg-primary py-3.5 active:opacity-80"
            accessibilityRole="button"
          >
            <Text className="font-nunitoBold text-body text-white">
              Тренировать
            </Text>
          </Pressable>

          <View className="mt-4 gap-2">
            {words.map((word) =>
              shown === "review" ? (
                <SetWordRow
                  key={word.vocabularyId}
                  word={word}
                  action="remove"
                  onPress={removeFromReview}
                  onOpenWord={onSelectWord}
                />
              ) : (
                <SetWordRow
                  key={word.vocabularyId}
                  word={word}
                  action="open"
                  onPress={() => {}}
                  onOpenWord={onSelectWord}
                  trailing={
                    <Pressable
                      onPress={() => addToReview([word.vocabularyId])}
                      hitSlop={4}
                      className="h-11 w-11 items-center justify-center rounded-full active:bg-text/10"
                      accessibilityRole="button"
                      accessibilityLabel={`${word.hanzi}: вернуть в повторение`}
                    >
                      <ReviewIcon
                        width={22}
                        height={22}
                        color={colors.textSecondary}
                      />
                    </Pressable>
                  }
                />
              ),
            )}
          </View>
        </>
      )}
    </BottomSheet>
  );
}
