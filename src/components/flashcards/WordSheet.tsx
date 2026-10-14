// src/components/flashcards/WordSheet.tsx
//
// Панель слова снизу (по тапу на слово в сетке): иероглиф и пиньинь (тап — озвучка),
// перевод, точки чтения, где лежит слово («HSK 2 · Ступень 7», из поиска —
// с кнопкой «Показать»), «Повторение» карточек, список своих наборов — в какой добавить слово —
// и «Новый набор»: окно с названием, и слово сразу попадает в новый набор.

import ReviewIcon from "@/assets/images/icons/bookmark.svg";
import CheckIcon from "@/assets/images/icons/circle-check.svg";
import PlusIcon from "@/assets/images/icons/circle-plus.svg";
import VolumeIcon from "@/assets/images/icons/volume.svg";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Hanzi } from "@/components/ui/Hanzi";
import { Pinyin } from "@/components/ui/Pinyin";
import { WritingDots } from "@/components/writing/home/WritingDots";
import type { Word } from "@/content/flashcards/types";
import { useSpeakHanzi } from "@/hooks/useSpeakHanzi";
import { useCustomSetsStore } from "@/store/customSetsStore";
import { getWordLevel, useWordProgressStore } from "@/store/wordProgressStore";
import { colors } from "@/theme/colors";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SetTitleModal } from "./SetTitleModal";

interface WordSheetProps {
  /** Слово; null — панель закрыта. */
  word: Word | null;
  /** Где лежит слово: «HSK 2 · Ступень 7». */
  location?: string;
  /** Если передан — у строки с местом есть кнопка «Показать». */
  onShowInStep?: () => void;
  onClose: () => void;
}

/** Крупно для коротких слов; длинные фразы мельче и переносятся. */
function sheetHanziSize(hanzi: string): number | "lg" {
  const length = Array.from(hanzi).length;
  if (length <= 4) return "lg";
  if (length <= 6) return 44;
  return 36;
}

export function WordSheet({
  word,
  location,
  onShowInStep,
  onClose,
}: WordSheetProps) {
  const { t } = useTranslation();
  const { speakForced } = useSpeakHanzi();

  const sets = useCustomSetsStore((state) => state.sets);
  const toggleWord = useCustomSetsStore((state) => state.toggleWord);
  const readingReview = useWordProgressStore((state) => state.readingReview);
  const toggleReadingReview = useWordProgressStore(
    (state) => state.toggleReadingReview,
  );
  const createSet = useCustomSetsStore((state) => state.createSet);
  const flashcardWords = useWordProgressStore((state) => state.flashcardWords);
  const vocabularyWords = useWordProgressStore(
    (state) => state.vocabularyWords,
  );

  // Слово, для которого создаём набор (окно с названием поверх панели)
  const [creatingFor, setCreatingFor] = useState<Word | null>(null);

  return (
    <>
      <BottomSheet item={word} onClose={onClose}>
        {(shown) => {
          const level = getWordLevel(
            flashcardWords[shown.vocabularyId],
            vocabularyWords[shown.vocabularyId]?.isKnown ?? false,
            ["reading"],
          );
          const inReview = !!readingReview[shown.vocabularyId];

          return (
            <>
              {/* Шапка: слово и пиньинь (тап — озвучка), перевод, точки */}
              <View className="items-center gap-1">
                {/* Иероглиф и пиньинь: тап — озвучка */}
                <Pressable
                  onPress={() => speakForced(shown.hanzi)}
                  className="active:opacity-60"
                  accessibilityRole="button"
                  accessibilityLabel={`${shown.hanzi}: послушать`}
                >
                  <Hanzi
                    size={sheetHanziSize(shown.hanzi)}
                    numberOfLines={2}
                    className="text-center"
                  >
                    {shown.hanzi}
                  </Hanzi>
                </Pressable>

                <Pressable
                  onPress={() => speakForced(shown.hanzi)}
                  className="flex-row items-center gap-2 active:opacity-60"
                  accessibilityRole="button"
                  accessibilityLabel="Послушать"
                  hitSlop={8}
                >
                  <Pinyin size="md">{shown.pinyin}</Pinyin>
                  <VolumeIcon width={20} height={20} color={colors.primary} />
                </Pressable>

                <Text className="text-center font-nunito text-lead text-text">
                  {t(shown.translation)}
                </Text>

                <View className="mt-2">
                  <WritingDots level={level} />
                </View>
              </View>

              {/* Где лежит слово */}
              {location && (
                <View className="mt-5 min-h-12 flex-row items-center justify-between gap-3 rounded-2xl bg-surface px-4 py-2">
                  <Text className="flex-1 font-nunito text-body text-text">
                    {location}
                  </Text>
                  {onShowInStep && (
                    <Pressable
                      onPress={onShowInStep}
                      hitSlop={8}
                      className="min-h-10 justify-center active:opacity-60"
                      accessibilityRole="button"
                      accessibilityLabel={`Показать: ${location}`}
                    >
                      <Text className="font-nunitoBold text-small text-primary">
                        Показать
                      </Text>
                    </Pressable>
                  )}
                </View>
              )}

              {/* Повторение в карточках */}
              <Pressable
                onPress={() => toggleReadingReview(shown.vocabularyId)}
                className={`mt-3 min-h-12 flex-row items-center gap-3 rounded-2xl border bg-surface px-4 py-3 active:opacity-70 ${
                  inReview ? "border-primary" : "border-transparent"
                }`}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: inReview }}
              >
                <ReviewIcon
                  width={22}
                  height={22}
                  color={inReview ? colors.primary : colors.textSecondary}
                />
                <Text className="flex-1 font-nunito text-body text-text">
                  {inReview ? "На повторении" : "Добавить в повторение"}
                </Text>
                {inReview ? (
                  <CheckIcon width={22} height={22} color={colors.primary} />
                ) : (
                  <PlusIcon
                    width={22}
                    height={22}
                    color={colors.textSecondary}
                  />
                )}
              </Pressable>

              {/* Свои наборы */}
              <View className="mt-6 gap-2">
                <Text className="font-nunitoBold text-body text-text">
                  Добавить в набор
                </Text>

                {sets.map((set) => {
                  const inSet = set.wordIds.includes(shown.vocabularyId);

                  return (
                    <Pressable
                      key={set.id}
                      onPress={() => toggleWord(set.id, shown.vocabularyId)}
                      className={`min-h-12 flex-row items-center justify-between gap-3 rounded-2xl border bg-surface px-4 py-3 active:opacity-70 ${
                        inSet ? "border-primary" : "border-transparent"
                      }`}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: inSet }}
                    >
                      <Text
                        numberOfLines={1}
                        className="flex-1 font-nunito text-body text-text"
                      >
                        {set.title}
                      </Text>
                      {inSet ? (
                        <CheckIcon
                          width={22}
                          height={22}
                          color={colors.primary}
                        />
                      ) : (
                        <PlusIcon
                          width={22}
                          height={22}
                          color={colors.textSecondary}
                        />
                      )}
                    </Pressable>
                  );
                })}

                {/* Новый набор сразу с этим словом */}
                <Pressable
                  onPress={() => setCreatingFor(shown)}
                  className="min-h-12 flex-row items-center justify-between gap-3 rounded-2xl border border-dashed border-primary px-4 py-3 active:opacity-70"
                  accessibilityRole="button"
                >
                  <Text className="flex-1 font-nunitoBold text-body text-primary">
                    Новый набор
                  </Text>
                  <PlusIcon width={22} height={22} color={colors.primary} />
                </Pressable>
              </View>
            </>
          );
        }}
      </BottomSheet>

      {/* Поверх панели: название нового набора */}
      <SetTitleModal
        visible={!!creatingFor}
        heading="Новый набор"
        message={
          creatingFor ? `${creatingFor.hanzi} сразу попадёт в него` : undefined
        }
        confirmLabel="Создать"
        onClose={() => setCreatingFor(null)}
        onConfirm={(title) => {
          if (creatingFor) {
            const setId = createSet(title);
            toggleWord(setId, creatingFor.vocabularyId);
          }
          setCreatingFor(null);
        }}
      />
    </>
  );
}
