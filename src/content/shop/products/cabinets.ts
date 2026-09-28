// content/shop/products/cabinets.ts
import cabinet_00 from "@/assets/shop-cards/cabinets/cabinet_00.png";
import cabinet_01 from "@/assets/shop-cards/cabinets/cabinet_01.png";
import { ProductBlueprint } from "../types";

export const CABINET_PRODUCTS: ProductBlueprint[] = [
  {
    id: "cabinet_00",
    name: "Цветочная стойка",
    price: 0,
    image: cabinet_00,
    roomEffect: { field: "cabinetType", value: "cabinet_00" },
  },
  {
    id: "cabinet_01",
    name: "Цветочный шкаф",
    price: 10,
    image: cabinet_01,
    roomEffect: { field: "cabinetType", value: "cabinet_01" },
  },
];
