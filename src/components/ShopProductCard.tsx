// src/components/ShopProductCard.tsx

import coinIcon from "@/assets/images/coin.png";

import {
  Image,
  ImageSourcePropType,
  Pressable,
  Text,
  View,
} from "react-native";

export type ShopProduct = {
  id: string;
  name: string;
  price: number;
  owned: boolean;
  image: ImageSourcePropType;
};

type ShopProductCardProps = {
  product: ShopProduct;
  selected?: boolean;
  onPress?: () => void;
};

export function ShopProductCard({
  product,
  selected = false,
  onPress,
}: ShopProductCardProps) {
  const { name, price, owned, image } = product;

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={name}
      className={`w-[120px] h-[120px] rounded-2xl overflow-hidden bg-[#F3E5D0] border ${
        selected ? "border-primary border-2" : "border-[#DCC7A8]"
      }`}
    >
      {/* Картинка товара */}
      <Image
        source={image}
        resizeMode="contain"
        style={{ width: "100%", height: "100%" }}
      />

      {/* Дымка поверх купленных — приглушает карточку целиком,
          независимо от того, что нарисовано на картинке. */}
      {owned && (
        <View pointerEvents="none" className="absolute inset-0 bg-white/45" />
      )}

      {/* Купленные: тихий бейдж-галочка в углу вместо цены. */}
      {owned ? (
        <View className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primaryDark items-center justify-center">
          <Text className="text-white text-[11px] leading-[11px]">✓</Text>
        </View>
      ) : (
        /* Не куплено: цена в монетках, нижний правый угол. */
        <View className="absolute bottom-1.5 right-1.5 flex-row items-center gap-1 rounded-full bg-[#F3E5D0]/95 border border-[#DCC7A8] px-1.5 py-0.5">
          <Image
            source={coinIcon}
            resizeMode="contain"
            style={{ width: 12, height: 12 }}
          />
          <Text className="font-nunito text-[10px] text-[#967F67]">
            {price}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
