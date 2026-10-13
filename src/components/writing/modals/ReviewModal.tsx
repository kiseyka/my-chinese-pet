// src/components/writing/modals/ReviewModal.tsx
//
// Окно «Повторение»: сетка отмеченных слов (рисует экран через renderGrid,
// чтобы точки, рамки и печати были те же, что в остальной сетке),
// подсказка, сколько слов попадёт в тренировку, и кнопка старта.
//
// Панель, анимации и свайп — в BottomSheet.

import ReviewIcon from "@/assets/images/icons/bookmark.svg";
import { BottomSheet } from "@/components/ui/BottomSheet";
import type { Word } from "@/content/flashcards/types";
import { colors } from "@/theme/colors";
import { pluralWords } from "@/utils/writing/labels";
import { useMemo, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

interface ReviewModalProps {
  open: boolean;
  /** Слова на «Повторении». */
  words: Word[];
  /** Сколько слов берётся в одну тренировку. */
  lessonSize: number;
  /** Сетка слов внутри панели. */
  renderGrid: (words: Word[]) => ReactNode;
  onStart: () => void;
  onClose: () => void;
}

export function ReviewModal({
  open,
  words,
  lessonSize,
  renderGrid,
  onStart,
  onClose,
}: ReviewModalProps) {
  // words в родителе мемоизированы, так что item стабилен, пока окно открыто
  const item = useMemo(() => (open ? { words } : null), [open, words]);

  return (
    <BottomSheet item={item} onClose={onClose}>
      {({ words: shown }) => {
        const total = shown.length;
        const inLesson = Math.min(lessonSize, total);
        const hint =
          total > lessonSize
            ? `В тренировку попадут ${inLesson} случайных ${pluralWords(inLesson)} из ${total}`
            : `В тренировку попадут все ${total} ${pluralWords(total)}`;

        return (
          <>
            {/* Шапка */}
            <View className="items-center gap-2">
              <View className="h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
                <ReviewIcon width={26} height={26} color={colors.primary} />
              </View>
              <Text className="font-nunitoBold text-title text-text">
                Повторение
              </Text>
              <Text className="text-center font-nunito text-small text-text opacity-70">
                Нажми на слово, чтобы потренировать его отдельно или убрать из
                повторения.
              </Text>
            </View>

            <View className="mt-5">{renderGrid(shown)}</View>

            {total > 0 ? (
              <View className="mt-6 gap-2">
                <Text className="text-center font-nunito text-small text-textSecondary">
                  {hint}
                </Text>
                <Pressable
                  onPress={onStart}
                  className="min-h-14 items-center justify-center rounded-2xl bg-primary px-5 py-4 active:opacity-80"
                  accessibilityRole="button"
                  accessibilityHint={hint}
                >
                  <Text className="font-nunitoBold text-body text-white">
                    Начать повторение
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Text className="mt-6 text-center font-nunito text-body text-text">
                В повторении пока нет слов.
              </Text>
            )}
          </>
        );
      }}
    </BottomSheet>
  );
}
