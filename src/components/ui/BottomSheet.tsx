// src/components/ui/BottomSheet.tsx
//
// Нижняя панель поверх экрана: затемнение плавно проявляется, панель выезжает снизу
// (пружина на открытие, timing на закрытие). Закрыть можно тапом по затемнению,
// кнопкой «назад» или свайпом панели вниз.
//
// Панель не выше экрана: если содержимое не помещается, оно прокручивается.
// Свайп вниз закрывает панель, только когда содержимое прокручено до самого верха
// (иначе палец листает список). За ручку панель можно утянуть всегда.
//
// Панель открыта, пока item не null. Пока идёт анимация закрытия, содержимое
// рисуется по последнему item (а не пустота). Содержимое передаётся функцией:
// children(item).

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SCREEN_HEIGHT = Dimensions.get("window").height;

/** Боковые отступы панели (px-5) с двух сторон: на столько содержимому меньше места. */
export const SHEET_HORIZONTAL_INSET = 40;

/** Сколько места оставить над панелью, когда она во весь экран. */
const TOP_GAP = 24;

/** Свайп вниз: с какого сдвига (доля высоты панели) или скорости окно закрывается. */
const CLOSE_DISTANCE_RATIO = 0.25;
const CLOSE_VELOCITY = 0.8;
/** С какого сдвига пальца жест считается свайпом, а не тапом. */
const DRAG_START = 8;

interface BottomSheetProps<T> {
  /** Что показываем; null — панель закрыта. */
  item: T | null;
  onClose: () => void;
  /** Вызывается при каждом открытии — например, сбросить выбор внутри панели. */
  onOpen?: (item: T) => void;
  /** Тап по пустому месту панели (не по кнопкам) — например, закрыть тултип. */
  onBackgroundTap?: () => void;
  children: (item: T) => ReactNode;
}

export function BottomSheet<T>({
  item,
  onClose,
  onOpen,
  onBackgroundTap,
  children,
}: BottomSheetProps<T>) {
  const insets = useSafeAreaInsets();

  // Что показываем: держим последний item, пока панель уезжает
  const [shown, setShown] = useState<T | null>(item);
  const [visible, setVisible] = useState(!!item);

  const backdrop = useRef(new Animated.Value(0)).current;
  const sheetY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // Высота панели — от неё считаем, насколько далеко утянули
  const sheetHeight = useRef(SCREEN_HEIGHT / 2);

  // Насколько прокручено содержимое: свайп закрывает панель, только если оно наверху
  const scrollY = useRef(0);
  const scrollRef = useRef<ScrollView>(null);

  // Панель уже тянут вниз: жест не отдаём прокрутке
  const isDragging = useRef(false);

  // Колбэки в жесте и эффекте берём из ref: PanResponder создаётся один раз
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;
  const onBackgroundTapRef = useRef(onBackgroundTap);
  onBackgroundTapRef.current = onBackgroundTap;

  const springBack = () => {
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
  };

  const panResponder = useRef(
    PanResponder.create({
      // Касание пустого места панели (фон, тексты, шапка) — жест сразу наш.
      // Кнопки и карточки забирают касание раньше, так что тапы по ним работают как обычно
      onStartShouldSetPanResponder: () => true,
      // Тянут вниз (в том числе с кнопки или карточки) — перехватываем,
      // но только если содержимое прокручено до верха; иначе это прокрутка списка
      onMoveShouldSetPanResponderCapture: (_, g) =>
        scrollY.current <= 0 &&
        g.dy > DRAG_START &&
        Math.abs(g.dy) > Math.abs(g.dx),
      // Пока панель тянут, не отдаём жест; до этого — отдаём (например, прокрутке)
      onPanResponderTerminationRequest: () => !isDragging.current,
      onPanResponderGrant: () => {
        isDragging.current = false;
      },
      onPanResponderMove: (_, g) => {
        const dy = Math.max(0, g.dy);
        if (dy > DRAG_START) isDragging.current = true;
        sheetY.setValue(dy);
        backdrop.setValue(1 - Math.min(1, dy / sheetHeight.current));
      },
      onPanResponderRelease: (_, g) => {
        isDragging.current = false;

        const farEnough = g.dy > sheetHeight.current * CLOSE_DISTANCE_RATIO;
        const fastEnough = g.vy > CLOSE_VELOCITY;

        // Просто тап по пустому месту панели
        if (Math.abs(g.dy) < DRAG_START && Math.abs(g.dx) < DRAG_START) {
          onBackgroundTapRef.current?.();
        }

        if (farEnough || fastEnough) {
          // Дальше панель уедет сама (анимация закрытия в useEffect)
          onCloseRef.current();
          return;
        }

        // Не дотянули — возвращаем на место
        springBack();
      },
      onPanResponderTerminate: () => {
        isDragging.current = false;
        springBack();
      },
    }),
  ).current;

  useEffect(() => {
    if (item) {
      // Открытие: запоминаем item, сама анимация стартует в onShow
      setShown(item);
      onOpenRef.current?.(item);
      scrollY.current = 0;
      scrollRef.current?.scrollTo({ y: 0, animated: false });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

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

  if (shown === null) return null;

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
          className="rounded-t-3xl bg-background pt-3"
          style={{
            maxHeight: SCREEN_HEIGHT - insets.top - TOP_GAP,
            transform: [{ translateY: sheetY }],
          }}
        >
          {/* Ручка панели: подсказывает, что панель можно утянуть вниз */}
          <View className="mb-3 h-1 w-10 self-center rounded-full bg-text/20" />

          {/* Содержимое: прокручивается, если не помещается */}
          <ScrollView
            ref={scrollRef}
            style={{ flexGrow: 0 }}
            contentContainerStyle={{
              paddingHorizontal: SHEET_HORIZONTAL_INSET / 2,
              paddingBottom: insets.bottom + 16,
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
            overScrollMode="never"
            scrollEventThrottle={16}
            onScroll={(event) => {
              scrollY.current = event.nativeEvent.contentOffset.y;
            }}
          >
            {children(shown)}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
