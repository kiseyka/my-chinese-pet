// src/components/flashcards/SetWordRow.tsx
//
// Строка слова на экране редактирования набора.
//   - "add": слова нет в наборе, справа «+» — нажатие добавляет;
//   - "added": слово уже в наборе (в результатах поиска), справа галочка — нажатие убирает;
//   - "remove": слово в списке набора, справа «✕» — нажатие убирает.
// Нажимается вся строка, а не только значок: так проще попасть пальцем.

import CheckIcon from "@/assets/images/icons/circle-check.svg";
import PlusIcon from "@/assets/images/icons/circle-plus.svg";
import { Hanzi } from "@/components/ui/Hanzi";
import { LevelDots, type WordLevel } from "@/components/ui/LevelDots";
import { Pinyin } from "@/components/ui/Pinyin";
import type { Word } from "@/content/flashcards/types";
import { colors } from "@/theme/colors";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

export type SetWordAction = "add" | "added" | "remove";

const ACTION_LABELS: Record<SetWordAction, string> = {
  add: "Добавить в набор",
  added: "Убрать из набора",
  remove: "Убрать из набора",
};

interface SetWordRowProps {
  word: Word;
  action: SetWordAction;
  onPress: () => void;
  /** Точки чтения. Без них точек нет. */
  level?: WordLevel;
}

export function SetWordRow({ word, action, onPress, level }: SetWordRowProps) {
  const { t } = useTranslation();

  return (
    <Pressable
      onPress={onPress}
      className={`min-h-16 flex-row items-center gap-3 rounded-xl px-3 py-2 active:opacity-70 ${
        action === "added" ? "border border-primary bg-surface" : "bg-surface"
      }`}
      accessibilityRole="button"
      accessibilityLabel={`${word.hanzi}, ${ACTION_LABELS[action]}`}
    >
      <View className="w-24 shrink-0 items-center">
        <Hanzi size="sm" numberOfLines={1} adjustsFontSizeToFit>
          {word.hanzi}
        </Hanzi>
        {level !== undefined && <LevelDots level={level} className="mt-1" />}
      </View>

      <View className="min-w-0 flex-1">
        <Pinyin size="sm" numberOfLines={1}>
          {word.pinyin}
        </Pinyin>
        <Text numberOfLines={2} className="font-nunito text-body text-text">
          {t(word.translation)}
        </Text>
      </View>

      <View className="h-10 w-10 shrink-0 items-center justify-center">
        {action === "add" && (
          <PlusIcon width={24} height={24} color={colors.primary} />
        )}
        {action === "added" && (
          <CheckIcon width={24} height={24} color={colors.primary} />
        )}
        {action === "remove" && (
          <Text className="font-nunito text-lead text-textSecondary">✕</Text>
        )}
      </View>
    </Pressable>
  );
}
