// src/hooks/useSharedLevelScroll.ts
//
// Вкладка «Ступени» держит по списку на каждый раздел HSK, в который уже заходили
// (переключение мгновенное). Но у каждого списка своя шапка с чипсами — и своя прокрутка.
// Без синхронизации при смене раздела новая шапка показывалась со своей прокруткой:
// полоса чипсов «скакала» вбок и вверх-вниз.
//
// Здесь одна общая прокрутка на все разделы вкладки:
//   y — вертикальная прокрутка видимого списка,
//   x — прокрутка полосы чипсов.
// Видимый список и его чипсы записывают сюда свою прокрутку, а показанный
// раздел сразу встаёт в то же место.

import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import type {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
} from "react-native";

export interface SharedScroll {
  x: number;
  y: number;
}

/** Одна общая прокрутка на вкладку (живёт, пока смонтирована вкладка). */
export function useSharedScroll(): SharedScroll {
  return useRef<SharedScroll>({ x: 0, y: 0 }).current;
}

type Scrollable = FlatList<any> | ScrollView;

/**
 * Синхронизирует прокрутку одного списка/полосы с общей.
 * axis — какую ось берём (y для списка ступеней, x для чипсов).
 */
export function useSyncedScroll(
  ref: RefObject<Scrollable | null>,
  visible: boolean,
  shared: SharedScroll | undefined,
  axis: "x" | "y",
) {
  // Первый показ: сразу с общей прокрутки, без прыжка
  const [initial] = useState(() => (shared ? shared[axis] : 0));

  // Повторный показ спрятанного раздела: встаём туда же, где был видимый
  const wasVisible = useRef(visible);
  useLayoutEffect(() => {
    if (shared && visible && !wasVisible.current) {
      const offset = shared[axis];
      const node = ref.current;
      if (node && "scrollToOffset" in node) {
        node.scrollToOffset({ offset, animated: false });
      } else if (node) {
        node.scrollTo(
          axis === "x" ? { x: offset, animated: false } : { y: offset, animated: false },
        );
      }
    }
    wasVisible.current = visible;
  }, [visible, shared, axis, ref]);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (shared && visible) shared[axis] = event.nativeEvent.contentOffset[axis];
  };

  return {
    onScroll,
    scrollEventThrottle: 16,
    contentOffset: axis === "x" ? { x: initial, y: 0 } : { x: 0, y: initial },
  };
}
