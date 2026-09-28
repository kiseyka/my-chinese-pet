// components/common/CoinBalance.tsx
import { useProgressStore } from "@/store/userProgressStore";
import { Image, Pressable, Text, View } from "react-native";

export const CoinBalance = () => {
  const coins = useProgressStore((s) => s.coins);
  return (
    <View className="flex-row items-center gap-2 px-3 py-2 rounded-full bg-[#F3E5D0] border border-[#D8C3A3]">
      <Image
        source={require("@/assets/images/paw-coin.png")}
        className="w-8 h-8"
      />
      <Text className="text-xl font-nunito text-text">{coins}</Text>
      <Pressable
        hitSlop={8}
        className="w-6 h-6 ml-1 items-center justify-center rounded-full bg-primary"
      >
        <Text className="font-nunito text-xs text-white">+</Text>
      </Pressable>
    </View>
  );
};
