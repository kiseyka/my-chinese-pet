// components/game/SetPreviewModal.tsx

import { WordCard } from "@/components/ui/WordCard";
import {
  getMasteryBucket,
  getWordLevel,
  useWordProgressStore,
} from "@/store/wordProgressStore";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ProgressBar } from "../ui/ProgressBar";

type PracticeSetWord = {
  id: string;
  vocabularyId: string;
  hanzi: string;
  pinyin: string;
  translation: string;
};

type PracticeSet = {
  id: string;
  title: string;
  description?: string;
  words: PracticeSetWord[];
};

type SetPreviewModalProps = {
  visible: boolean;
  practiceSet: PracticeSet | null;
  /** Если не передан, кнопки «Начать» нет (режим просмотра). */
  onStart?: () => void;
  onClose: () => void;
  /** По какому навыку показывать прогресс. По умолчанию — чтение (карточки). */
  skill?: "reading" | "writing";
  /** Если передан, слова в списке нажимаются: вызывается с vocabularyId слова. */
  onSelectWord?: (vocabularyId: string) => void;
  /** Дополнительный блок под списком слов (например, кнопки режимов). */
  footer?: ReactNode;
};

export const SetPreviewModal = ({
  visible,
  practiceSet,
  onStart,
  onClose,
  skill = "reading",
  onSelectWord,
  footer,
}: SetPreviewModalProps) => {
  const { t } = useTranslation(["sets"]);
  const insets = useSafeAreaInsets();

  const flashcardWords = useWordProgressStore((state) => state.flashcardWords);
  const vocabularyWords = useWordProgressStore(
    (state) => state.vocabularyWords,
  );
  const toggleFavorite = useWordProgressStore((state) => state.toggleFavorite);

  if (!practiceSet) return null;

  const words = practiceSet.words;

  const wordEntries = words.map((word) => {
    const skillProgress = flashcardWords[word.vocabularyId];
    const vocabWordProgress = vocabularyWords[word.vocabularyId];
    // Для письма отметка «слово известно» не учитывается: знать слово и уметь его писать — разное
    const isKnown =
      skill === "writing" ? false : (vocabWordProgress?.isKnown ?? false);

    return {
      word,
      isFavorite: vocabWordProgress?.isFavorite ?? false,
      level: getWordLevel(skillProgress, isKnown, [skill]),
      isMastered:
        getMasteryBucket(skillProgress, isKnown, [skill]) === "learned",
    };
  });

  const masteredCount = wordEntries.filter((w) => w.isMastered).length;
  const progress = words.length > 0 ? (masteredCount / words.length) * 100 : 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/40">
        <View
          className="bg-background rounded-t-3xl p-6"
          style={{ maxHeight: "85%", paddingBottom: insets.bottom + 16 }}
        >
          {/* Заголовок + закрыть */}
          <View className="flex-row justify-between items-start mb-2">
            <Text className="text-text text-2xl font-['NotoSansSCMedium'] flex-1 pr-2">
              {t(practiceSet.title)}
            </Text>
            <Pressable onPress={onClose} className="p-2 -m-2">
              <Text className="text-text text-xl">✕</Text>
            </Pressable>
          </View>

          {/* Описание */}
          {practiceSet.description && (
            <Text className="text-text/70 text-sm mb-4">
              {t(practiceSet.description)}
            </Text>
          )}

          <ProgressBar progress={progress} />
          <Text className="text-text/60 text-xs mt-1 mb-4">
            {t("common.masteredCount", {
              count: masteredCount,
              total: words.length,
            })}
          </Text>

          {/* Список слов */}
          <ScrollView showsVerticalScrollIndicator={false} className="mb-4">
            <View className="gap-2">
              {wordEntries.map(({ word, isFavorite, level }) => {
                const card = (
                  <WordCard
                    hanzi={word.hanzi}
                    pinyin={word.pinyin}
                    translation={word.translation}
                    isFavorite={isFavorite}
                    level={level}
                    onToggleFavorite={() => toggleFavorite(word.vocabularyId)}
                  />
                );

                return onSelectWord ? (
                  <Pressable
                    key={word.id}
                    onPress={() => onSelectWord(word.vocabularyId)}
                    className="active:opacity-70"
                  >
                    {card}
                  </Pressable>
                ) : (
                  <View key={word.id}>{card}</View>
                );
              })}
            </View>
          </ScrollView>

          {footer}

          {/* Начать */}
          {onStart && (
            <Pressable
              onPress={onStart}
              className="bg-primary rounded-2xl py-4 items-center active:opacity-80"
            >
              <Text className="text-white text-base font-['NunitoBold']">
                {t("common.start")}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
};
