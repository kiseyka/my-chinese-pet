import { useProgressStore } from "@/store/userProgressStore";
import { Pressable, Text, View } from "react-native";
import { BackButton } from "../ui/BackButton";
import { Title } from "../ui/Title";

export const ShopHeader = () => {
  const coins = useProgressStore((s) => s.coins);

  return (
    <View className="flex-row items-center justify-between pb-4">
      <BackButton href="/" />

      <View className="flex-1 items-center">
        <View className="px-6 py-2 rounded-2xl">
          <Title>Магазин</Title>
        </View>
      </View>

      <View className="flex-row items-center gap-1 px-3 py-2 rounded-full bg-[#F3E5D0] border border-[#D8C3A3]">
        <Text className="font-nunito text-sm text-text">🪙 {coins}</Text>
        <Pressable
          hitSlop={8}
          className="w-5 h-5 ml-1 items-center justify-center rounded-full bg-primary"
        >
          <Text className="font-nunito text-xs text-white">+</Text>
        </Pressable>
      </View>
    </View>
  );
};
