// src/components/flashcards/SetWordRow.tsx
//
// Строка слова на экране редактирования набора.
//   - "add": слова нет в наборе, справа «+» — нажатие добавляет;
//   - "added": слово уже в наборе (в результатах поиска), справа галочка — нажатие убирает;
//   - "remove": слово в списке набора, справа «✕» — нажатие убирает;
//   - "open": результат поиска на экране карточек, справа стрелка — нажатие открывает
//     панель слова (onOpenWord).
// В результатах поиска нажимается вся строка (проще попасть пальцем);
// в списке набора убирает только «✕» — чтобы не удалить слово случайно,
// а тап по строке открывает панель слова.
// Высота у всех строк одна; длинная фраза уменьшается и переносится на 2 строки.
// compact — пониже и поуже (экран итогов: там слов много).

import ArrowRight from "@/assets/images/icons/chevron-right.svg";
import CheckIcon from "@/assets/images/icons/circle-check.svg";
import PlusIcon from "@/assets/images/icons/circle-plus.svg";
import { Hanzi } from "@/components/ui/Hanzi";
import { LevelDots, type WordLevel } from "@/components/ui/LevelDots";
import { Pinyin } from "@/components/ui/Pinyin";
import type { Word } from "@/content/flashcards/types";
import { colors } from "@/theme/colors";
import { memo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

export type SetWordAction = "add" | "added" | "remove" | "open";

const ACTION_LABELS: Record<SetWordAction, string> = {
  add: "Добавить в набор",
  added: "Убрать из набора",
  remove: "Убрать из набора",
  open: "Показать слово",
};

interface SetWordRowProps {
  word: Word;
  action: SetWordAction;
  /** Вызывается с id слова: так колбэк один на весь список и memo работает. */
  onPress: (wordId: string) => void;
  /** Точки чтения. Без них точек нет. */
  level?: WordLevel;
  /** Тап по строке слова в наборе — открыть панель слова. */
  onOpenWord?: (word: Word) => void;
  /** Для "open": своя кнопка справа вместо стрелки (например, «Повторение»). */
  trailing?: ReactNode;
  /** Компактная строка (экран итогов). */
  compact?: boolean;
  /**
   * Для "open" с trailing: вид плашки, как у ячейки в «Словаре» —
   * изучено (тёплый фон) или в повторении (зелёная рамка).
   */
  tone?: "plain" | "learned" | "review";
}

const TONE_CLASSES = {
  plain: "border-transparent bg-surface",
  learned: "border-transparent bg-learned",
  review: "border-primary bg-surface",
};

/** Ширина колонки с иероглифами (w-28) и высота строки: одна для всех слов. */
const SIZES = {
  normal: { column: 112, height: 92, scale: 1 },
  compact: { column: 84, height: 68, scale: 0.85 },
};

/**
 * Размер иероглифов под колонку: короткие слова крупно в одну строку,
 * длинные фразы мельче и переносятся на вторую строку.
 */
function hanziSizeFor(hanzi: string): number {
  const length = Array.from(hanzi).length;
  if (length <= 3) return 28;
  if (length <= 8) return 24; // до 4 в строке, до двух строк
  if (length <= 10) return 20; // 5 в строке
  return 17; // ещё длиннее — до двух строк, остальное «…»
}

export const SetWordRow = memo(function SetWordRow({
  word,
  action,
  onPress,
  level,
  onOpenWord,
  trailing,
  compact = false,
  tone = "plain",
}: SetWordRowProps) {
  const { t } = useTranslation();
  const size = compact ? SIZES.compact : SIZES.normal;
  const HANZI_COLUMN = size.column;
  const ROW_HEIGHT = size.height;
  const isRemove = action === "remove";

  const content = (
    <>
      <View
        className="shrink-0 items-center justify-center"
        style={{ width: HANZI_COLUMN }}
      >
        <Hanzi
          size={Math.round(hanziSizeFor(word.hanzi) * size.scale)}
          numberOfLines={2}
          className="text-center"
        >
          {word.hanzi}
        </Hanzi>
        {level !== undefined && <LevelDots level={level} className="mt-1" />}
      </View>

      <View className="min-w-0 flex-1 justify-center">
        <Pinyin size="sm" numberOfLines={1}>
          {word.pinyin}
        </Pinyin>
        <Text numberOfLines={2} className="font-nunito text-body text-text">
          {t(word.translation)}
        </Text>
      </View>
    </>
  );

  // Слово в наборе: тап по строке — панель слова (перевод, озвучка),
  // убирает только «✕»
  if (isRemove) {
    return (
      <View
        className="flex-row items-center rounded-xl bg-surface"
        style={{ height: ROW_HEIGHT }}
      >
        <Pressable
          onPress={() => onOpenWord?.(word)}
          disabled={!onOpenWord}
          className="h-full flex-1 flex-row items-center gap-3 pl-1 active:opacity-70"
          accessibilityRole="button"
          accessibilityLabel={`${word.hanzi}, ${word.pinyin}`}
          accessibilityHint="Показать слово"
        >
          {content}
        </Pressable>
        <Pressable
          onPress={() => onPress(word.vocabularyId)}
          hitSlop={8}
          className="mr-1 h-11 w-11 shrink-0 items-center justify-center rounded-full active:bg-text/10"
          accessibilityRole="button"
          accessibilityLabel={`${word.hanzi}: ${ACTION_LABELS.remove}`}
        >
          <Text className="font-nunito text-lead text-textSecondary">✕</Text>
        </Pressable>
      </View>
    );
  }

  // Результат поиска / итогов: тап по строке открывает панель слова.
  // Своя кнопка справа (trailing) — рядом, а не внутри строки: иначе при тапе
  // по строке она тоже «нажималась» бы
  if (action === "open") {
    const label = `${word.hanzi}, ${word.pinyin}, ${t(word.translation)}`;

    if (trailing) {
      return (
        <View
          className={`flex-row items-center rounded-xl border pr-2 ${TONE_CLASSES[tone]}`}
          style={{ height: ROW_HEIGHT }}
        >
          <Pressable
            onPress={() => onOpenWord?.(word)}
            className="h-full flex-1 flex-row items-center gap-3 pl-1 active:opacity-70"
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityHint={ACTION_LABELS.open}
          >
            {content}
          </Pressable>
          {trailing}
        </View>
      );
    }

    return (
      <Pressable
        onPress={() => onOpenWord?.(word)}
        style={{ height: ROW_HEIGHT }}
        className="flex-row items-center gap-3 rounded-xl bg-surface pl-1 pr-3 active:opacity-70"
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={ACTION_LABELS.open}
      >
        {content}
        <ArrowRight width={20} height={20} color={colors.textSecondary} />
      </Pressable>
    );
  }

  // Результат поиска в редакторе набора: вся строка добавляет или убирает
  return (
    <Pressable
      onPress={() => onPress(word.vocabularyId)}
      style={{ height: ROW_HEIGHT }}
      className={`flex-row items-center gap-3 rounded-xl border pl-1 pr-3 active:opacity-70 ${
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
