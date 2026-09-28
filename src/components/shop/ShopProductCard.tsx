import { Product } from "@/content/shop/shopCatalog";
import { Dispatch, SetStateAction } from "react";
import { Image, Pressable, Text, View } from "react-native";

type ShopProductCardProps = {
  product: Product;
  isSelected: boolean;
  onPress: Dispatch<SetStateAction<string | null>>;
};

export const ShopProductCard = ({
  product,
  isSelected,
  onPress,
}: ShopProductCardProps) => {
  const isOwned = product.owned;
  const isEquipped = product.owned && product.equipped;

  return (
    <Pressable
      onPress={() => onPress(product.id)}
      className={`
        rounded-lg
        border
        overflow-hidden
        bg-[#F8EFDF]
        ${isSelected ? "border-primary" : "border-[#D8C3A3]"}
      `}
    >
      <View
        className="items-center justify-start bg-[#EFE2CB]"
        style={{ aspectRatio: 1, width: "100%" }}
      >
        <Image
          source={product.image}
          style={{ width: "100%", height: "100%" }}
          resizeMode="contain"
        />

        {/* Цена — только для ещё не купленных */}
        {!isOwned && (
          <View className="absolute top-2 right-2 flex items-center">
            <Image
              source={require("@/assets/images/paw-coin.png")}
              className="w-5 h-5"
            />
            <Text className="font-nunito text-sm text-text">
              {product.price}
            </Text>
          </View>
        )}

        {/* Галочка — только для установленного */}
        {isEquipped && (
          <View className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary items-center justify-center">
            <Text className="text-white text-xs">✓</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
};
