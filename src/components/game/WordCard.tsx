// components/game/WordCard.tsx

import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

interface Props {
  hanzi: string;
  pinyin: string;
  translation: string;
}

export function WordCard({ hanzi, pinyin, translation }: Props) {
  const { t } = useTranslation();

  return (
    <View className="flex-row items-center p-4 justify-between bg-[#FCF7F3] rounded-xl gap-3">
      {/* Левый блок: Иероглифы */}
      <View className="w-28 shrink-0 pr-3 border-r border-textSecondary justify-center">
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          className="text-text font-chineseMedium text-3xl text-center"
        >
          {hanzi}
        </Text>
      </View>

      {/* Средний блок: Пиньинь и Перевод */}
      <View className="flex-1 min-w-0 justify-center py-1">
        <Text numberOfLines={1} className="text-primary font-medium truncate">
          {pinyin}
        </Text>
        <Text
          numberOfLines={2}
          className="text-text text-sm leading-tight mt-0.5"
        >
          {t(translation)}
        </Text>
      </View>

      {/* Правый блок: Иконка "+" с ИДЕАЛЬНЫМ центрированием */}
      <View className="shrink-0 ml-2 size-10 bg-textSecondary rounded-full items-center justify-center">
        <Text className="text-text text-lg leading-none -mt-0.5">+</Text>
      </View>
    </View>
  );
}
