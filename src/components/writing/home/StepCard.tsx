// src/components/writing/home/StepCard.tsx
//
// Карточка ступени: название, шкала «изучено / всего» и сворачиваемая сетка слов
// (приходит через children) на общем фоне с шапкой.

import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

/** Внутренний отступ карточки (px-4) с двух сторон: на столько сетке внутри меньше места. */
export const STEP_CARD_INSET = 32;

interface StepCardProps {
  title: string;
  /** Сколько слов ступени изучено. */
  learned: number;
  /** Сколько всего слов в ступени. */
  total: number;
  expanded: boolean;
  onToggle: () => void;
  /** Сетка слов ступени. */
  children: ReactNode;
}

export function StepCard({
  title,
  learned,
  total,
  expanded,
  onToggle,
  children,
}: StepCardProps) {
  const percent = total > 0 ? Math.round((learned / total) * 100) : 0;

  return (
    <View className="rounded-2xl bg-surface">
      <Pressable
        onPress={onToggle}
        className="gap-3 px-4 py-4 active:opacity-70"
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${title}: изучено ${learned} из ${total}`}
      >
        <View className="flex-row items-center justify-between">
          <Text className="font-nunitoBold text-body text-text">{title}</Text>
          <View className="flex-row items-center gap-2">
            <Text className="font-nunito text-small text-textSecondary">
              {learned}/{total}
            </Text>
            <Text className="font-nunito text-body text-textSecondary">
              {expanded ? "▴" : "▾"}
            </Text>
          </View>
        </View>

        {/* Шкала: изучено / всего */}
        <View className="h-1.5 overflow-hidden rounded-full bg-text/10">
          <View
            className="h-full rounded-full bg-primary"
            style={{ width: `${percent}%` }}
          />
        </View>
      </Pressable>

      {expanded && <View className="px-4 pb-4">{children}</View>}
    </View>
  );
}
