// src/components/writing/PracticeChoiceModal.tsx
//
// Окно перед тренировкой письма: шапка с выбранным словом или иероглифом и уровнем изучения,
// выбор, что писать (у двусложного слова — слово целиком или один из иероглифов),
// переключатель «Повторение» и выбор формата (быстрая или полная тренировка).
//
// Анимация своя: затемнение плавно проявляется, панель выезжает снизу
// (пружина на открытие, timing на закрытие). Закрыть можно тапом по затемнению,
// кнопкой «назад» или свайпом панели вниз.
// Пока идёт анимация закрытия, окно показывает последнее слово (а не пустоту).

import FullPracticeIcon from "@/assets/images/icons/book-open.svg";
import ReviewIcon from "@/assets/images/icons/bookmark-plus.svg";
import ArrowRight from "@/assets/images/icons/chevron-right.svg";
import CheckIcon from "@/assets/images/icons/circle-check.svg";
import InfoIcon from "@/assets/images/icons/info.svg";
import FastPracticeIcon from "@/assets/images/icons/zap.svg";
import { Hanzi } from "@/components/ui/Hanzi";
import { Pinyin } from "@/components/ui/Pinyin";
import { Tooltip } from "@/components/ui/Tooltip";
import type { Word } from "@/content/flashcards/types";
import type { FreeFormat } from "@/utils/writingLessons";
import { cssInterop } from "nativewind";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  PanResponder,
  Pressable,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WritingDots } from "./HanziGrid";

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

const SCREEN_HEIGHT = Dimensions.get("window").height;

/** Свайп вниз: с какого сдвига (доля высоты панели) или скорости окно закрывается. */
const CLOSE_DISTANCE_RATIO = 0.25;
const CLOSE_VELOCITY = 0.8;
/** С какого сдвига пальца жест считается свайпом, а не тапом. */
const DRAG_START = 8;

interface PracticeChoiceModalProps {
  /** Слово из сетки; null — окно закрыто. */
  word: Word | null;
  /** Иероглифы двусложного слова для отдельной практики (у односложного — пусто). */
  characters: Word[];
  getLevel: (word: Word) => number;
  /** Слово или иероглиф в списке «Повторение». */
  isInReview: (word: Word) => boolean;
  onToggleReview: (word: Word) => void;
  onStart: (word: Word, format: FreeFormat) => void;
  onClose: () => void;
}

export function PracticeChoiceModal({
  word,
  characters,
  getLevel,
  isInReview,
  onToggleReview,
  onStart,
  onClose,
}: PracticeChoiceModalProps) {
  const { t } = useTranslation([WORDS_NAMESPACE]);
  const insets = useSafeAreaInsets();

  // Что показываем: держим последнее слово, пока окно уезжает
  const [shown, setShown] = useState<Word | null>(word);
  const [shownCharacters, setShownCharacters] = useState<Word[]>(characters);
  const [visible, setVisible] = useState(!!word);

  // Что тренировать: по умолчанию слово целиком
  const [target, setTarget] = useState<Word | null>(word);
  const [showHint, setShowHint] = useState(false);

  const backdrop = useRef(new Animated.Value(0)).current;
  const sheetY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // Высота панели — от неё считаем, насколько далеко утянули
  const sheetHeight = useRef(SCREEN_HEIGHT / 2);

  // onClose в жесте берём из ref: PanResponder создаётся один раз
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const panResponder = useRef(
    PanResponder.create({
      // Касание пустого места панели (фон, тексты, шапка) — жест сразу наш.
      // Кнопки и карточки забирают касание раньше, так что тапы по ним работают как обычно
      onStartShouldSetPanResponder: () => true,
      // Начали тянуть с кнопки или карточки — перехватываем, но только явное движение вниз
      onMoveShouldSetPanResponderCapture: (_, g) =>
        g.dy > DRAG_START && Math.abs(g.dy) > Math.abs(g.dx),
      // Пока тянем, не отдаём жест другим
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_, g) => {
        const dy = Math.max(0, g.dy);
        sheetY.setValue(dy);
        backdrop.setValue(1 - Math.min(1, dy / sheetHeight.current));
      },
      onPanResponderRelease: (_, g) => {
        const farEnough = g.dy > sheetHeight.current * CLOSE_DISTANCE_RATIO;
        const fastEnough = g.vy > CLOSE_VELOCITY;

        // Просто тап по пустому месту панели — закрываем тултип
        if (Math.abs(g.dy) < DRAG_START && Math.abs(g.dx) < DRAG_START) {
          setShowHint(false);
        }

        if (farEnough || fastEnough) {
          // Дальше окно уедет само (анимация закрытия в useEffect)
          onCloseRef.current();
          return;
        }

        // Не дотянули — возвращаем на место
        Animated.parallel([
          Animated.spring(sheetY, {
            toValue: 0,
            damping: 24,
            stiffness: 240,
            overshootClamping: true,
            useNativeDriver: true,
          }),
          Animated.timing(backdrop, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(sheetY, {
          toValue: 0,
          overshootClamping: true,
          useNativeDriver: true,
        }).start();
        backdrop.setValue(1);
      },
    }),
  ).current;

  useEffect(() => {
    if (word) {
      // Открытие: запоминаем слово, сама анимация стартует в onShow
      setShown(word);
      setShownCharacters(characters);
      setTarget(word);
      setShowHint(false);
      backdrop.setValue(0);
      sheetY.setValue(SCREEN_HEIGHT);
      setVisible(true);
      return;
    }

    if (!visible) return;

    // Закрытие: сначала уезжаем (в том числе с середины свайпа), потом убираем Modal
    Animated.parallel([
      Animated.timing(backdrop, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(sheetY, {
        toValue: SCREEN_HEIGHT,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setVisible(false);
        setShown(null);
      }
    });
    // characters берём в момент открытия; дальше они не меняются
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word]);

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(backdrop, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(sheetY, {
        toValue: 0,
        damping: 24,
        stiffness: 240,
        overshootClamping: true,
        useNativeDriver: true,
      }),
    ]).start();
  };

  if (!shown) return null;

  // В шапке — то, что выбрано: слово целиком или один иероглиф
  const selected = target ?? shown;
  const options = shownCharacters.length > 0 ? [shown, ...shownCharacters] : [];
  const inReview = isInReview(selected);

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      statusBarTranslucent
      onShow={animateIn}
      onRequestClose={onClose}
    >
      {/* Затемнение: тап закрывает окно */}
      <Animated.View
        className="absolute inset-0 bg-black/40"
        style={{ opacity: backdrop }}
      >
        <Pressable
          className="flex-1"
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Закрыть"
        />
      </Animated.View>

      <View className="flex-1 justify-end" pointerEvents="box-none">
        <Animated.View
          {...panResponder.panHandlers}
          onLayout={(event) => {
            sheetHeight.current = event.nativeEvent.layout.height;
          }}
          className="rounded-t-3xl bg-background px-5 pt-3"
          style={{
            paddingBottom: insets.bottom + 16,
            transform: [{ translateY: sheetY }],
          }}
        >
          {/* Ручка панели: подсказывает, что панель можно утянуть вниз */}
          <View className="mb-3 h-1 w-10 self-center rounded-full bg-text/20" />

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
                      {isSelected && (
                        <View className="absolute left-2 top-2"></View>
                      )}

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
              <View className="h-11 w-11 items-center justify-center rounded-full bg-primary">
                <Text className="font-nunitoBold text-title text-white">+</Text>
              </View>
            )}
          </Pressable>

          {/* Формат */}
          <Text className="mt-6 font-nunitoBold text-lead text-text">
            Как будем тренироваться?
          </Text>

          <View className="mt-3 gap-2">
            <Pressable
              onPress={() => onStart(selected, "quick")}
              className="min-h-14 flex-row items-center gap-4 rounded-2xl bg-primary px-5 py-4 active:opacity-80"
            >
              <FastPracticeIcon width={24} height={24} className="text-white" />
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
        </Animated.View>
      </View>
    </Modal>
  );
}
