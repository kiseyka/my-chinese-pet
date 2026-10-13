// src/components/writing/home/ExamEntryCard.tsx
//
// Вход в экзамен на экране «Написание»:
//   есть готовые слова — карточка с печатью, по тапу открывается ExamModal;
//   готовых нет, но скоро будут — строка «Следующий экзамен через …»;
//   иначе ничего.

import ArrowRight from "@/assets/images/icons/chevron-right.svg";
import { interopIconColor } from "@/lib/interopIcon";
import { formatExamWait } from "@/utils/writing/labels";
import { Pressable, Text, View } from "react-native";
import { SealMark } from "../SealMark";

interopIconColor(ArrowRight);

interface ExamEntryCardProps {
  /** Сколько слов готово к экзамену прямо сейчас. */
  readyCount: number;
  /** Когда откроется ближайший экзамен (если готовых нет). */
  nextAvailableAt?: number;
  now: number;
  onPress: () => void;
}

export function ExamEntryCard({
  readyCount,
  nextAvailableAt,
  now,
  onPress,
}: ExamEntryCardProps) {
  if (readyCount > 0) {
    return (
      <Pressable
        onPress={onPress}
        className="flex-row items-center gap-4 rounded-2xl bg-surface px-4 py-4 active:opacity-70"
        accessibilityRole="button"
      >
        <SealMark size={36} />
        <View className="flex-1 gap-0.5">
          <Text className="font-nunitoBold text-lead text-text">Экзамен</Text>
          <Text className="font-nunito text-small text-text opacity-70">
            Готово слов: {readyCount}
          </Text>
        </View>
        <ArrowRight width={20} height={20} className="text-text" />
      </Pressable>
    );
  }

  if (nextAvailableAt !== undefined) {
    return (
      <Text className="font-nunito text-small text-text opacity-60">
        Следующий экзамен {formatExamWait(nextAvailableAt, now)}
      </Text>
    );
  }

  return null;
}
