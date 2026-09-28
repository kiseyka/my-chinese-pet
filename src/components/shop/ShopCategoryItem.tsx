// src/components/shop/ShopCategoryItem.tsx

import { Pressable, Text } from "react-native";
import type { SvgProps } from "react-native-svg";

type ShopCategoryItemProps = {
  label: string;
  icon: React.FC<SvgProps>;
  active?: boolean;
  onPress?: () => void;
};

export const ShopCategoryItem = ({
  label,
  icon: Icon,
  active = false,
  onPress,
}: ShopCategoryItemProps) => {
  return (
    <Pressable
      onPress={onPress}
      className={`items-center justify-center rounded-2xl px-2 py-2 ${
        active ? "bg-primary" : "bg-[#E8DAC3]"
      }`}
      style={{ width: 66 }}
    >
      <Icon width={36} height={36} color={active ? "#ffffff" : "#967F67"} />

      <Text
        className={`mt-1 font-nunito text-sm ${
          active ? "text-white" : "text-[#967F67]"
        }`}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
};
