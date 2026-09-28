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
    <View className="border border-[#D8C3A3] border-b-0 rounded-2xl pt-2 overflow-hidden">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{
          flexGrow: 0,
        }}
        contentContainerStyle={{
          gap: 4,
          paddingHorizontal: 2,
          paddingBottom: 4,
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
