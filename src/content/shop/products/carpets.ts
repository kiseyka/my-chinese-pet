// content/shop/products/carpets.ts
import carpet_000 from "@/assets/shop-cards/carpets/carpet_000.png";
import carpet_001 from "@/assets/shop-cards/carpets/carpet_001.png";
import carpet_002 from "@/assets/shop-cards/carpets/carpet_002.png";
import carpet_003 from "@/assets/shop-cards/carpets/carpet_003.png";
import carpet_004 from "@/assets/shop-cards/carpets/carpet_004.png";
import carpet_005 from "@/assets/shop-cards/carpets/carpet_005.png";
import carpet_006 from "@/assets/shop-cards/carpets/carpet_006.png";

import { ProductBlueprint } from "../types";

export const CARPET_PRODUCTS: ProductBlueprint[] = [
  {
    id: "carpet_000",
    name: "Постер Бамбук",
    price: 0,
    image: carpet_000,
    roomEffect: { field: "carpetType", value: "carpet_000" },
  },
  {
    id: "carpet_001",
    name: "Постер Сакура",
    price: 0,
    image: carpet_001,
    roomEffect: { field: "carpetType", value: "carpet_001" },
  },
  {
    id: "carpet_002",
    name: "Постер Пейзаж",
    price: 0,
    image: carpet_002,
    roomEffect: { field: "carpetType", value: "carpet_002" },
  },
  {
    id: "carpet_003",
    name: "Постер Котята",
    price: 10,
    image: carpet_003,
    roomEffect: { field: "carpetType", value: "carpet_003" },
  },
  {
    id: "carpet_004",
    name: "Постер Космос",
    price: 10,
    image: carpet_004,
    roomEffect: { field: "carpetType", value: "carpet_004" },
  },
  {
    id: "carpet_005",
    name: "Постер Океан",
    price: 15,
    image: carpet_005,
    roomEffect: { field: "carpetType", value: "carpet_005" },
  },
  {
    id: "carpet_006",
    name: "Постер Горы",
    price: 15,
    image: carpet_006,
    roomEffect: { field: "carpetType", value: "carpet_006" },
  },
];
