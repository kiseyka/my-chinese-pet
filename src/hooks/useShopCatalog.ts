import { isDefaultProduct } from "@/content/shop/defaultProducts";
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
import { Dispatch, SetStateAction, useState } from "react";
import { Alert } from "react-native";

export function useShopCatalog() {
  const router = useRouter();

  // Подписываемся на сам массив купленных id, а не на функцию isOwned.
  // Функция isOwned в сторе никогда не меняется, поэтому подписка на неё
  // не вызывала перерисовку после покупки — предмет выглядел некупленным.
  const ownedProductIds = useShopStore((s) => s.ownedProductIds);
  const addOwnedProduct = useShopStore((s) => s.addOwnedProduct);
  const setCabinetType = useRoomStore((s) => s.setCabinetType);
  const setPosterType = useRoomStore((s) => s.setPosterType);
  const setWallType = useRoomStore((s) => s.setWallType);
  const setFloorType = useRoomStore((s) => s.setFloorType);
  const setCarpetType = useRoomStore((s) => s.setCarpetType);
  const currentCabinetType = useRoomStore((s: any) => s.cabinetType);
  const currentPosterType = useRoomStore((s: any) => s.posterType);
  const currentWallType = useRoomStore((s: any) => s.wallType);
  const currentFloorType = useRoomStore((s: any) => s.floorType);
  const currentCarpetType = useRoomStore((s: any) => s.carpetType);

  // Куплен = есть в сторе ИЛИ это предмет по умолчанию.
  // Цена тут ни при чём: price 0 не делает предмет купленным.
  const isProductOwned = (productId: string, owned: string[]) =>
    owned.includes(productId) || isDefaultProduct(productId);

  const [activeDomain, setActiveDomain] = useState<Domain>("interior");
  const [activeCategory, setActiveCategory] = useState<string | null>(
    CATEGORIES_BY_DOMAIN["interior"][0]?.id ?? null,
  );
  // Черновик примерки: для каждой категории запоминаем выбранный товар.
  // При смене категории или вкладки выбор не сбрасывается, поэтому можно
  // выбрать стену, перейти к полам и посмотреть, как они смотрятся вместе.
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const selectedProductId = activeCategory
    ? (drafts[activeCategory] ?? null)
    : null;

  // Та же сигнатура, что у обычного setState, чтобы ShopProductList
  // и ShopProductCard не пришлось менять.
  const setSelectedProductId: Dispatch<SetStateAction<string | null>> = (
    next,
  ) => {
    if (!activeCategory) return;
    setDrafts((prev) => {
      const current = prev[activeCategory] ?? null;
      const value = typeof next === "function" ? next(current) : next;
      const { [activeCategory]: _removed, ...rest } = prev;
      return value ? { ...rest, [activeCategory]: value } : rest;
    });
  };

  const handleDomainChange = (domain: Domain) => {
    setActiveDomain(domain);
    setActiveCategory(CATEGORIES_BY_DOMAIN[domain][0]?.id ?? null);
  };

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
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

    const currentValue = {
      cabinetType: currentCabinetType,
      posterType: currentPosterType,
      wallType: currentWallType,
      floorType: currentFloorType,
      carpetType: currentCarpetType,
    }[field];

    return currentValue === value;
  };
  const products = blueprints.map((p) => ({
    ...p,
    owned: isProductOwned(p.id, ownedProductIds),
    equipped: isEquipped(p), // передаём объект целиком, не p.id
  }));

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // Все товары из черновика (по всем категориям), чтобы показать их
  // в превью комнаты одновременно.
  const draftProducts = Object.entries(drafts)
    .map(([categoryId, productId]) =>
      (PRODUCTS_BY_CATEGORY[categoryId] ?? []).find((p) => p.id === productId),
    )
    .filter((p): p is ProductBlueprint => !!p);

  const getPreviewValue = (field: string, currentValue: any) => {
    const draft = draftProducts.find((p) => p.roomEffect?.field === field);
    return draft?.roomEffect ? draft.roomEffect.value : currentValue;
  };

  // «Отменить» снимает выбор только в текущей категории,
  // выбор в остальных категориях остаётся.
  const handleCancel = () => {
    if (selectedProductId) {
      setSelectedProductId(null);
    } else {
      router.back();
    }
  };

  const applyEffect = (product: ProductBlueprint) => {
    if (!product.roomEffect) return;
    const { field, value } = product.roomEffect;
    if (field === "cabinetType") setCabinetType(value as any);
    if (field === "posterType") setPosterType(value as any);
    if (field === "wallType") setWallType(value as any);
    if (field === "floorType") setFloorType(value as any);
    if (field === "carpetType") setCarpetType(value as any);
  };

  // «Применить» устанавливает все купленные товары из черновика сразу.
  // Некупленные просто не применяются: примерить можно, установить нельзя.
  const handleApply = () => {
    const owned = useShopStore.getState().ownedProductIds;
    draftProducts
      .filter((p) => isProductOwned(p.id, owned))
      .forEach(applyEffect);
    router.back();
  };

  // Некупленные товары из примерки и их общая стоимость — для кнопки «Купить».
  const unownedDraftProducts = draftProducts.filter(
    (p) => !isProductOwned(p.id, ownedProductIds),
  );
  const totalPrice = unownedDraftProducts.reduce((sum, p) => sum + p.price, 0);
  const hasDrafts = draftProducts.length > 0;
  // Нужна ли покупка — решаем по наличию некупленных, а не по сумме.
  // Иначе предмет с забытой ценой 0 показывал бы «Применить»,
  // но не применялся бы, потому что он не куплен.
  const needsPurchase = unownedDraftProducts.length > 0;

  // Покупает сразу все некупленные товары из примерки одним списанием.
  const handleBuy = () => {
    // Защита от повторной покупки: проверяем по свежему состоянию стора,
    // а не по тому, что сейчас нарисовано на экране. Даже если интерфейс
    // когда-нибудь снова отстанет, монеты второй раз не спишутся.
    const owned = useShopStore.getState().ownedProductIds;
    const toBuy = draftProducts.filter((p) => !isProductOwned(p.id, owned));
    if (toBuy.length === 0) return;

    const total = toBuy.reduce((sum, p) => sum + p.price, 0);
    const success = useProgressStore.getState().spendCoins(total);

    if (!success) {
      Alert.alert("Недостаточно монет", "Заработай ещё немного и возвращайся!");
      return;
    }

    toBuy.forEach((p) => addOwnedProduct(p.id));
  };

  // Превью берёт значение из черновика любой категории,
  // а если там ничего не выбрано — то, что сейчас установлено в комнате.
  const previewCabinetType = getPreviewValue("cabinetType", currentCabinetType);
  const previewPosterType = getPreviewValue("posterType", currentPosterType);
  const previewWallType = getPreviewValue("wallType", currentWallType);
  const previewFloorType = getPreviewValue("floorType", currentFloorType);
  const previewCarpetType = getPreviewValue("carpetType", currentCarpetType);

  return {
    activeDomain,
    activeCategory,
    categories,
    products,
    selectedProduct,
    selectedProductId,
    hasDrafts,
    needsPurchase,
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
  };
}
