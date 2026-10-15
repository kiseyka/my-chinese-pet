// src/components/word/ToggleCard.tsx
//
// Карточка-переключатель в панели слова — в виде «Добавить в повторение» из «Написания»:
// слева значок (необязательно), название жирным, справа «+» или галочка.
// Используется и для «Повторения», и для своих наборов (карточки и «Написание»).

import CheckIcon from "@/assets/images/icons/circle-check.svg";
import PlusIcon from "@/assets/images/icons/circle-plus.svg";
import { interopIconColor } from "@/lib/interopIcon";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

interopIconColor(CheckIcon, PlusIcon);

interface ToggleCardProps {
  label: string;
  checked: boolean;
  onPress: () => void;
  /** Значок слева, до 32px. */
  icon?: ReactNode;
  className?: string;
}

/** Слот под иконку: одинаковый размер слева и справа, карточки одной высоты. */
export function IconSlot({ children }: { children?: ReactNode }) {
  return (
    <View className="h-8 w-8 items-center justify-center">{children}</View>
  );
}

export function ToggleCard({
  label,
  checked,
  onPress,
  icon,
  className = "",
}: ToggleCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-3 rounded-2xl bg-surface p-4 active:opacity-70 ${className}`}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
    >
      {icon && <IconSlot>{icon}</IconSlot>}

      <Text
        numberOfLines={1}
        className="flex-1 font-nunitoBold text-body text-text"
      >
        {label}
      </Text>

      {/* Справа: «+» — добавить, галочка — уже добавлено */}
      <IconSlot>
        {checked ? (
          <CheckIcon width={28} height={28} className="text-primary" />
        ) : (
          <PlusIcon width={28} height={28} className="text-primary" />
        )}
      </IconSlot>
    </Pressable>
  );
}
