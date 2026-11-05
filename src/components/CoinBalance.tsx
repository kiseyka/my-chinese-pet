// components/CoinBalance.tsx
//
// Монеты в шапке магазина: монетка и число, без плашки. Плашка-пергамент нужна только
// на экране панды — там она отделяет интерфейс от пёстрой комнаты; на ровном фоне
// магазина она лишняя.
import { useProgressStore } from "@/store/userProgressStore";
import { Image, Text, View } from "react-native";

export const CoinBalance = () => {
  const coins = useProgressStore((s) => s.coins);
  return (
    <View
      className="flex-row items-center gap-2"
      accessible
      accessibilityLabel={`Монеты: ${coins}`}
    >
      <Image
        source={require("@/assets/images/paw-coin.png")}
        style={{ width: 28, height: 28 }}
      />
      <Text className="font-nunito text-xl text-text">{coins}</Text>
    </View>
  );
};
