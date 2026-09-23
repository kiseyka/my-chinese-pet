// src/app/(tabs)/shop.tsx

import flowerCabinetImg from "@/assets/shop-cards/flower-cabinet.png";
import flowerStandImg from "@/assets/shop-cards/flower_stand.png";
import { PandaScenePreview } from "@/components/panda/PandaScenePreview";
import { useRoomStore } from "@/store/roomStore";
import { useShopStore } from "@/store/shopStore";
import { useProgressStore } from "@/store/userProgressStore";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  ImageSourcePropType,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Domain = "clothing" | "interior" | "flowers";

type Category = {
  id: string;
  label: string;
  icon: string;
};

const DOMAINS: { id: Domain; label: string; icon: string }[] = [
  { id: "interior", label: "Мебель", icon: "🪑" },
  { id: "clothing", label: "Одежда", icon: "👘" },
  { id: "flowers", label: "Растения", icon: "🌿" },
];

const CATEGORIES_BY_DOMAIN: Record<Domain, Category[]> = {
  interior: [
    { id: "cabinets", label: "Шкафы", icon: "🗄️" },
    { id: "walls", label: "Стены", icon: "🧱" },
    { id: "floor", label: "Полы", icon: "⬜" },
    { id: "carpets", label: "Ковры", icon: "🟫" },
    { id: "cupboards", label: "Тумбы", icon: "📦" },
    { id: "windows", label: "Окна", icon: "🪟" },
    { id: "curtains", label: "Шторы", icon: "🎀" },
    { id: "posters", label: "Плакаты", icon: "🖼️" },
  ],
  clothing: [
    { id: "hats", label: "Шляпы", icon: "🎩" },
    { id: "scarves", label: "Шарфы", icon: "🧣" },
  ],
  flowers: [],
};

type ProductBlueprint = {
  id: string;
  name: string;
  price: number;
  image: ImageSourcePropType;
};

const PRODUCTS_BY_CATEGORY: Record<string, ProductBlueprint[]> = {
  cabinets: [
    {
      id: "flower_stand",
      name: "Цветочная стойка",
      price: 0,
      image: flowerStandImg,
    },
    {
      id: "flower_cabinet",
      name: "Цветочный шкаф",
      price: 150,
      image: flowerCabinetImg,
    },
  ],
};

const CABINET_PRODUCT_TO_TYPE: Record<string, "stand" | "wardrobe"> = {
  flower_stand: "stand",
  flower_cabinet: "wardrobe",
};

const ShopScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const coins = useProgressStore((s) => s.coins);
  const isOwned = useShopStore((s) => s.isOwned);
  const addOwnedProduct = useShopStore((s) => s.addOwnedProduct);
  const setCabinetType = useRoomStore((s) => s.setCabinetType);
  // Для бейджа "Установлен" — сверь имя поля с фактическим roomStore.
  const currentCabinetType = useRoomStore((s: any) => s.cabinetType);

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

  const isEquipped = (productId: string) => {
    const type = CABINET_PRODUCT_TO_TYPE[productId];
    if (!type) return false;
    return currentCabinetType === type;
  };

  const products = blueprints.map((p) => ({
    ...p,
    owned: isOwned(p.id),
    equipped: isEquipped(p.id),
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
    if (!selectedProduct) return;

    const cabinetType = CABINET_PRODUCT_TO_TYPE[selectedProduct.id];
    if (cabinetType) {
      setCabinetType(cabinetType);
    }

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

  return (
    <View
      className="bg-[#EDE0CE]"
      style={{
        flex: 1,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      {/* ---------------- HEADER ---------------- */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          className="w-10 h-10 items-center justify-center rounded-full bg-[#F3E5D0] border border-[#D8C3A3]"
        >
          <Text className="font-nunito text-xl text-text">←</Text>
        </Pressable>

        <View className="flex-1 items-center">
          <View className="px-6 py-2 rounded-2xl border border-[#D8C3A3] bg-[#F3E5D0]">
            <Text className="font-nunito text-base text-text tracking-wide">
              МАГАЗИН
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-1 px-3 py-2 rounded-full bg-[#F3E5D0] border border-[#D8C3A3]">
          <Text className="font-nunito text-sm text-text">🪙 {coins}</Text>
          <Pressable
            hitSlop={8}
            className="w-5 h-5 ml-1 items-center justify-center rounded-full bg-primary"
          >
            <Text className="font-nunito text-xs text-white">+</Text>
          </Pressable>
        </View>
      </View>

      {/* ---------------- DOMAINS ---------------- */}
      <View className="flex-row justify-between px-4 gap-2">
        {DOMAINS.map((domain) => {
          const isActive = domain.id === activeDomain;

          return (
            <Pressable
              key={domain.id}
              onPress={() => handleDomainChange(domain.id)}
              className={`flex-1 flex-row items-center justify-center gap-1.5 py-3 rounded-2xl border ${
                isActive
                  ? "bg-primary border-primary"
                  : "bg-[#F3E5D0] border-[#D8C3A3]"
              }`}
            >
              <Text className="text-base">{domain.icon}</Text>
              <Text
                className={`font-nunito text-sm ${
                  isActive ? "text-white" : "text-[#967F67]"
                }`}
              >
                {domain.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* ---------------- CATEGORIES ---------------- */}
      {categories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            gap: 8,
            paddingHorizontal: 16,
            paddingVertical: 8,
          }}
        >
          {categories.map((category) => {
            const isActive = category.id === activeCategory;

            return (
              <Pressable
                key={category.id}
                onPress={() => handleCategoryChange(category.id)}
                className={`flex-row items-center gap-1 px-2.5 py-1.5 rounded-xl border ${
                  isActive
                    ? "bg-primary border-primary"
                    : "bg-[#F3E5D0] border-[#D8C3A3]"
                }`}
              >
                <Text className="text-xs">{category.icon}</Text>
                <Text
                  className={`font-nunito text-[11px] ${
                    isActive ? "text-white" : "text-[#967F67]"
                  }`}
                  numberOfLines={1}
                >
                  {category.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* ---------------- PREVIEW / RIVE ---------------- */}
      <View
        className="mx-4 mt-1 rounded-3xl overflow-hidden border border-[#D8C3A3] bg-[#E3D2B4]"
        style={{ flex: 1, minHeight: 300 }}
      >
        <PandaScenePreview />

        <View className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/20 items-center justify-center">
          <Text className="text-white text-base">⛶</Text>
        </View>

        <Pressable className="absolute bottom-3 right-3 flex-row items-center gap-1.5 px-3 py-2 rounded-2xl bg-black/30">
          <Text className="text-sm">👁️</Text>
          <Text className="font-nunito text-xs text-white">Предпросмотр</Text>
        </Pressable>
      </View>

      {/* ---------------- PRODUCTS ---------------- */}
      <View className="flex-row items-center gap-2 px-4 mt-4 mb-2">
        <Text className="text-base">
          {categories.find((c) => c.id === activeCategory)?.icon ?? ""}
        </Text>
        <Text className="font-nunito text-base text-text">
          {categories.find((c) => c.id === activeCategory)?.label ?? ""}
        </Text>
        <View className="flex-1 h-px bg-[#D8C3A3]" />
      </View>

      <View style={{ height: 150 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}
        >
          {products.length === 0 ? (
            <Text className="font-nunito text-sm text-[#967F67] mt-2">
              Тут пока пусто — скоро добавим товары.
            </Text>
          ) : (
            products.map((product) => {
              const isSelected = selectedProductId === product.id;
              const isActiveEquipped = product.owned && product.equipped;

              return (
                <Pressable
                  key={product.id}
                  onPress={() => setSelectedProductId(product.id)}
                  className={`w-[150px] rounded-2xl border-2 overflow-hidden bg-[#F8EFDF] ${
                    isSelected ? "border-primary" : "border-[#D8C3A3]"
                  }`}
                >
                  <View
                    className="items-center justify-center bg-[#EFE2CB]"
                    style={{ height: 120 }}
                  >
                    <Image
                      source={product.image}
                      style={{ width: "80%", height: "80%" }}
                      resizeMode="contain"
                    />

                    {isActiveEquipped && (
                      <View className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary items-center justify-center">
                        <Text className="text-white text-xs">✓</Text>
                      </View>
                    )}
                  </View>

                  <View className="p-2.5">
                    <Text
                      className="font-nunito text-xs text-text"
                      numberOfLines={2}
                    >
                      {product.name}
                    </Text>

                    <View className="mt-2 items-center py-2 rounded-xl bg-[#EFE2CB]">
                      {isActiveEquipped ? (
                        <Text className="font-nunito text-[11px] text-[#5C7355]">
                          Установлен
                        </Text>
                      ) : product.owned ? (
                        <Text className="font-nunito text-[11px] text-[#967F67]">
                          Применить
                        </Text>
                      ) : (
                        <Text className="font-nunito text-[11px] text-[#967F67]">
                          🪙 {product.price}
                        </Text>
                      )}
                    </View>
                  </View>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      </View>

      {/* ---------------- ACTIONS ---------------- */}
      <View className="flex-row gap-3 px-4 pt-3 pb-2">
        <Pressable
          onPress={handleCancel}
          className="flex-1 items-center py-3 rounded-2xl border border-[#D8C3A3] bg-[#F3E5D0]"
        >
          <Text className="font-nunito text-sm text-[#967F67]">
            {selectedProductId ? "Отменить" : "Выйти"}
          </Text>
        </Pressable>

        {selectedProduct && (
          <Pressable
            onPress={selectedProduct.owned ? handleApply : handleBuy}
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
    </View>
  );
};

export default ShopScreen;
