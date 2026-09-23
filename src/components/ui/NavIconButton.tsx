// src/components/NavIconButton.tsx

import { ReactNode } from "react";
import { Pressable, Text, View, ViewStyle } from "react-native";

type NavIconButtonProps = {
  icon: ReactNode;
  label: string;
  onPress: () => void;
  style?: ViewStyle;
};

// Простая круглая кнопка "иконка + подпись снизу". Используется для
// навигации на отдельные экраны (магазин, тренировки и т.д.) — никакой
// внутренней анимации/раскрытия, просто router.push при нажатии.
// Если появятся настоящие SVG-иконки — передавай их в проп `icon`
// вместо текущих emoji-заглушек, компонент менять не придётся.
export const NavIconButton = ({
  icon,
  label,
  onPress,
  style,
}: NavIconButtonProps) => {
  return (
    <Pressable
      onPress={onPress}
      className="items-center justify-center"
      style={[{ width: 72 }, style]}
      hitSlop={8}
    >
      <View
        className="items-center justify-center bg-[#F3E5D0] border border-[#D8C3A3] rounded-full"
        style={{ width: 56, height: 56 }}
      >
        {icon}
      </View>
      <Text className="font-nunito text-xs text-text mt-1" numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
};
