// src/components/writing/lesson/LessonParts.tsx
//
// Общие куски экранов урока письма, сверху вниз:
//   TrainingHeader — «назад» и шкала прогресса (или заголовок);
//   WordHeading — пиньинь (нажатие — озвучка) и перевод слова;
//   TaskPill — что сделать сейчас: «Напиши» + пиньинь или знак части;
//   WrittenChars — уже написанные иероглифы слова, маленькими;
//   ResultComparison — «Эталон» и «Твоё» после слова;
//   PillButton — круглая кнопка «Дальше», «Ещё раз».

import { BackButton } from "@/components/ui/BackButton";
import { useGameStore } from "@/store/gameStore";
import { Pinyin } from "@/components/ui/Pinyin";
import type { Word } from "@/content/flashcards/types";
import { LESSON_SIDE_PADDING } from "@/hooks/writing/useCanvasSize";
import type { HanziData } from "@/types/hanzi";
import type { Point } from "@/utils/writing/strokeCheck";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import { HanziView } from "../canvas/HanziView";

/** Промежуток между иероглифами в сравнении (gap-3). */
const RESULT_GAP = 12;

/** Размер уже написанных иероглифов над холстом. */
const WRITTEN_SIZE = 52;

/**
 * «Назад» ведёт туда, откуда запустили тренировку: на путь (returnTo) или в «Словарь». router.back() здесь не подходит: в табах он уводит на панду.
 */
export function TrainingHeader({ children }: { children?: ReactNode }) {
  const returnTo = useGameStore((state) => state.returnTo);

  return (
    <View className="flex-row items-center gap-3 pb-3 pr-4">
      <BackButton href={returnTo ?? "/vocabulary"} />
      <View className="flex-1">{children}</View>
    </View>
  );
}

export function WordHeading({
  word,
  onSpeak,
}: {
  word: Word;
  onSpeak: () => void;
}) {
  const { t } = useTranslation(["sets"]);

  return (
    <View className="items-center gap-1">
      <Pressable onPress={onSpeak} hitSlop={12}>
        <Pinyin>{word.pinyin}</Pinyin>
      </Pressable>
      <Text className="font-nunito text-body text-text">
        {t(word.translation)}
      </Text>
    </View>
  );
}

export function TaskPill({
  action,
  children,
}: {
  /** Глагол: «Напиши», «Обведи», «Как пишется». */
  action: string;
  /** Что именно: пиньинь иероглифа или знак части. */
  children: ReactNode;
}) {
  return (
    <View className="min-h-14 flex-row items-center gap-3 rounded-full bg-surface px-6 py-2">
      <Text className="font-nunito text-lead text-text">{action}</Text>
      {children}
    </View>
  );
}

/** Пиньинь текущего иероглифа в TaskPill: нажатие — озвучка. */
export function TaskPinyin({
  pinyin,
  onSpeak,
}: {
  pinyin: string;
  onSpeak: () => void;
}) {
  return (
    <Pressable onPress={onSpeak} hitSlop={12}>
      <Pinyin size="lg">{pinyin}</Pinyin>
    </Pressable>
  );
}

/** Каждый иероглиф — либо эталон (strokes), либо линии пользователя (raw). */
export function WrittenChars({
  items,
}: {
  items: Array<{ strokes?: string[]; raw?: Point[][] }>;
}) {
  if (items.length === 0) return null;

  return (
    <View className="flex-row gap-2">
      {items.map((item, index) => (
        <HanziView
          key={`done${index}`}
          size={WRITTEN_SIZE}
          strokes={item.strokes}
          rawStrokes={item.raw}
        />
      ))}
    </View>
  );
}

function ComparisonRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <View className="items-center gap-1">
      <Text className="font-nunito text-small text-text opacity-70">
        {label}
      </Text>
      <View className="flex-row gap-3">{children}</View>
    </View>
  );
}

/** Эталон слова над написанием пользователя. */
export function ResultComparison({
  chars,
  raws,
  canvasSize,
}: {
  chars: HanziData[];
  /** Линии пользователя по каждому иероглифу слова. */
  raws: Point[][][];
  canvasSize: number;
}) {
  const { width } = useWindowDimensions();

  // Ширина строки: экран минус боковые отступы и промежутки между иероглифами.
  // Подписи «Эталон» и «Твоё» стоят над строками и ширину не занимают
  const size = Math.floor(
    Math.min(
      canvasSize / 2,
      (width - LESSON_SIDE_PADDING - RESULT_GAP * (chars.length - 1)) /
        chars.length,
    ),
  );

  return (
    <View className="items-center gap-3">
      <ComparisonRow label="Эталон">
        {chars.map((data, index) => (
          <HanziView key={`ref${index}`} size={size} strokes={data.strokes} />
        ))}
      </ComparisonRow>

      <ComparisonRow label="Твоё">
        {chars.map((_, index) => (
          <HanziView
            key={`raw${index}`}
            size={size}
            rawStrokes={raws[index] ?? []}
          />
        ))}
      </ComparisonRow>
    </View>
  );
}

export function PillButton({
  label,
  onPress,
  variant = "primary",
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
}) {
  const isPrimary = variant === "primary";

  return (
    <Pressable
      onPress={onPress}
      className={`min-h-12 justify-center rounded-full py-3 ${
        isPrimary ? "bg-primary px-8" : "bg-surface px-6"
      }`}
    >
      <Text
        className={`font-nunito text-body ${
          isPrimary ? "text-white" : "text-text"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
