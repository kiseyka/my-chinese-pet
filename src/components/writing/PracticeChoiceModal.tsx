// src/components/writing/PracticeChoiceModal.tsx
//
// Окно перед тренировкой письма: шапка с выбранным словом или иероглифом и уровнем изучения,
// выбор, что писать (у двусложного слова — слово целиком или один из иероглифов),
// переключатель «Повторение», экзамен по выбранному слову и выбор формата
// (быстрая или полная тренировка).
//
// Панель, анимации и свайп — в BottomSheet; здесь только содержимое.

import FullPracticeIcon from "@/assets/images/icons/book-open.svg";
import ReviewIcon from "@/assets/images/icons/bookmark-plus.svg";
import ArrowRight from "@/assets/images/icons/chevron-right.svg";
import CheckIcon from "@/assets/images/icons/circle-check.svg";
import InfoIcon from "@/assets/images/icons/info.svg";
import FastPracticeIcon from "@/assets/images/icons/zap.svg";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Hanzi } from "@/components/ui/Hanzi";
import { Pinyin } from "@/components/ui/Pinyin";
import { Tooltip } from "@/components/ui/Tooltip";
import type { Word } from "@/content/flashcards/types";
import type { WritingExamStatus } from "@/store/wordProgressStore";
import type { FreeFormat } from "@/utils/writingLessons";
import { cssInterop } from "nativewind";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { formatExamWait } from "./ExamModal";
import { WritingDots } from "./HanziGrid";
import { SealMark } from "./SealMark";

// Цвет SVG-иконок задаём через className (text-primary, text-white), а не хардкодом
for (const Icon of [
  FullPracticeIcon,
  ReviewIcon,
  ArrowRight,
  CheckIcon,
  InfoIcon,
  FastPracticeIcon,
]) {
  cssInterop(Icon, {
    className: { target: "style", nativeStyleToProp: { color: true } },
  });
}

/** Текст тултипа у «Уровня изучения». */
const LEVEL_HINT =
  "Точка добавляется, когда пишешь иероглиф по памяти без подсказок. Ошибка забирает точку. Три точки — иероглиф изучен.";

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
  /** Статус экзамена по письму для слова или иероглифа. */
  getExamStatus: (word: Word) => WritingExamStatus;
  /** Текущее время — для «экзамен через 9 ч». */
  now: number;
  onStartExam: (word: Word) => void;
  onStart: (word: Word, format: FreeFormat) => void;
  onClose: () => void;
}

/** Что показывает панель: слово и его иероглифы (снимок на момент открытия). */
interface SheetItem {
  word: Word;
  characters: Word[];
}

/** Карточка экзамена: активная, если готово; приглушённая — если ждём; печать — если сдано. */
function ExamCard({
  status,
  now,
  onStart,
}: {
  status: WritingExamStatus;
  now: number;
  onStart: () => void;
}) {
  if (status.status === "unavailable") return null;

  if (status.status === "ready") {
    return (
      <Pressable
        onPress={onStart}
        className="mt-3 flex-row items-center gap-3 rounded-2xl  bg-surface p-4 active:opacity-70"
        accessibilityRole="button"
      >
        <SealMark size={30} />
        <View className="flex-1 gap-0.5">
          <Text className="font-nunitoBold text-body text-text">
            Сдать экзамен
          </Text>
          <Text className="font-nunito text-small text-text opacity-70">
            По памяти, без контура и подсказок
          </Text>
        </View>
        <ArrowRight width={20} height={20} className="text-text" />
      </Pressable>
    );
  }

  const text =
    status.status === "passed"
      ? { title: "Экзамен сдан", subtitle: null }
      : status.status === "cooldown"
        ? {
            title: `Экзамен ${formatExamWait(status.availableAt, now)}`,
            subtitle: "Открывается через сутки после третьей точки",
          }
        : {
            title: "Экзамен откроется после новой точки",
            subtitle: "После двух провалов подряд точку нужно заработать снова",
          };

  return (
    <View
      className={`mt-3 flex-row items-center gap-3 rounded-2xl bg-surface p-4 ${
        status.status === "passed" ? "" : "opacity-60"
      }`}
    >
      {status.status === "passed" ? (
        <CheckIcon width={30} height={30} className="text-primary" />
      ) : (
        <SealMark size={30} />
      )}
      <View className="flex-1 gap-0.5">
        <Text className="font-nunitoBold text-body text-text">
          {text.title}
        </Text>
        {text.subtitle && (
          <Text className="font-nunito text-small text-text opacity-70">
            {text.subtitle}
          </Text>
        )}
      </View>
    </View>
  );
}

export function PracticeChoiceModal({
  word,
  characters,
  getLevel,
  isInReview,
  onToggleReview,
  getExamStatus,
  now,
  onStartExam,
  onStart,
  onClose,
}: PracticeChoiceModalProps) {
  const { t } = useTranslation([WORDS_NAMESPACE]);

  // Что тренировать: при открытии — слово целиком
  const [target, setTarget] = useState<Word | null>(word);
  const [showHint, setShowHint] = useState(false);

  // characters в родителе пересчитываются только при смене слова, так что item стабилен
  const item = useMemo<SheetItem | null>(
    () => (word ? { word, characters } : null),
    [word, characters],
  );

  return (
    <BottomSheet
      item={item}
      onClose={onClose}
      onOpen={(opened) => {
        setTarget(opened.word);
        setShowHint(false);
      }}
      onBackgroundTap={() => setShowHint(false)}
    >
      {({ word: shown, characters: shownCharacters }) => {
        // В шапке — то, что выбрано: слово целиком или один иероглиф
        const selected = target ?? shown;
        const options =
          shownCharacters.length > 0 ? [shown, ...shownCharacters] : [];
        const inReview = isInReview(selected);

        return (
          <>
            {/* Шапка: выбранное слово или иероглиф */}
            <View className="items-center gap-1">
              <Hanzi size="lg">{selected.hanzi}</Hanzi>
              <Pinyin size="md">{selected.pinyin}</Pinyin>
              <Text
                className="text-center font-nunito text-body text-text"
                numberOfLines={2}
              >
                {t(selected.translation)}
              </Text>
            </View>

            {/* Уровень изучения: по тапу — тултип, как зарабатывать точки */}
            <View className="mt-3 self-center">
              <Tooltip
                visible={showHint}
                onClose={() => setShowHint(false)}
                text={LEVEL_HINT}
              >
                <Pressable
                  onPress={() => setShowHint((value) => !value)}
                  className="flex-row items-center gap-3 rounded-full bg-surface px-4 py-2 active:opacity-70"
                  accessibilityRole="button"
                  accessibilityState={{ expanded: showHint }}
                >
                  <WritingDots level={getLevel(selected)} />
                  <Text className="font-nunito text-small text-text">
                    Уровень изучения
                  </Text>
                  <InfoIcon width={18} height={18} className="text-text" />
                </Pressable>
              </Tooltip>
            </View>

            {/* Двусложное слово: целиком или один иероглиф */}
            {options.length > 0 && (
              <View className="mt-6 gap-3">
                <View className="gap-0.5">
                  <Text className="font-nunitoBold text-lead text-text">
                    Что потренировать?
                  </Text>
                  <Text className="font-nunito text-small text-text opacity-70">
                    Выбери иероглиф или всё слово
                  </Text>
                </View>

                <View className="flex-row gap-2">
                  {options.map((option) => {
                    const isWhole = option === shown;
                    const isSelected =
                      option.vocabularyId === selected.vocabularyId;

                    return (
                      <Pressable
                        key={option.vocabularyId}
                        onPress={() => {
                          setTarget(option);
                          setShowHint(false);
                        }}
                        className={`flex-1 items-center gap-1 rounded-2xl border-2 px-2 py-4 active:opacity-70 ${
                          isSelected
                            ? "border-primary bg-primary/20"
                            : "border-transparent bg-surface"
                        }`}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: isSelected }}
                      >
                        <Hanzi
                          size="lg"
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
            )}

            {/* «Повторение»: для выбранного слова или иероглифа (он же в шапке) */}
            <Pressable
              onPress={() => onToggleReview(selected)}
              className="mt-5 flex-row items-center gap-3 rounded-2xl bg-surface p-4 active:opacity-70"
              accessibilityRole="switch"
              accessibilityState={{ checked: inReview }}
            >
              <ReviewIcon width={26} height={26} className="text-primary" />

              <View className="flex-1 gap-0.5">
                <Text className="font-nunitoBold text-body text-text">
                  {inReview ? "В повторении" : "Добавить в повторение"}
                </Text>
                <Text className="font-nunito text-small text-text opacity-70">
                  {inReview
                    ? "Нажми, чтобы убрать из раздела «Повторение»"
                    : "Появится в разделе «Повторение» для тренировки позже"}
                </Text>
              </View>

              {/* Справа: «+» — добавить, галочка — уже в повторении */}
              {inReview ? (
                <View className="h-11 w-11 items-center justify-center">
                  <CheckIcon width={30} height={30} className="text-primary" />
                </View>
              ) : (
                <View className="h-9 w-9 items-center justify-center rounded-full bg-primary">
                  <Text className="font-nunitoBold text-title text-white">
                    +
                  </Text>
                </View>
              )}
            </Pressable>

            {/* Экзамен по выбранному слову или иероглифу */}
            <ExamCard
              status={getExamStatus(selected)}
              now={now}
              onStart={() => onStartExam(selected)}
            />

            {/* Формат */}
            <Text className="mt-6 font-nunitoBold text-lead text-text">
              Как будем тренироваться?
            </Text>

            <View className="mt-3 gap-2">
              <Pressable
                onPress={() => onStart(selected, "quick")}
                className="min-h-14 flex-row items-center gap-4 rounded-2xl bg-primary px-5 py-4 active:opacity-80"
              >
                <FastPracticeIcon
                  width={24}
                  height={24}
                  className="text-white"
                />
                <Text className="flex-1 font-nunitoBold text-body text-white">
                  Быстрая тренировка
                </Text>
                <ArrowRight width={20} height={20} className="text-white" />
              </Pressable>

              <Pressable
                onPress={() => onStart(selected, "full")}
                className="min-h-14 flex-row items-center gap-4 rounded-2xl border border-primary/30 bg-surface px-5 py-4 active:opacity-70"
              >
                <FullPracticeIcon
                  width={24}
                  height={24}
                  className="text-primary"
                />
                <Text className="flex-1 font-nunitoBold text-body text-text">
                  Полная тренировка
                </Text>
                <ArrowRight width={20} height={20} className="text-text" />
              </Pressable>
            </View>
          </>
        );
      }}
    </BottomSheet>
  );
}
