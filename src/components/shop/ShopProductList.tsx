import { ShopProductCard } from "@/components/shop/ShopProductCard";
import { Product } from "@/content/shop/shopCatalog";
import { Dispatch, SetStateAction } from "react";
import { ScrollView, Text, View } from "react-native";

type ShopProductListProps = {
  products: Product[];
  categoryLabel: string;
  selectedProductId: string | null;
  onSelect: Dispatch<SetStateAction<string | null>>;
};

export const ShopProductList = ({
  products,
  categoryLabel,
  selectedProductId,
  onSelect,
}: ShopProductListProps) => {
  return (
    <View
      className="min-w-0"
      style={{
        flex: 1,
      }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          gap: 8,
          paddingBottom: 8,
        }}
      >
        {products.length === 0 ? (
          <Text className="mt-2 font-nunito text-small text-textSecondary">
            Тут пока пусто — скоро добавим товары.
          </Text>
        ) : (
          products.map((product) => {
            const isSelected = selectedProductId === product.id;

            return (
              <ShopProductCard
                key={product.id}
                product={product}
                isSelected={isSelected}
                onPress={onSelect}
              />
            );
          })
        )}
      </ScrollView>
    </View>
  );
};
