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
        active
          ? "bg-primary active:opacity-80"
          : "border border-primary/30 bg-surface active:opacity-70"
      }`}
      style={{ width: 72 }}
    >
      {/* Цвет через проп color: SVG-иконки категорий не понимают className.
          #78826D — primary из tailwind.config.js */}
      <Icon width={32} height={32} color={active ? "#FFFFFF" : "#78826D"} />

      <Text
        className={`mt-1 font-nunitoBold text-small ${
          active ? "text-white" : "text-text"
        }`}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
};
