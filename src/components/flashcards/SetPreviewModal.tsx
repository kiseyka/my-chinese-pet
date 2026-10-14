// src/components/flashcards/SetPreviewModal.tsx
//
// Превью набора перед тренировкой — панель снизу (как панель слова):
// название, сколько слов освоено, кнопки «Изменить» и «Начать» и список слов
// с точками чтения. Кнопки сверху, над списком, чтобы до них не нужно было листать.
// Если слов меньше, чем нужно для карточек, вместо «Начать» — подсказка.
//
// Панель, анимации и свайп вниз — в BottomSheet.

import { BottomSheet } from "@/components/ui/BottomSheet";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { WordCard } from "@/components/ui/WordCard";
import type { Word } from "@/content/flashcards/types";
import { MIN_SET_WORDS } from "@/store/customSetsStore";
import { getWordLevel, useWordProgressStore } from "@/store/wordProgressStore";
import { pluralWords } from "@/utils/writing/labels";
import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

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
  const toggleFavorite = useWordProgressStore((state) => state.toggleFavorite);

  // Пока панель уезжает, BottomSheet рисует последний item — название и слова не пропадают
  const item = useMemo(
    () => (visible ? { title, words } : null),
    [visible, title, words],
  );

  return (
    <BottomSheet item={item} onClose={onClose}>
      {({ title: shownTitle, words: shownWords }) => {
        const entries = shownWords.map((word) => {
          const vocab = vocabularyWords[word.vocabularyId];
          return {
            word,
            isFavorite: vocab?.isFavorite ?? false,
            level: getWordLevel(
              flashcardWords[word.vocabularyId],
              vocab?.isKnown ?? false,
              ["reading"],
            ),
          };
        });

        const total = shownWords.length;
        const mastered = entries.filter((entry) => entry.level === 3).length;
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

            {/* Список слов */}
            <View className="mt-5 gap-2">
              {total === 0 ? (
                <Text className="font-nunito text-body text-text">
                  В наборе пока нет слов. Нажми «Изменить», чтобы добавить их.
                </Text>
              ) : (
                entries.map(({ word, isFavorite, level }) => (
                  <WordCard
                    key={word.id}
                    hanzi={word.hanzi}
                    pinyin={word.pinyin}
                    translation={word.translation}
                    isFavorite={isFavorite}
                    level={level}
                    onToggleFavorite={() => toggleFavorite(word.vocabularyId)}
                  />
                ))
              )}
            </View>
          </>
        );
      }}
    </BottomSheet>
  );
}
