import { Product } from "@/content/shop/shopCatalog";
import { Pressable, Text, View } from "react-native";

type ShopActionBarProps = {
  selectedProduct?: Product;
  onCancel: () => void;
  onApply: () => void;
  onBuy: () => void;
};

export const ShopActionBar = ({
  selectedProduct,
  onCancel,
  onApply,
  onBuy,
}: ShopActionBarProps) => {
  return (
    <View className="flex-row gap-3 px-4 pt-4 pb-4">
      <Pressable
        onPress={onCancel}
        className="flex-1 items-center py-3 rounded-2xl border border-[#D8C3A3] bg-[#F3E5D0]"
      >
        <Text className="font-nunito text-sm text-[#967F67]">
          {selectedProduct ? "Отменить" : "Выйти"}
        </Text>
      </Pressable>

      {selectedProduct && (
        <Pressable
          onPress={selectedProduct.owned ? onApply : onBuy}
          className="flex-1 items-center py-3 rounded-2xl bg-primary"
        >
          <Text className="font-nunito text-sm text-white">
            {selectedProduct.owned
              ? "Применить"
              : `Купить за ${selectedProduct.price} 🪙`}
          </Text>
        </Pressable>
      )}
    </View>
  );
};
