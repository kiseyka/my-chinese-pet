// store/shopStore.ts
//
// Владение товарами магазина — отдельный source of truth от roomStore.
// roomStore хранит ЧТО СЕЙЧАС ПРИМЕНЕНО (cabinetType и т.д.),
// shopStore хранит ЧТО ВООБЩЕ КУПЛЕНО. Это разные вещи: можно владеть
// шкафом, но сейчас показывать стойку.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface ShopState {
  ownedProductIds: string[];
  isOwned: (productId: string) => boolean;
  addOwnedProduct: (productId: string) => void;
}

export const useShopStore = create<ShopState>()(
  persist(
    (set, get) => ({
      // flower_stand — стартовый предмет, есть у всех по умолчанию.
      ownedProductIds: ["flower_stand"],
      isOwned: (productId) => get().ownedProductIds.includes(productId),
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
