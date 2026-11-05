import { View } from "react-native";
import { CoinBalance } from "../CoinBalance";
import { BackButton } from "../ui/BackButton";
import { Title } from "../ui/Title";

export const ShopHeader = () => {
  return (
    <View className="flex-row items-center justify-between mb-4">
      <BackButton href="/pet" />

      <Title>Магазин</Title>

      <CoinBalance />
    </View>
  );
};
