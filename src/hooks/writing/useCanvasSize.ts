// src/hooks/writing/useCanvasSize.ts

import { useWindowDimensions } from "react-native";

/** Отступы экрана урока по бокам (px-4 с двух сторон). */
export const LESSON_SIDE_PADDING = 32;

/** Сторона большого холста для письма: по ширине экрана, но не больше 340 и ~38% высоты. */
export function useCanvasSize() {
  const { width, height } = useWindowDimensions();
  return Math.min(width - LESSON_SIDE_PADDING, 340, Math.round(height * 0.38));
}
