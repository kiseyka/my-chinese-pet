// src/components/dictionary/ReviewSheet.tsx
//
// Панель «Повторение» в «Словаре»: одно «Повторение» на все навыки.
// Сетка слов с точками перевода и письма и «Тренировать» — выбор режима
// (перевод, самопроверка, письмо). Тап по слову закрывает панель и открывает
// панель слова — там слово можно убрать из повторения.

import {
  BottomSheet,
  SHEET_HORIZONTAL_INSET,
} from "@/components/ui/BottomSheet";
import { PathWordGrid } from "@/components/path/PathWordGrid";
import type { Word } from "@/content/flashcards/types";
import type { TrackId } from "@/utils/path/stages";
import { pluralWords } from "@/utils/writing/labels";
import { Pressable, Text, View } from "react-native";

interface ReviewSheetProps {
  open: boolean;
  words: Word[];
  getDots: (word: Word, track: TrackId) => number | undefined;
  onSelectWord: (word: Word) => void;
  onTrain: () => void;
  onClose: () => void;
}

export function ReviewSheet({
  open,
  words,
  getDots,
  onSelectWord,
  onTrain,
  onClose,
}: ReviewSheetProps) {
  return (
    <BottomSheet item={open ? words : null} onClose={onClose}>
      {(shown) => (
        <>
          <Text className="text-center font-nunitoBold text-lead text-text">
            Повторение
          </Text>
          <Text className="mt-1 text-center font-nunito text-small text-textSecondary">
            {shown.length} {pluralWords(shown.length)}. Слово можно убрать в его
            панели.
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

          <View className="mt-4">
            <PathWordGrid
              words={shown}
              getDots={getDots}
              onSelect={onSelectWord}
              horizontalInset={SHEET_HORIZONTAL_INSET}
            />
          </View>
        </>
      )}
    </BottomSheet>
  );
}
