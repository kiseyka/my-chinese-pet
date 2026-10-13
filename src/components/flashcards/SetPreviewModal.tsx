// src/components/flashcards/SetPreviewModal.tsx
//
// Превью набора перед тренировкой: название, сколько слов освоено, список слов
// с точками чтения и кнопки «Изменить» и «Начать».
// Если слов меньше, чем нужно для карточек, вместо «Начать» — подсказка.

import { ProgressBar } from "@/components/ui/ProgressBar";
import { WordCard } from "@/components/ui/WordCard";
import type { Word } from "@/content/flashcards/types";
import { MIN_SET_WORDS } from "@/store/customSetsStore";
import {
  getMasteryBucket,
  getWordLevel,
  useWordProgressStore,
} from "@/store/wordProgressStore";
import { pluralWords } from "@/utils/writing/labels";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  const insets = useSafeAreaInsets();

  const flashcardWords = useWordProgressStore((state) => state.flashcardWords);
  const vocabularyWords = useWordProgressStore(
    (state) => state.vocabularyWords,
  );
  const toggleFavorite = useWordProgressStore((state) => state.toggleFavorite);

  const wordEntries = words.map((word) => {
    const progress = flashcardWords[word.vocabularyId];
    const vocabWordProgress = vocabularyWords[word.vocabularyId];
    const isKnown = vocabWordProgress?.isKnown ?? false;

    return {
      word,
      isFavorite: vocabWordProgress?.isFavorite ?? false,
      level: getWordLevel(progress, isKnown, ["reading"]),
      isMastered: getMasteryBucket(progress, isKnown, ["reading"]) === "learned",
    };
  });

  const total = words.length;
  const masteredCount = wordEntries.filter((w) => w.isMastered).length;
  const progress = total > 0 ? (masteredCount / total) * 100 : 0;

  const missing = Math.max(MIN_SET_WORDS - total, 0);
  const canStart = missing === 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/40">
        {/* Тап по затемнению закрывает окно */}
        <Pressable
          className="flex-1"
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Закрыть"
        />

        <View
          className="rounded-t-3xl bg-background p-6"
          style={{ maxHeight: "85%", paddingBottom: insets.bottom + 16 }}
        >
          {/* Заголовок + закрыть */}
          <View className="mb-3 flex-row items-start justify-between">
            <Text className="flex-1 pr-2 font-nunitoBold text-title text-text">
              {title}
            </Text>
            <Pressable onPress={onClose} hitSlop={12} className="p-1">
              <Text className="font-nunito text-lead text-text">✕</Text>
            </Pressable>
          </View>

          {total > 0 && (
            <>
              <ProgressBar progress={progress} />
              <Text className="mb-4 mt-1 font-nunito text-caption text-textSecondary">
                Освоено {masteredCount} из {total}
              </Text>
            </>
          )}

          {/* Список слов */}
          <ScrollView showsVerticalScrollIndicator={false} className="mb-4">
            {total === 0 ? (
              <Text className="font-nunito text-body text-text">
                В наборе пока нет слов. Нажми «Изменить», чтобы добавить их.
              </Text>
            ) : (
              <View className="gap-2">
                {wordEntries.map(({ word, isFavorite, level }) => (
                  <WordCard
                    key={word.id}
                    hanzi={word.hanzi}
                    pinyin={word.pinyin}
                    translation={word.translation}
                    isFavorite={isFavorite}
                    level={level}
                    onToggleFavorite={() => toggleFavorite(word.vocabularyId)}
                  />
                ))}
              </View>
            )}
          </ScrollView>

          {!canStart && total > 0 && (
            <Text className="mb-3 text-center font-nunito text-small text-textSecondary">
              Для тренировки нужно ещё {missing} {pluralWords(missing)}
            </Text>
          )}

          <View className="flex-row gap-3">
            <Pressable
              onPress={onEdit}
              className={`min-h-14 items-center justify-center rounded-2xl bg-surface px-5 py-4 active:opacity-70 ${
                canStart ? "" : "flex-1"
              }`}
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
        </View>
      </View>
    </Modal>
  );
}
