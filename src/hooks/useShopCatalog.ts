import {
  CATEGORIES_BY_DOMAIN,
  Domain,
  ProductBlueprint,
  PRODUCTS_BY_CATEGORY,
} from "@/content/shop/shopCatalog";
import { useRoomStore } from "@/store/roomStore";
import { useShopStore } from "@/store/shopStore";
import { useProgressStore } from "@/store/userProgressStore";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";

export function useShopCatalog() {
  const router = useRouter();

  const isOwned = useShopStore((s) => s.isOwned);
  const addOwnedProduct = useShopStore((s) => s.addOwnedProduct);
  const setCabinetType = useRoomStore((s) => s.setCabinetType);
  const setPosterType = useRoomStore((s) => s.setPosterType);
  const currentCabinetType = useRoomStore((s: any) => s.cabinetType);
  const currentPosterType = useRoomStore((s: any) => s.posterType);

  const [activeDomain, setActiveDomain] = useState<Domain>("interior");
  const [activeCategory, setActiveCategory] = useState<string | null>(
    CATEGORIES_BY_DOMAIN["interior"][0]?.id ?? null,
  );
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  );

  const handleDomainChange = (domain: Domain) => {
    setActiveDomain(domain);
    setActiveCategory(CATEGORIES_BY_DOMAIN[domain][0]?.id ?? null);
    setSelectedProductId(null);
  };

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
    setSelectedProductId(null);
  };

  const categories = CATEGORIES_BY_DOMAIN[activeDomain];
  const blueprints = activeCategory
    ? (PRODUCTS_BY_CATEGORY[activeCategory] ?? [])
    : [];

  // Принимает весь товар (не id), потому что эффект теперь лежит на
  // самом товаре, а не в отдельном словаре.
  const isEquipped = (product: ProductBlueprint) => {
    if (!product.roomEffect) return false;
    const { field, value } = product.roomEffect;
    const currentValue =
      field === "cabinetType" ? currentCabinetType : currentPosterType;
    return currentValue === value;
  };

  const products = blueprints.map((p) => ({
    ...p,
    owned: isOwned(p.id),
    equipped: isEquipped(p), // передаём объект целиком, не p.id
  }));

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const handleCancel = () => {
    if (selectedProductId) {
      setSelectedProductId(null);
    } else {
      router.back();
    }
  };

  const handleApply = () => {
    if (!selectedProduct?.roomEffect) return;
    const { field, value } = selectedProduct.roomEffect;
    if (field === "cabinetType") setCabinetType(value as any);
    if (field === "posterType") setPosterType(value as any);
    router.back();
  };

  const handleBuy = () => {
    if (!selectedProduct) return;

    const success = useProgressStore
      .getState()
      .spendCoins(selectedProduct.price);

    if (!success) {
      Alert.alert("Недостаточно монет", "Заработай ещё немного и возвращайся!");
      return;
    }

    addOwnedProduct(selectedProduct.id);
  };

  // Раньше это доставалось из CABINET_PRODUCT_TO_TYPE/POSTER_PRODUCT_TO_TYPE
  // по id товара; теперь — прямо из roomEffect самого выбранного товара.
  const previewCabinetType =
    selectedProduct?.roomEffect?.field === "cabinetType"
      ? selectedProduct.roomEffect.value
      : currentCabinetType;

  const previewPosterType =
    selectedProduct?.roomEffect?.field === "posterType"
      ? selectedProduct.roomEffect.value
      : currentPosterType;

  return {
    activeDomain,
    activeCategory,
    categories,
    products,
    selectedProduct,
    selectedProductId,
    previewCabinetType,
    previewPosterType,
    handleDomainChange,
    handleCategoryChange,
    handleCancel,
    handleApply,
    handleBuy,
    setSelectedProductId,
  };
}
