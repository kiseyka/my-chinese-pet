// src/components/writing/modals/PracticeChoiceParts.tsx
//
// Блоки окна слова (PracticeChoiceModal), сверху вниз:
//   LevelPill — точки и «Уровень изучения» с подсказкой;
//   CharacterChoice — у двусложного слова: всё слово или один иероглиф;
//   ReviewToggleCard — добавить в «Повторение» / убрать;
//   ExamStatusCard — экзамен по слову (всегда на месте, одной высоты);
//   FormatButtons — быстрая или полная тренировка.

import FullPracticeIcon from "@/assets/images/icons/book-open.svg";
import ReviewIcon from "@/assets/images/icons/bookmark-plus.svg";
import ArrowRight from "@/assets/images/icons/chevron-right.svg";
import CheckIcon from "@/assets/images/icons/circle-check.svg";
import InfoIcon from "@/assets/images/icons/info.svg";
import FastPracticeIcon from "@/assets/images/icons/zap.svg";
import { Hanzi } from "@/components/ui/Hanzi";
import { Pinyin } from "@/components/ui/Pinyin";
import { Tooltip } from "@/components/ui/Tooltip";
import { IconSlot, ToggleCard } from "@/components/word/ToggleCard";
import type { Word } from "@/content/flashcards/types";
import { interopIconColor } from "@/lib/interopIcon";
import type { WritingExamStatus } from "@/store/wordProgressStore";
import { formatExamWait } from "@/utils/writing/labels";
import type { FreeFormat } from "@/utils/writing/plans";
import { Pressable, Text, View } from "react-native";
import { SealMark } from "../SealMark";
import { WritingDots } from "../home/WritingDots";

// Цвет SVG-иконок задаём через className (text-primary, text-white), а не хардкодом
interopIconColor(
  FullPracticeIcon,
  ReviewIcon,
  ArrowRight,
  CheckIcon,
  InfoIcon,
  FastPracticeIcon,
);

/** Текст тултипа у «Уровня изучения». */
const LEVEL_HINT =
  "Точка добавляется, когда пишешь иероглиф по памяти без подсказок. Ошибка забирает точку. Три точки — иероглиф изучен.";

// ── Уровень изучения ─────────────────────────────────────────────────────────

export function LevelPill({
  level,
  hintVisible,
  onToggleHint,
  onCloseHint,
}: {
  level: number;
  hintVisible: boolean;
  onToggleHint: () => void;
  onCloseHint: () => void;
}) {
  return (
    <View className="mt-3 self-center">
      <Tooltip visible={hintVisible} onClose={onCloseHint} text={LEVEL_HINT}>
        <Pressable
          onPress={onToggleHint}
          className="flex-row items-center gap-3 rounded-full bg-surface px-4 py-2 active:opacity-70"
          accessibilityRole="button"
          accessibilityState={{ expanded: hintVisible }}
        >
          <WritingDots level={level} />
          <Text className="font-nunito text-small text-text">
            Уровень изучения
          </Text>
          <InfoIcon width={18} height={18} className="text-primary" />
        </Pressable>
      </Tooltip>
    </View>
  );
}

// ── Что потренировать (двусложное слово) ─────────────────────────────────────

export function CharacterChoice({
  word,
  characters,
  selectedId,
  getLevel,
  onSelect,
}: {
  /** Слово целиком. */
  word: Word;
  /** Его иероглифы как отдельные слова. */
  characters: Word[];
  selectedId: string;
  getLevel: (word: Word) => number;
  onSelect: (option: Word) => void;
}) {
  const options = [word, ...characters];

  return (
    <View className="mt-4 gap-2">
      <Text className="font-nunitoBold text-lead text-text">
        Что потренировать?
      </Text>

      <View className="flex-row gap-2">
        {options.map((option) => {
          const isWhole = option === word;
          const isSelected = option.vocabularyId === selectedId;

          return (
            <Pressable
              key={option.vocabularyId}
              onPress={() => onSelect(option)}
              className={`flex-1 items-center gap-1 rounded-2xl border-2 px-2 py-2.5 active:opacity-70 ${
                isSelected
                  ? "border-primary bg-primary/20"
                  : "border-transparent bg-surface"
              }`}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
            >
              <Hanzi
                size="md"
                numberOfLines={1}
                adjustsFontSizeToFit
                maxFontSizeMultiplier={1.2}
              >
                {option.hanzi}
              </Hanzi>
              {isWhole ? (
                <Text className="font-nunito text-small text-text">
                  Всё слово
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
  );
}

// ── «Повторение» ─────────────────────────────────────────────────────────────

export function ReviewToggleCard({
  inReview,
  onToggle,
}: {
  inReview: boolean;
  onToggle: () => void;
}) {
  return (
    <ToggleCard
      className="mt-4"
      icon={<ReviewIcon width={26} height={26} className="text-primary" />}
      label={inReview ? "В повторении" : "Добавить в повторение"}
      checked={inReview}
      onPress={onToggle}
    />
  );
}

// ── Экзамен ──────────────────────────────────────────────────────────────────

/** Текст тултипа у карточки экзамена (когда экзамен сдан или пока закрыт). */
function examHint(
  status: WritingExamStatus,
  now: number,
  isWord: boolean,
): string {
  switch (status.status) {
    case "passed":
      return `Умничка! ${
        isWord ? "Слово успешно написано" : "Иероглиф успешно написан"
      } на экзамене.`;
    case "unavailable":
      return "Заработай три точки — и на следующий день откроется экзамен.";
    case "cooldown":
      return `Три точки есть! Экзамен откроется ${formatExamWait(
        status.availableAt,
        now,
      )}.`;
    default:
      return "После двух провалов подряд точку нужно заработать снова. Набери три точки — и на следующий день экзамен откроется.";
  }
}

/**
 * Карточка экзамена. Всегда на месте и всегда одной высоты, чтобы интерфейс не прыгал:
 * готово — активная кнопка; сдано — галочка и «i»; иначе — неактивная кнопка и «i».
 */
export function ExamStatusCard({
  status,
  now,
  isWord,
  onStart,
  hintVisible,
  onToggleHint,
  onCloseHint,
}: {
  status: WritingExamStatus;
  now: number;
  /** Выбрано слово целиком (для текста подсказки). */
  isWord: boolean;
  onStart: () => void;
  hintVisible: boolean;
  onToggleHint: () => void;
  onCloseHint: () => void;
}) {
  if (status.status === "ready") {
    return (
      <Pressable
        onPress={onStart}
        className="mt-3 flex-row items-center gap-3 rounded-2xl bg-surface p-4 active:opacity-70"
        accessibilityRole="button"
      >
        <IconSlot>
          <SealMark size={28} />
        </IconSlot>
        <Text className="flex-1 font-nunitoBold text-body text-text">
          Сдать экзамен
        </Text>
        <IconSlot>
          <ArrowRight width={20} height={20} className="text-text" />
        </IconSlot>
      </Pressable>
    );
  }

  const passed = status.status === "passed";

  // Сдано или пока закрыто: справа «i» с подсказкой.
  // Тултип привязан ко всей карточке, чтобы вставал по центру и не вылезал за края экрана.
  return (
    <View className="mt-3">
      <Tooltip
        visible={hintVisible}
        onClose={onCloseHint}
        text={examHint(status, now, isWord)}
      >
        <View
          className="flex-row items-center gap-3 rounded-2xl bg-surface p-4"
          accessibilityState={{ disabled: !passed }}
        >
          <View
            className={`flex-1 flex-row items-center gap-3 ${
              passed ? "" : "opacity-50"
            }`}
          >
            <IconSlot>
              {passed ? (
                <CheckIcon width={28} height={28} className="text-primary" />
              ) : (
                <SealMark size={28} />
              )}
            </IconSlot>
            <Text className="flex-1 font-nunitoBold text-body text-text">
              {passed ? "Экзамен сдан" : "Сдать экзамен"}
            </Text>
          </View>

          <Pressable
            onPress={onToggleHint}
            hitSlop={12}
            className="active:opacity-70"
            accessibilityRole="button"
            accessibilityLabel={
              passed ? "Об экзамене" : "Когда откроется экзамен"
            }
            accessibilityState={{ expanded: hintVisible }}
          >
            <IconSlot>
              <InfoIcon width={28} height={28} className="text-primary" />
            </IconSlot>
          </Pressable>
        </View>
      </Tooltip>
    </View>
  );
}

// ── Формат тренировки ────────────────────────────────────────────────────────

export function FormatButtons({
  onStart,
}: {
  onStart: (format: FreeFormat) => void;
}) {
  return (
    <>
      <Text className="mt-5 font-nunitoBold text-lead text-text">
        Как будем тренироваться?
      </Text>

      <View className="mt-3 gap-2">
        <Pressable
          onPress={() => onStart("quick")}
          className="min-h-14 flex-row items-center gap-4 rounded-2xl bg-primary px-5 py-4 active:opacity-80"
        >
          <FastPracticeIcon width={24} height={24} className="text-white" />
          <Text className="flex-1 font-nunitoBold text-body text-white">
            Быстрая тренировка
          </Text>
          <ArrowRight width={20} height={20} className="text-white" />
        </Pressable>

        <Pressable
          onPress={() => onStart("full")}
          className="min-h-14 flex-row items-center gap-4 rounded-2xl border border-primary/30 bg-surface px-5 py-4 active:opacity-70"
        >
          <FullPracticeIcon width={24} height={24} className="text-primary" />
          <Text className="flex-1 font-nunitoBold text-body text-text">
            Полная тренировка
          </Text>
          <ArrowRight width={20} height={20} className="text-text" />
        </Pressable>
      </View>
    </>
  );
}
