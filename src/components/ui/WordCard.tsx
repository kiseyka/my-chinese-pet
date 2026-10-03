// components/ui/WordCard.tsx  (в модалке он импортируется из ui, поправь путь, если он другой)

import VolumeOnIcon from "@/assets/images/icons/volume.svg";
import { FavoriteButton } from "@/components/ui/FavoriteButton";
import { LevelDots, type WordLevel } from "@/components/ui/LevelDots";
import { useSpeakHanzi } from "@/hooks/useSpeakHanzi";
import { useTranslation } from "react-i18next";
import { Text, TouchableOpacity, View } from "react-native";

interface Props {
  hanzi: string;
  pinyin: string;
  translation: string;

  isFavorite: boolean;
  onToggleFavorite: () => void;

  /** Уровень изучения: сколько точек показать. Без него точек нет. */
  level?: WordLevel;
}

export function WordCard({
  hanzi,
  pinyin,
  translation,
  isFavorite,
  onToggleFavorite,
  level,
}: Props) {
  const { t } = useTranslation(["sets"]);
  const { speakForced } = useSpeakHanzi();

  return (
    <View className="flex-row items-center p-2 justify-between bg-surface rounded-xl gap-3">
      <View className="w-28 shrink-0 pr-3 border-r border-textSecondary justify-center">
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          className="text-text font-chineseMedium text-3xl text-center"
        >
          {hanzi}
        </Text>
        {level !== undefined && <LevelDots level={level} className="mt-1" />}
      </View>

      <View className="flex-1 min-w-0 justify-center py-1">
        <Text numberOfLines={1} className="text-primary font-medium">
          {pinyin}
        </Text>

        <Text
          numberOfLines={2}
          className="text-text text-lg leading-tight mt-0.5"
        >
          {t(translation)}
        </Text>
      </View>

      <View className="flex-row items-center shrink-0 ml-2 gap-5">
        <TouchableOpacity
          onPress={() => speakForced(hanzi)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <VolumeOnIcon
            width={22}
            height={22}
            color="#2C241E"
            strokeWidth={1}
          />
        </TouchableOpacity>

        <FavoriteButton
          isFavorite={isFavorite}
          onToggle={onToggleFavorite}
          size={22}
        />
      </View>
    </View>
  );
}
