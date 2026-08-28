// components/game/WordCard.tsx

import VolumeOnIcon from "@/assets/images/icons/volume.svg";
import { FavoriteButton } from "@/components/ui/FavoriteButton";
import { useSpeakHanzi } from "@/hooks/useSpeakHanzi";
import { useTranslation } from "react-i18next";
import { Text, TouchableOpacity, View } from "react-native";

interface Props {
  hanzi: string;
  pinyin: string;
  translation: string;

  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export function WordCard({
  hanzi,
  pinyin,
  translation,
  isFavorite,
  onToggleFavorite,
}: Props) {
  const { t } = useTranslation(["sets"]);
  const { speak } = useSpeakHanzi();
  const { speakForced } = useSpeakHanzi();
  return (
    <View className="flex-row items-center p-2 justify-between bg-[#FCF7F3] rounded-xl gap-3">
      {/* Hanzi */}
      <View className="w-28 shrink-0 pr-3 border-r border-textSecondary justify-center">
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          className="text-text font-chineseMedium text-3xl text-center"
        >
          {hanzi}
        </Text>
      </View>

      {/* Pinyin + translation */}
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

      {/* Actions */}
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
