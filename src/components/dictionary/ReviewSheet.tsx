// src/components/dictionary/ReviewSheet.tsx
//
// Панель «Повторение» в «Словаре»: одно «Повторение» на все навыки.
// «Тренировать» — выбор режима (перевод, самопроверка, письмо), ниже слова списком:
// иероглиф, пиньинь и перевод, справа «✕» — убрать из повторения прямо здесь.
// Тап по строке закрывает панель и открывает панель слова.
// Когда убрано последнее слово, панель закрывается сама.

import { SetWordRow } from "@/components/flashcards/SetWordRow";
import { BottomSheet } from "@/components/ui/BottomSheet";
import type { Word } from "@/content/flashcards/types";
import { useWordProgressStore } from "@/store/wordProgressStore";
import { pluralWords } from "@/utils/writing/labels";
import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";

interface ReviewSheetProps {
  open: boolean;
  words: Word[];
  onSelectWord: (word: Word) => void;
  onTrain: () => void;
  onClose: () => void;
}

export function ReviewSheet({
  open,
  words,
  onSelectWord,
  onTrain,
  onClose,
}: ReviewSheetProps) {
  const removeFromReview = useWordProgressStore((s) => s.removeFromReview);

  // Убрали всё — закрываем
  useEffect(() => {
    if (open && words.length === 0) onClose();
  }, [open, words.length, onClose]);

  return (
    <BottomSheet item={open ? words : null} onClose={onClose}>
      {(shown) => (
        <>
          <Text className="text-center font-nunitoBold text-lead text-text">
            Повторение
          </Text>
          <Text className="mt-1 text-center font-nunito text-small text-textSecondary">
            {shown.length} {pluralWords(shown.length)} · «✕» — убрать из
            повторения
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
            {shown.map((word) => (
              <SetWordRow
                key={word.vocabularyId}
                word={word}
                action="remove"
                onPress={removeFromReview}
                onOpenWord={onSelectWord}
              />
            ))}
          </View>
        </>
      )}
    </BottomSheet>
  );
}
