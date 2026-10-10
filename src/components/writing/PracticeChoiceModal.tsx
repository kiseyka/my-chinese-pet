// src/components/writing/PracticeChoiceModal.tsx
//
// Окно перед тренировкой письма: что писать (у двусложного слова — слово целиком
// или один из иероглифов), в каком формате (быстро или полный цикл), а также
// переключатель «Повторение» для выбранного слова или иероглифа.

import { Hanzi } from "@/components/ui/Hanzi";
import { Pinyin } from "@/components/ui/Pinyin";
import type { Word } from "@/content/flashcards/types";
import type { FreeFormat } from "@/utils/writingLessons";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WritingDots } from "./HanziGrid";

/** Набор переводов, где лежат переводы слов (как на экране урока). */
const WORDS_NAMESPACE = "sets";

interface PracticeChoiceModalProps {
  /** Слово из сетки; null — окно закрыто. */
  word: Word | null;
  /** Иероглифы двусложного слова для отдельной практики (у односложного — пусто). */
  characters: Word[];
  getLevel: (word: Word) => number;
  /** Слово или иероглиф в списке «Повторение». */
  isInReview: (word: Word) => boolean;
  onToggleReview: (word: Word) => void;
  onStart: (word: Word, format: FreeFormat) => void;
  onClose: () => void;
}

export function PracticeChoiceModal({
  word,
  characters,
  getLevel,
  isInReview,
  onToggleReview,
  onStart,
  onClose,
}: PracticeChoiceModalProps) {
  const { t } = useTranslation([WORDS_NAMESPACE]);
  const insets = useSafeAreaInsets();

  // Что тренировать: по умолчанию слово целиком
  const [target, setTarget] = useState<Word | null>(word);

  useEffect(() => {
    setTarget(word);
  }, [word]);

  if (!word) return null;

  const selected = target ?? word;
  const options = characters.length > 0 ? [word, ...characters] : [];
  const inReview = isInReview(selected);

  return (
    <Modal
      visible={!!word}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/40">
        <View
          className="gap-4 rounded-t-3xl bg-background p-6"
          style={{ paddingBottom: insets.bottom + 16 }}
        >
          {/* Слово и закрыть */}
          <View className="flex-row items-start justify-between">
            <View className="flex-1 gap-1 pr-2">
              <Hanzi size="md">{word.hanzi}</Hanzi>
              <Pinyin size="md">{word.pinyin}</Pinyin>
              <Text className="font-nunito text-lead text-text">
                {t(word.translation)}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8} className="-m-2 p-2">
              <Text className="text-title text-text">✕</Text>
            </Pressable>
          </View>

          {/* Двусложное слово: целиком или один иероглиф */}
          {options.length > 0 && (
            <View className="gap-2">
              <Text className="font-nunito text-body text-text">
                Что потренировать?
              </Text>
              <View className="flex-row gap-2">
                {options.map((option) => {
                  const isWhole = option === word;
                  const isSelected =
                    option.vocabularyId === selected.vocabularyId;

                  return (
                    <Pressable
                      key={option.vocabularyId}
                      onPress={() => setTarget(option)}
                      className={`flex-1 items-center gap-1 rounded-2xl px-2 py-3 active:opacity-70 ${
                        isSelected ? "bg-primary/20" : "bg-surface"
                      }`}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSelected }}
                    >
                      <Hanzi size="sm" maxFontSizeMultiplier={1.2}>
                        {option.hanzi}
                      </Hanzi>
                      {isWhole ? (
                        <Text className="font-nunito text-small text-text">
                          Оба
                        </Text>
                      ) : (
                        <Pinyin size="sm">{option.pinyin || " "}</Pinyin>
                      )}
                      <WritingDots level={getLevel(option)} />
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* «Повторение»: для выбранного слова или иероглифа */}
          <Pressable
            onPress={() => onToggleReview(selected)}
            className={`min-h-12 flex-row items-center justify-center gap-2 rounded-2xl px-4 py-3 active:opacity-70 ${
              inReview ? "bg-primary/20" : "border border-primary"
            }`}
            accessibilityRole="switch"
            accessibilityState={{ checked: inReview }}
          >
            <Text className="font-nunito text-body text-text">
              {inReview ? "На повторении ✓" : "Повторять"}
            </Text>
            {options.length > 0 && (
              <Text className="font-chineseMedium text-body text-text">
                {selected.hanzi}
              </Text>
            )}
          </Pressable>

          {/* Формат */}
          <View className="gap-2">
            <Pressable
              onPress={() => onStart(selected, "quick")}
              className="min-h-12 items-center justify-center rounded-2xl bg-surface px-4 py-3 active:opacity-70"
            >
              <Text className="font-nunitoBold text-body text-text">
                Быстрая тренировка
              </Text>
              <Text className="font-nunito text-small text-text">
                По контуру, затем по памяти
              </Text>
            </Pressable>

            <Pressable
              onPress={() => onStart(selected, "full")}
              className="min-h-12 items-center justify-center rounded-2xl bg-primary px-4 py-3 active:opacity-80"
            >
              <Text className="font-nunitoBold text-body text-white">
                Полная тренировка
              </Text>
              <Text className="font-nunito text-small text-white">
                Показ порядка черт, части, контур и по памяти
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
