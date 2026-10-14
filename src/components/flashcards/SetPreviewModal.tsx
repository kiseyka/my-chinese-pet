// src/components/flashcards/SetPreviewModal.tsx
//
// Превью набора перед тренировкой — панель снизу (как панель слова):
// название, сколько слов освоено, кнопки «Изменить» и «Начать» и сетка слов
// с точками чтения (до PREVIEW_LIMIT слов). Кнопки сверху, над списком, чтобы до них не нужно было листать.
// Если слов меньше, чем нужно для карточек, вместо «Начать» — подсказка.
//
// Панель, анимации и свайп вниз — в BottomSheet.

import {
  BottomSheet,
  SHEET_HORIZONTAL_INSET,
} from "@/components/ui/BottomSheet";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { Word } from "@/content/flashcards/types";
import { MIN_SET_WORDS } from "@/store/customSetsStore";
import { getWordLevel, useWordProgressStore } from "@/store/wordProgressStore";
import { pluralWords } from "@/utils/writing/labels";
import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { ReadingGrid } from "./ReadingGrid";

/** Сколько слов показывать в превью. */
const PREVIEW_LIMIT = 40;

interface SetPreviewModalProps {
  visible: boolean;
  title: string;
  words: Word[];
  onStart: () => void;
  onEdit: () => void;
  onClose: () => void;
}

export function SetPreviewModal({
  visible,
  title,
  words,
  onStart,
  onEdit,
  onClose,
}: SetPreviewModalProps) {
  const flashcardWords = useWordProgressStore((state) => state.flashcardWords);
  const vocabularyWords = useWordProgressStore(
    (state) => state.vocabularyWords,
  );

  // Пока панель уезжает, BottomSheet рисует последний item — название и слова не пропадают
  const item = useMemo(
    () => (visible ? { title, words } : null),
    [visible, title, words],
  );

  return (
    <BottomSheet item={item} onClose={onClose}>
      {({ title: shownTitle, words: shownWords }) => {
        const dots = shownWords.map((word) =>
          getWordLevel(
            flashcardWords[word.vocabularyId],
            vocabularyWords[word.vocabularyId]?.isKnown ?? false,
            ["reading"],
          ),
        );

        const total = shownWords.length;
        const mastered = dots.filter((dot) => dot === 3).length;
        const missing = Math.max(MIN_SET_WORDS - total, 0);
        const canStart = missing === 0;

        return (
          <>
            <Text className="font-nunitoBold text-title text-text">
              {shownTitle}
            </Text>

            {total > 0 && (
              <View className="mt-3">
                <ProgressBar progress={(mastered / total) * 100} />
                <Text className="mt-1 font-nunito text-caption text-textSecondary">
                  Освоено {mastered} из {total}
                </Text>
              </View>
            )}

            {/* Кнопки — над списком */}
            <View className="mt-4 flex-row gap-3">
              <Pressable
                onPress={onEdit}
                className="min-h-14 flex-1 items-center justify-center rounded-2xl bg-surface px-5 py-4 active:opacity-70"
                accessibilityRole="button"
              >
                <Text className="font-nunitoBold text-body text-text">
                  Изменить
                </Text>
              </Pressable>

              {canStart && (
                <Pressable
                  onPress={onStart}
                  className="min-h-14 flex-1 items-center justify-center rounded-2xl bg-primary px-5 py-4 active:opacity-80"
                  accessibilityRole="button"
                >
                  <Text className="font-nunitoBold text-body text-white">
                    Начать
                  </Text>
                </Pressable>
              )}
            </View>

            {!canStart && total > 0 && (
              <Text className="mt-2 text-center font-nunito text-small text-textSecondary">
                Для тренировки нужно ещё {missing} {pluralWords(missing)}
              </Text>
            )}

            {/* Слова — сеткой, как в ступенях (лёгкая: большой набор открывается быстро).
                Больше PREVIEW_LIMIT не рисуем: весь список — в «Изменить» */}
            <View className="mt-5">
              {total === 0 ? (
                <Text className="font-nunito text-body text-text">
                  В наборе пока нет слов. Нажми «Изменить», чтобы добавить их.
                </Text>
              ) : (
                <>
                  <ReadingGrid
                    words={shownWords.slice(0, PREVIEW_LIMIT)}
                    dots={dots.slice(0, PREVIEW_LIMIT)}
                    horizontalInset={SHEET_HORIZONTAL_INSET}
                  />
                  {total > PREVIEW_LIMIT && (
                    <Text className="mt-3 text-center font-nunito text-small text-textSecondary">
                      и ещё {total - PREVIEW_LIMIT}{" "}
                      {pluralWords(total - PREVIEW_LIMIT)} — все слова в
                      «Изменить»
                    </Text>
                  )}
                </>
              )}
            </View>
          </>
        );
      }}
    </BottomSheet>
  );
}
