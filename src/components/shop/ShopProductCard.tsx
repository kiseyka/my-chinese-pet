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
      // Рамка видна только у выбранной карточки. У остальных она прозрачная,
      // но той же толщины — так картинка не прыгает при выборе.
      className={`overflow-hidden rounded-2xl border-2 bg-surface ${
        isSelected ? "border-primary" : "border-transparent"
      }`}
    >
      <View
        className="items-center justify-start"
        style={{ aspectRatio: 1, width: "100%" }}
      >
        <Image
          source={product.image}
          style={{ width: "100%", height: "100%" }}
          resizeMode="contain"
        />

        {/* Цена — только для ещё не купленных */}
        {!isOwned && (
          <View className="absolute right-1.5 top-1.5 flex-row items-center gap-0.5 rounded-full bg-surface/90 px-1.5 py-0.5">
            <Text className="font-nunitoBold text-caption text-text">
              {product.price}
            </Text>
            <Image
              source={require("@/assets/images/paw-coin.png")}
              className="h-4 w-4"
            />
          </View>
        )}

        {/* Галочка — только для установленного */}
        {isEquipped && (
          <View className="absolute right-1.5 top-1.5 h-5 w-5 items-center justify-center rounded-full bg-primary">
            <Text className="font-nunitoBold text-caption text-white">✓</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
};
