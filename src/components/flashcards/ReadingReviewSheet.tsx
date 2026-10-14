// src/components/flashcards/ReadingReviewSheet.tsx
//
// Панель «Повторение» в карточках: сетка слов, подсказка, сколько попадёт
// в тренировку, и «Начать повторение». Вход — та же карточка ReviewCard, что в «Написании».
// Тап по слову в панели закрывает её и открывает панель слова (там можно убрать
// слово из повторения). Слова попадают сюда с экрана итогов тренировки
// и из панели слова.

import ReviewIcon from "@/assets/images/icons/bookmark.svg";
import {
  BottomSheet,
  SHEET_HORIZONTAL_INSET,
} from "@/components/ui/BottomSheet";
import type { Word } from "@/content/flashcards/types";
import { MIN_SET_WORDS } from "@/store/customSetsStore";
import { getWordLevel, useWordProgressStore } from "@/store/wordProgressStore";
import { colors } from "@/theme/colors";
import { pluralWords } from "@/utils/writing/labels";
import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { ReadingGrid } from "./ReadingGrid";

/** Сколько слов берёт одна тренировка карточками. */
const LESSON_SIZE = 10;

// ── Панель ───────────────────────────────────────────────────────────────────

interface ReadingReviewSheetProps {
  open: boolean;
  words: Word[];
  onSelectWord: (word: Word) => void;
  onStart: () => void;
  onClose: () => void;
}

export function ReadingReviewSheet({
  open,
  words,
  onSelectWord,
  onStart,
  onClose,
}: ReadingReviewSheetProps) {
  const flashcardWords = useWordProgressStore((state) => state.flashcardWords);
  const vocabularyWords = useWordProgressStore(
    (state) => state.vocabularyWords,
  );

  const item = useMemo(() => (open ? { words } : null), [open, words]);

  return (
    <BottomSheet item={item} onClose={onClose}>
      {({ words: shown }) => {
        const total = shown.length;
        const missing = Math.max(MIN_SET_WORDS - total, 0);
        const inLesson = Math.min(LESSON_SIZE, total);
        const dots = shown.map((word) =>
          getWordLevel(
            flashcardWords[word.vocabularyId],
            vocabularyWords[word.vocabularyId]?.isKnown ?? false,
            ["reading"],
          ),
        );

        return (
          <>
            <View className="items-center gap-2">
              <View className="h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
                <ReviewIcon width={26} height={26} color={colors.primary} />
              </View>
              <Text className="font-nunitoBold text-title text-text">
                Повторение
              </Text>
              <Text className="text-center font-nunito text-small text-text opacity-70">
                {total === 0
                  ? "Здесь пока пусто. Трудные слова можно добавить на экране итогов после тренировки или в панели слова."
                  : "Нажми на слово, чтобы посмотреть перевод или убрать его из повторения."}
              </Text>
            </View>

            {total > 0 && (
              <View className="mt-5">
                <ReadingGrid
                  words={shown}
                  dots={dots}
                  onSelect={onSelectWord}
                  horizontalInset={SHEET_HORIZONTAL_INSET}
                />
              </View>
            )}

            {total > 0 && (
              <View className="mt-6 gap-2">
                <Text className="text-center font-nunito text-small text-textSecondary">
                  {missing > 0
                    ? `Для тренировки нужно ещё ${missing} ${pluralWords(missing)}`
                    : total > LESSON_SIZE
                      ? `В тренировку попадут ${inLesson} случайных ${pluralWords(inLesson)} из ${total}`
                      : `В тренировку попадут все ${total} ${pluralWords(total)}`}
                </Text>
                {missing === 0 && (
                  <Pressable
                    onPress={onStart}
                    className="min-h-14 items-center justify-center rounded-2xl bg-primary px-5 py-4 active:opacity-80"
                    accessibilityRole="button"
                  >
                    <Text className="font-nunitoBold text-body text-white">
                      Начать повторение
                    </Text>
                  </Pressable>
                )}
              </View>
            )}
          </>
        );
      }}
    </BottomSheet>
  );
}
