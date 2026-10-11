import {
  Image,
  ImageSourcePropType,
  Pressable,
  View,
  ViewStyle,
} from "react-native";

type NavIconButtonProps = {
  image: ImageSourcePropType;
  label: string;
  onPress: () => void;
  style?: ViewStyle;
};

export const NavIconButton = ({
  image,
  label,
  onPress,
  style,
}: NavIconButtonProps) => {
  return (
    <Pressable onPress={onPress} className="items-center w-[76px]" hitSlop={8}>
      <View
        className="items-center justify-center bg-surface/80 rounded-full border border-primary overflow-hidden"
        style={{ width: 72, height: 72 }}
      >
        <Image
          source={image}
          style={{ width: 56, height: 56 }}
          resizeMode="cover"
        />
      </View>

      {/* <Text className="font-nunito text-lg text-text mt-1" numberOfLines={1}>
        {label}
      </Text> */}
    </Pressable>
  );
};
