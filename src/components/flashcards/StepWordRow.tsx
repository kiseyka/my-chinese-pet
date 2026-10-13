// src/components/flashcards/StepWordRow.tsx
//
// Слово в развёрнутой ступени карточек: иероглиф с точками чтения, пиньинь и перевод.
// Только для просмотра: тренируется вся ступень целиком.

import { Hanzi } from "@/components/ui/Hanzi";
import { LevelDots, type WordLevel } from "@/components/ui/LevelDots";
import { Pinyin } from "@/components/ui/Pinyin";
import type { Word } from "@/content/flashcards/types";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

interface StepWordRowProps {
  word: Word;
  level: WordLevel;
}

export function StepWordRow({ word, level }: StepWordRowProps) {
  const { t } = useTranslation();

  return (
    <View className="flex-row items-center gap-3 py-1.5">
      <View className="w-20 shrink-0 items-center">
        <Hanzi size="sm" numberOfLines={1} adjustsFontSizeToFit>
          {word.hanzi}
        </Hanzi>
        <LevelDots level={level} className="mt-1" />
      </View>

      <View className="min-w-0 flex-1">
        <Pinyin size="sm" numberOfLines={1}>
          {word.pinyin}
        </Pinyin>
        <Text numberOfLines={2} className="font-nunito text-body text-text">
          {t(word.translation)}
        </Text>
      </View>
    </View>
  );
}
