import { Category } from "@/content/shop/shopCatalog";
import { ScrollView, View } from "react-native";
import { ShopCategoryItem } from "./ShopCategoryItem";

type ShopCategoryListProps = {
  categories: Category[];
  activeCategory: string | null;
  onChange: (id: string) => void;
};

export const ShopCategoryList = ({
  categories,
  activeCategory,
  onChange,
}: ShopCategoryListProps) => {
  return (
    <View className="overflow-hidden rounded-2xl border border-primary/30 bg-surface/60 pt-2">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{
          flexGrow: 0,
        }}
        contentContainerStyle={{
          gap: 6,
          paddingHorizontal: 8,
          paddingBottom: 8,
          alignItems: "flex-start",
        }}
      >
        {categories.map((category) => {
          const isActive = category.id === activeCategory;

          return (
            <ShopCategoryItem
              key={category.id}
              label={category.label}
              icon={category.icon}
              active={isActive}
              onPress={() => onChange(category.id)}
            />
          );
        })}
      </ScrollView>
    </View>
  );
};
