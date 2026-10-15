// src/components/ui/StepAccordion.tsx
//
// Карточка ступени — общая для карточек и «Написания»: шапка (стрелка, название,
// кнопка «Тренировать»), тонкая шкала «изучено / всего» и сворачиваемое содержимое
// (сетка слов приходит через children).
// Разворачивает тап по стрелке, названию или шкале. «Тренировать» — отдельная кнопка
// рядом (не внутри шапки): иначе при тапе по шапке она тоже «нажималась» бы.
// «Тренировать» работает и у свёрнутой ступени.

import ChevronIcon from "@/assets/images/icons/chevron-right.svg";
import { colors } from "@/theme/colors";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

/** Внутренний отступ карточки (px-4) с двух сторон: на столько сетке меньше места. */
export const STEP_ACCORDION_INSET = 32;

interface StepAccordionProps {
  title: string;
  /** Сколько слов изучено (3 точки). */
  learned: number;
  total: number;
  expanded: boolean;
  onToggle: () => void;
  onStart: () => void;
  /** Содержимое развёрнутой ступени (сетка слов). */
  children: ReactNode;
}

export function StepAccordion({
  title,
  learned,
  total,
  expanded,
  onToggle,
  onStart,
  children,
}: StepAccordionProps) {
  return (
    <View className="rounded-2xl bg-surface">
      <View className="gap-3 px-4 py-3">
        <View className="min-h-10 flex-row items-center gap-2">
          <Pressable
            onPress={onToggle}
            hitSlop={{ top: 12, bottom: 12, left: 16 }}
            className="min-h-10 flex-1 flex-row items-center gap-2 active:opacity-60"
            accessibilityRole="button"
            accessibilityState={{ expanded }}
            accessibilityLabel={`${title}: изучено ${learned} из ${total}`}
          >
            {/* Стрелка: вправо — свёрнута, вниз — развёрнута */}
            <View
              style={{ transform: [{ rotate: expanded ? "90deg" : "0deg" }] }}
            >
              <ChevronIcon
                width={24}
                height={24}
                color={colors.primary}
                strokeWidth={2.5}
              />
            </View>
            <Text className="flex-1 font-nunitoBold text-body text-text">
              {title}
            </Text>
          </Pressable>

          <Pressable
            onPress={onStart}
            hitSlop={6}
            className="min-h-10 justify-center rounded-full bg-primary px-4 active:opacity-80"
            accessibilityRole="button"
            accessibilityLabel={`Тренировать: ${title}`}
          >
            <Text className="font-nunitoBold text-small text-white">
              Тренировать
            </Text>
          </Pressable>
        </View>

        {/* Тонкая шкала: изучено / всего. Тоже разворачивает */}
        <Pressable
          onPress={onToggle}
          hitSlop={{ top: 8, bottom: 12 }}
          accessible={false}
        >
          <View className="h-1.5 overflow-hidden rounded-full bg-text/10">
            <View
              className="h-full rounded-full bg-primary"
              style={{ width: `${total > 0 ? (learned / total) * 100 : 0}%` }}
            />
          </View>
        </Pressable>
      </View>

      {expanded && <View className="px-4 pb-4">{children}</View>}
    </View>
  );
}
