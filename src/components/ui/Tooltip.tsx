// src/components/ui/Tooltip.tsx
//
// Тултип: пузырь с текстом и стрелкой под (или над) элементом-якорем.
// Якорь передаётся детьми; показом управляет родитель (visible / onClose).
// Пузырь лежит поверх соседних блоков, поэтому у обёртки высокий zIndex — только пока
// он открыт: иначе у двух тултипов подряд (например, уровень и точки) zIndex одинаковый,
// и нижний блок перекрывал пузырь верхнего.
// zIndex действует только среди соседей: если тултип вложен в обёртку,
// обёртке тоже нужен zIndex, пока тултип открыт (TOOLTIP_RAISED).
// Закрывается тапом по самому пузырю; остальное (тап по якорю, по фону) решает родитель.

import { useEffect, useRef, type ReactNode } from "react";
import { Animated, Pressable, Text, View } from "react-native";

interface TooltipProps {
  /** Элемент, к которому привязан тултип (например, кнопка с «i»). */
  children: ReactNode;
  text: string;
  visible: boolean;
  onClose: () => void;
  /** Где показать пузырь относительно якоря. */
  placement?: "top" | "bottom";
  /** Ширина пузыря; центрируется по якорю. */
  width?: number;
}

const GAP = 10;

/** Стиль для обёртки вокруг открытого тултипа: поднять её над соседями. */
export const TOOLTIP_RAISED = { zIndex: 50, elevation: 50 } as const;

export function Tooltip({
  children,
  text,
  visible,
  onClose,
  placement = "bottom",
  width = 260,
}: TooltipProps) {
  const appear = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      appear.setValue(0);
      return;
    }
    Animated.timing(appear, {
      toValue: 1,
      duration: 160,
      useNativeDriver: true,
    }).start();
  }, [visible, appear]);

  const isBottom = placement === "bottom";
  const shift = appear.interpolate({
    inputRange: [0, 1],
    outputRange: [isBottom ? -6 : 6, 0],
  });

  return (
    <View style={visible ? TOOLTIP_RAISED : undefined}>
      {children}

      {visible && (
        <Animated.View
          style={[
            {
              position: "absolute",
              left: "50%",
              marginLeft: -width / 2,
              width,
              opacity: appear,
              transform: [{ translateY: shift }],
            },
            isBottom
              ? { top: "100%", marginTop: GAP }
              : { bottom: "100%", marginBottom: GAP },
          ]}
        >
          <Pressable
            onPress={onClose}
            className="rounded-2xl bg-text px-4 py-3"
            accessibilityRole="button"
            accessibilityLabel="Закрыть подсказку"
            accessibilityLiveRegion="polite"
          >
            {/* Стрелка к якорю */}
            <View
              className="absolute h-3 w-3 self-center rotate-45 bg-text"
              style={isBottom ? { top: -5 } : { bottom: -5 }}
            />
            <Text className="font-nunito text-small text-background">
              {text}
            </Text>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}
