// src/components/path/PathWordList.tsx
//
// Список слов на экране этапа: иероглиф, пиньинь и перевод, справа — точки навыков
// (верхняя строка — перевод, нижняя — письмо; у слова, которое нельзя писать,
// вместо точек письма пустое место той же высоты, чтобы строки не прыгали).
// Тап по строке — панель слова (onSelect).
//
// Сетка PathWordGrid осталась для «Словаря»: там слов сотни, и список был бы
// слишком длинным.

import LanguagesIcon from "@/assets/images/icons/languages.svg";
import PencilIcon from "@/assets/images/icons/pencil.svg";
import { TRACK_DOT_CLASSES } from "@/components/path/PathWordGrid";
import { Hanzi } from "@/components/ui/Hanzi";
import { Pinyin } from "@/components/ui/Pinyin";
import type { Word } from "@/content/flashcards/types";
import { colors } from "@/theme/colors";
import type { TrackId } from "@/utils/path/stages";
import { memo } from "react";
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

  return (
    <View>
      {words.map((word, i) => {
        const reading = getDots(word, "reading");
        const writing = getDots(word, "writing");
        const translation = t(word.translation);

        return (
          <Pressable
            key={word.vocabularyId}
            onPress={() => onSelect(word)}
            className={`flex-row items-center gap-3 py-2.5 active:bg-primary/10 ${
              i > 0 ? "border-t border-border" : ""
            }`}
            accessibilityRole="button"
            accessibilityLabel={`${word.hanzi}, ${word.pinyin}, ${translation}`}
            accessibilityHint="Показать слово"
          >
            <View
              className="shrink-0 items-center"
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

            <View className="shrink-0 gap-1.5 pr-1">
              <SkillDots track="reading" level={reading} />
              <SkillDots track="writing" level={writing} />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
});

/** Иконка навыка и три точки. Нет дорожки — пустое место той же высоты. */
function SkillDots({
  track,
  level,
}: {
  track: TrackId;
  level: number | undefined;
}) {
  const Icon = track === "reading" ? LanguagesIcon : PencilIcon;
  const [filled, empty] = TRACK_DOT_CLASSES[track];

  return (
    <View
      className="h-3.5 flex-row items-center gap-1.5"
      style={{ opacity: level === undefined ? 0 : 1 }}
      importantForAccessibility="no-hide-descendants"
    >
      <Icon width={12} height={12} color={colors.textSecondary} />
      <View className="flex-row gap-1">
        {[0, 1, 2].map((index) => (
          <View
            key={index}
            className={`h-1.5 w-1.5 rounded-full ${
              index < (level ?? 0) ? filled : empty
            }`}
          />
        ))}
      </View>
    </View>
  );
}
