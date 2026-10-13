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
import PlusIcon from "@/assets/images/icons/circle-plus.svg";
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
import { useMemo, useState, type ReactNode } from "react";
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
  PlusIcon,
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

/** Какой тултип открыт (одновременно — только один). */
type OpenHint = "level" | "exam" | null;

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

/**
 * Слот под иконку в карточках «Повторение» и «Экзамен»: одинаковый размер слева и справа,
 * чтобы карточки были одной высоты, какая бы иконка в них ни стояла.
 */
function IconSlot({ children }: { children?: ReactNode }) {
  return (
    <View className="h-8 w-8 items-center justify-center">{children}</View>
  );
}

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
function ExamCard({
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
  const [openHint, setOpenHint] = useState<OpenHint>(null);

  const toggleHint = (hint: Exclude<OpenHint, null>) =>
    setOpenHint((current) => (current === hint ? null : hint));
  const closeHint = () => setOpenHint(null);

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
        closeHint();
      }}
      onBackgroundTap={closeHint}
    >
      {({ word: shown, characters: shownCharacters }) => {
        // В шапке — то, что выбрано: слово целиком или один иероглиф
        const selected = target ?? shown;
        const options =
          shownCharacters.length > 0 ? [shown, ...shownCharacters] : [];
        const inReview = isInReview(selected);
        const selectedIsWord =
          shownCharacters.length > 0 &&
          selected.vocabularyId === shown.vocabularyId;

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
                visible={openHint === "level"}
                onClose={closeHint}
                text={LEVEL_HINT}
              >
                <Pressable
                  onPress={() => toggleHint("level")}
                  className="flex-row items-center gap-3 rounded-full bg-surface px-4 py-2 active:opacity-70"
                  accessibilityRole="button"
                  accessibilityState={{ expanded: openHint === "level" }}
                >
                  <WritingDots level={getLevel(selected)} />
                  <Text className="font-nunito text-small text-text">
                    Уровень изучения
                  </Text>
                  <InfoIcon width={18} height={18} className="text-primary" />
                </Pressable>
              </Tooltip>
            </View>

            {/* Двусложное слово: целиком или один иероглиф */}
            {options.length > 0 && (
              <View className="mt-4 gap-2">
                <Text className="font-nunitoBold text-lead text-text">
                  Что потренировать?
                </Text>

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
                          closeHint();
                        }}
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
            )}

            {/* «Повторение»: для выбранного слова или иероглифа (он же в шапке) */}
            <Pressable
              onPress={() => onToggleReview(selected)}
              className="mt-4 flex-row items-center gap-3 rounded-2xl bg-surface p-4 active:opacity-70"
              accessibilityRole="switch"
              accessibilityState={{ checked: inReview }}
            >
              <IconSlot>
                <ReviewIcon width={26} height={26} className="text-primary" />
              </IconSlot>

              <Text className="flex-1 font-nunitoBold text-body text-text">
                {inReview ? "В повторении" : "Добавить в повторение"}
              </Text>

              {/* Справа: «+» — добавить, галочка — уже в повторении */}
              <IconSlot>
                {inReview ? (
                  <CheckIcon width={28} height={28} className="text-primary" />
                ) : (
                  <PlusIcon width={28} height={28} className="text-primary" />
                )}
              </IconSlot>
            </Pressable>

            {/* Экзамен по выбранному слову или иероглифу — всегда на месте */}
            <ExamCard
              status={getExamStatus(selected)}
              now={now}
              isWord={selectedIsWord}
              onStart={() => onStartExam(selected)}
              hintVisible={openHint === "exam"}
              onToggleHint={() => toggleHint("exam")}
              onCloseHint={closeHint}
            />

            {/* Формат */}
            <Text className="mt-5 font-nunitoBold text-lead text-text">
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
