// src/app/(tabs)/shop.tsx

import { Screen } from "@/components/layout/Screen";
import { PandaScenePreview } from "@/components/panda/PandaScenePreview";
import { ShopActionBar } from "@/components/shop/ShopActionBar";
import { ShopCategoryList } from "@/components/shop/ShopCategoryList";
import { ShopDomainTabs } from "@/components/shop/ShopDomainTabs";
import { ShopHeader } from "@/components/shop/ShopHeader";
import { ShopProductList } from "@/components/shop/ShopProductList";
import { useShopCatalog } from "@/hooks/useShopCatalog";
import { View } from "react-native";

const ShopScreen = () => {
  const {
    activeDomain,
    activeCategory,
    categories,
    products,
    selectedProduct,
    selectedProductId,
    hasDrafts,
    totalPrice,
    previewCabinetType,
    previewPosterType,
    previewWallType,
    previewFloorType,
    previewCarpetType,
    handleDomainChange,
    handleCategoryChange,
    handleCancel,
    handleApply,
    handleBuy,
    setSelectedProductId,
  } = useShopCatalog();

  return (
    <Screen>
      <ShopHeader />
      <View>
        <ShopDomainTabs
          activeDomain={activeDomain}
          onChange={handleDomainChange}
        />
        {categories.length > 0 && (
          <ShopCategoryList
            categories={categories}
            activeCategory={activeCategory}
            onChange={handleCategoryChange}
          />
        )}
      </View>
      <View className="flex-row gap-1 flex-1 mt-4">
        <View style={{ flex: 3.35 }}>
          <PandaScenePreview
            previewCabinetType={previewCabinetType}
            previewPosterType={previewPosterType}
            previewWallType={previewWallType}
            previewFloorType={previewFloorType}
            previewCarpetType={previewCarpetType}
          />
        </View>

        <ShopProductList
          products={products}
          categoryLabel={
            categories.find((c) => c.id === activeCategory)?.label ?? ""
          }
          selectedProductId={selectedProductId}
          onSelect={setSelectedProductId}
        />
      </View>

      <ShopActionBar
        hasSelectionInCategory={!!selectedProduct}
        hasDrafts={hasDrafts}
        totalPrice={totalPrice}
        onApply={handleApply}
        onBuy={handleBuy}
        onCancel={handleCancel}
      />
    </Screen>
  );
};

export default ShopScreen;
