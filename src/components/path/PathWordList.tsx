// src/components/path/PathWordList.tsx
//
// Список слов на экране этапа:
//   слева    — иероглиф, под ним две строки точек: перевод (зелёные) и письмо (тёмные).
//              У слова, которое нельзя писать, вместо точек письма пустое место той же
//              высоты — строки не прыгают;
//   середина — пиньинь и перевод;
//   справа   — закладка «Повторение» (залита — слово в повторении; тап переключает)
//              и «Наборы» (подсвечена, если слово уже в каком-то наборе; тап — шторка
//              с наборами, как в панели слова).
// Тап по строке — панель слова (onSelect).
//
// Сетка PathWordGrid осталась для «Словаря»: там слов сотни, и список был бы
// слишком длинным.

import LayersIcon from "@/assets/images/icons/layers.svg";
import { TRACK_DOT_CLASSES } from "@/components/path/PathWordGrid";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Hanzi } from "@/components/ui/Hanzi";
import { Pinyin } from "@/components/ui/Pinyin";
import { ReviewButton } from "@/components/ui/ReviewButton";
import { SetToggleList } from "@/components/word/SetToggleList";
import type { Word } from "@/content/flashcards/types";
import { useCustomSetsStore } from "@/store/customSetsStore";
import { useWordProgressStore } from "@/store/wordProgressStore";
import { colors } from "@/theme/colors";
import type { TrackId } from "@/utils/path/stages";
import { memo, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

/** Ширина колонки с иероглифами. */
const HANZI_COLUMN = 76;

interface PathWordListProps {
  words: Word[];
  /** Точки слова по дорожке; undefined — у слова нет этой дорожки. */
  getDots: (word: Word, track: TrackId) => number | undefined;
  onSelect: (word: Word) => void;
}

/** Размер иероглифов под колонку: 1–2 знака крупно, длиннее — мельче. */
function hanziSize(hanzi: string): number {
  const length = Array.from(hanzi).length;
  if (length <= 2) return 28;
  if (length === 3) return 22;
  return 18;
}

export const PathWordList = memo(function PathWordList({
  words,
  getDots,
  onSelect,
}: PathWordListProps) {
  const { t } = useTranslation();
  const review = useWordProgressStore((s) => s.review);
  const toggleReview = useWordProgressStore((s) => s.toggleReview);
  const sets = useCustomSetsStore((s) => s.sets);

  // Слова, которые уже лежат хотя бы в одном наборе
  const inSets = useMemo(
    () => new Set(sets.flatMap((set) => set.wordIds)),
    [sets],
  );

  // Слово, для которого открыта шторка наборов
  const [setsWord, setSetsWord] = useState<Word | null>(null);

  return (
    <View>
      {words.map((word, i) => {
        const translation = t(word.translation);
        const inReview = !!review[word.vocabularyId];
        const inSet = inSets.has(word.vocabularyId);

        return (
          <View
            key={word.vocabularyId}
            className={`flex-row items-center ${
              i > 0 ? "border-t border-border" : ""
            }`}
          >
            <Pressable
              onPress={() => onSelect(word)}
              className="min-w-0 flex-1 flex-row items-center gap-3 py-2.5 active:opacity-70"
              accessibilityRole="button"
              accessibilityLabel={`${word.hanzi}, ${word.pinyin}, ${translation}`}
              accessibilityHint="Показать слово"
            >
              <View
                className="shrink-0 items-center gap-1"
                style={{ width: HANZI_COLUMN }}
              >
                <Hanzi
                  size={hanziSize(word.hanzi)}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  maxFontSizeMultiplier={1.2}
                >
                  {word.hanzi}
                </Hanzi>
                <SkillDots track="reading" level={getDots(word, "reading")} />
                <SkillDots track="writing" level={getDots(word, "writing")} />
              </View>

              <View className="min-w-0 flex-1">
                <Pinyin size="sm" numberOfLines={1} className="text-primary">
                  {word.pinyin}
                </Pinyin>
                <Text
                  numberOfLines={2}
                  className="font-nunito text-body text-text"
                >
                  {translation}
                </Text>
              </View>
            </Pressable>

            {/* Кнопки рядом со строкой, а не внутри: тап по ним не открывает панель слова */}
            <View className="shrink-0 flex-row items-center gap-1 pl-2">
              <View className="h-10 w-10 items-center justify-center">
                <ReviewButton
                  inReview={inReview}
                  onToggle={() => toggleReview(word.vocabularyId)}
                  size={22}
                />
              </View>
              <Pressable
                onPress={() => setSetsWord(word)}
                hitSlop={6}
                className={`h-10 w-10 items-center justify-center rounded-full active:opacity-70 ${
                  inSet ? "bg-primary/15" : ""
                }`}
                accessibilityRole="button"
                accessibilityLabel={inSet ? "Наборы со словом" : "Добавить в набор"}
              >
                <LayersIcon width={22} height={22} color={colors.primary} />
              </Pressable>
            </View>
          </View>
        );
      })}

      <BottomSheet item={setsWord} onClose={() => setSetsWord(null)}>
        {(word) => (
          <>
            <View className="mb-4 flex-row items-center gap-3">
              <Hanzi size={28}>{word.hanzi}</Hanzi>
              <View className="min-w-0 flex-1">
                <Pinyin size="sm" numberOfLines={1} className="text-primary">
                  {word.pinyin}
                </Pinyin>
                <Text
                  numberOfLines={1}
                  className="font-nunito text-body text-text"
                >
                  {t(word.translation)}
                </Text>
              </View>
            </View>
            <SetToggleList word={word} />
          </>
        )}
      </BottomSheet>
    </View>
  );
});

/** Три точки навыка. Нет дорожки — пустое место той же высоты. */
function SkillDots({
  track,
  level,
}: {
  track: TrackId;
  level: number | undefined;
}) {
  const [filled, empty] = TRACK_DOT_CLASSES[track];

  return (
    <View
      className="flex-row gap-1"
      style={{ opacity: level === undefined ? 0 : 1 }}
      importantForAccessibility="no-hide-descendants"
    >
      {[0, 1, 2].map((index) => (
        <View
          key={index}
          className={`h-1.5 w-1.5 rounded-full ${
            index < (level ?? 0) ? filled : empty
          }`}
        />
      ))}
    </View>
  );
}
