// src/components/dictionary/WordListSheet.tsx
//
// Панель «Повторения» или «Изученного» в «Словаре».
// «Тренировать» — выбор режима (перевод, самопроверка, письмо), ниже слова списком:
// иероглиф, пиньинь и перевод, справа — перенос в другой список
// («В изученные» из «Повторения», «В повторение» из «Изученного»).
// Перенесённое слово уходит из списка. Тап по строке закрывает панель и открывает
// панель слова. Когда слов не осталось, панель закрывается сама.

import { SetWordRow } from "@/components/flashcards/SetWordRow";
import { MoveButton } from "@/components/learning/MoveButton";
import { BottomSheet } from "@/components/ui/BottomSheet";
import type { Word } from "@/content/flashcards/types";
import { pluralWords } from "@/utils/writing/labels";
import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";

interface WordListSheetProps {
  /** Какой список открыт; null — панель закрыта. */
  list: "review" | "learned" | null;
  words: Word[];
  onSelectWord: (word: Word) => void;
  onTrain: () => void;
  onClose: () => void;
}

const TITLES = { review: "Повторение", learned: "Изученное" } as const;

export function WordListSheet({
  list,
  words,
  onSelectWord,
  onTrain,
  onClose,
}: WordListSheetProps) {
  // Перенесли всё — закрываем
  useEffect(() => {
    if (list && words.length === 0) onClose();
  }, [list, words.length, onClose]);

  return (
    // item — название списка, а не сами слова: новый массив после переноса
    // панель приняла бы за повторное открытие. Слова берём из пропсов.
    <BottomSheet item={list} onClose={onClose}>
      {(shown) => (
        <>
          <Text className="text-center font-nunitoBold text-lead text-text">
            {TITLES[shown]}
          </Text>
          <Text className="mt-1 text-center font-nunito text-small text-textSecondary">
            {words.length} {pluralWords(words.length)}
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
            {words.map((word) => (
              <SetWordRow
                key={word.vocabularyId}
                word={word}
                action="open"
                onPress={() => {}}
                onOpenWord={onSelectWord}
                trailing={<MoveButton word={word} />}
              />
            ))}
          </View>
        </>
      )}
    </BottomSheet>
  );
}
