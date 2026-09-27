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
  const isEquipped = product.owned && product.equipped;

  return (
    <Pressable
      onPress={() => onPress(product.id)}
      className={`rounded-2xl border-2 overflow-hidden bg-[#F8EFDF] ${
        isSelected ? "border-primary" : "border-[#D8C3A3]"
      }`}
    >
      {/* Название */}
      <View className="px-2.5 pt-2 pb-1.5">
        <Text className="font-nunito text-xs text-text" numberOfLines={1}>
          {product.name}
        </Text>
      </View>

      {/* Изображение */}
      <View
        className="items-center justify-center bg-[#EFE2CB]"
        style={{ height: 90 }}
      >
        <Image
          source={product.image}
          style={{ width: "75%", height: "85%" }}
          resizeMode="contain"
        />

        {isEquipped && (
          <View className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary items-center justify-center">
            <Text className="text-white text-xs">✓</Text>
          </View>
        )}
      </View>

      {/* Цена / статус */}
      <View className="p-2">
        <View className="items-center py-1.5 rounded-xl bg-[#EFE2CB]">
          {isEquipped ? (
            <Text className="font-nunito text-[10px] text-[#5C7355]">
              Установлен
            </Text>
          ) : product.owned ? (
            <Text className="font-nunito text-[10px] text-[#967F67]">
              Применить
            </Text>
          ) : (
            <Text className="font-nunito text-[10px] text-[#967F67]">
              🪙 {product.price}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
};
