// components/game/GameCard.tsx

import NextIcon from "@/assets/images/icons/arrow-right.svg";
import LockIcon from "@/assets/images/icons/lock-keyhole.svg";
import { colors } from "@/theme/colors";
import {
  Image,
  ImageSourcePropType,
  Pressable,
  Text,
  View,
} from "react-native";

type GameCardProps = {
  title: string;
  description: string;
  imageSource: ImageSourcePropType;
  locked?: boolean;
  onPress: () => void;
};

export function GameCard({
  title,
  description,
  imageSource,
  locked = false,
  onPress,
}: GameCardProps) {
  return (
    <Pressable
      disabled={locked}
      onPress={onPress}
      className={`overflow-hidden rounded-2xl ${
        locked ? "bg-surface opacity-50" : "bg-surface"
      }`}
      style={{
        shadowColor: colors.textSecondary,
        shadowOffset: { width: -2, height: 6 },
        shadowOpacity: 1,
        shadowRadius: 12,
        elevation: 5,
      }}
    >
      <View className="flex-row gap-2">
        <View className="w-28 h-28">
          <Image
            source={imageSource}
            className="w-full h-full"
            resizeMode="contain"
          />
        </View>

        <View className="flex-1 justify-between mt-3">
          <View className="pr-3">
            <Text className="text-text text-lg font-nunito">{title}</Text>
            <Text className="text-textSecondary mt-1 font-nunito">
              {description}
            </Text>
          </View>

          <View className="items-end pr-3 pb-3">
            {locked ? (
              <LockIcon width={22} height={22} color={colors.text} />
            ) : (
              <NextIcon width={22} height={22} color={colors.text} />
            )}
          </View>
        </View>
      </View>

      {locked && (
        <Text className="ml-2 mb-2 text-xs text-textSecondary font-nunito">
          В разработке...
        </Text>
      )}
    </Pressable>
  );
}
