// src/components/writing/home/ReviewCard.tsx
//
// Вход в «Повторение» (карточки и «Написание»): компактная строка — значок,
// название и сколько слов отмечено. Сами слова и кнопка старта — в панели.

import ReviewIcon from "@/assets/images/icons/bookmark.svg";
import { EntryRow } from "@/components/ui/EntryRow";
import { colors } from "@/theme/colors";
import { pluralWords } from "@/utils/writing/labels";
import { View } from "react-native";

interface ReviewCardProps {
  /** Сколько слов отмечено для повтора. */
  total: number;
  onPress: () => void;
}

export function ReviewCard({ total, onPress }: ReviewCardProps) {
  return (
    <EntryRow
      icon={
        <View className="h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
          <ReviewIcon width={18} height={18} color={colors.primary} />
        </View>
      }
      title="Повторение"
      value={`${total} ${pluralWords(total)}`}
      onPress={onPress}
    />
  );
}
