// store/shopStore.ts
//
// Владение товарами магазина — отдельный source of truth от roomStore.
// roomStore хранит ЧТО СЕЙЧАС ПРИМЕНЕНО (cabinetType и т.д.),
// shopStore хранит ЧТО КУПЛЕНО. Это разные вещи: можно владеть
// шкафом, но сейчас показывать стойку.
//
// Предметы по умолчанию сюда НЕ записываются — они перечислены
// в content/shop/defaultProducts.ts и считаются купленными всегда.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface ShopState {
  ownedProductIds: string[];
  addOwnedProduct: (productId: string) => void;
}

export const useShopStore = create<ShopState>()(
  persist(
    (set) => ({
      ownedProductIds: [],
      addOwnedProduct: (productId) =>
        set((state) =>
          state.ownedProductIds.includes(productId)
            ? state
            : { ownedProductIds: [...state.ownedProductIds, productId] },
        ),
    }),
    {
      name: "shop_state",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
