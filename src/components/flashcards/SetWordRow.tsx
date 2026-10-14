// src/components/flashcards/SetWordRow.tsx
//
// Строка слова на экране редактирования набора.
//   - "add": слова нет в наборе, справа «+» — нажатие добавляет;
//   - "added": слово уже в наборе (в результатах поиска), справа галочка — нажатие убирает;
//   - "remove": слово в списке набора, справа «✕» — нажатие убирает.
// В результатах поиска нажимается вся строка (проще попасть пальцем);
// в списке набора убирает только «✕» — чтобы не удалить слово случайно.

import CheckIcon from "@/assets/images/icons/circle-check.svg";
import PlusIcon from "@/assets/images/icons/circle-plus.svg";
import { Hanzi } from "@/components/ui/Hanzi";
import { LevelDots, type WordLevel } from "@/components/ui/LevelDots";
import { Pinyin } from "@/components/ui/Pinyin";
import type { Word } from "@/content/flashcards/types";
import { colors } from "@/theme/colors";
import { memo } from "react";
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
  /** Вызывается с id слова: так колбэк один на весь список и memo работает. */
  onPress: (wordId: string) => void;
  /** Точки чтения. Без них точек нет. */
  level?: WordLevel;
}

export const SetWordRow = memo(function SetWordRow({
  word,
  action,
  onPress,
  level,
}: SetWordRowProps) {
  const { t } = useTranslation();
  const isRemove = action === "remove";

  const content = (
    <>
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
    </>
  );

  // Слово в наборе: убирает только «✕», тап по строке ничего не делает
  if (isRemove) {
    return (
      <View className="min-h-16 flex-row items-center gap-3 rounded-xl bg-surface py-2 pl-3 pr-1">
        {content}
        <Pressable
          onPress={() => onPress(word.vocabularyId)}
          hitSlop={8}
          className="h-11 w-11 shrink-0 items-center justify-center rounded-full active:bg-text/10"
          accessibilityRole="button"
          accessibilityLabel={`${word.hanzi}: ${ACTION_LABELS.remove}`}
        >
          <Text className="font-nunito text-lead text-textSecondary">✕</Text>
        </Pressable>
      </View>
    );
  }

  // Результат поиска: вся строка добавляет или убирает
  return (
    <Pressable
      onPress={() => onPress(word.vocabularyId)}
      className={`min-h-16 flex-row items-center gap-3 rounded-xl border px-3 py-2 active:opacity-70 ${
        action === "added"
          ? "border-primary bg-surface"
          : "border-transparent bg-surface"
      }`}
      accessibilityRole="button"
      accessibilityLabel={`${word.hanzi}, ${ACTION_LABELS[action]}`}
    >
      {content}
      <View className="h-10 w-10 shrink-0 items-center justify-center">
        {action === "add" ? (
          <PlusIcon width={24} height={24} color={colors.primary} />
        ) : (
          <CheckIcon width={24} height={24} color={colors.primary} />
        )}
      </View>
    </Pressable>
  );
});
