// content/shop/products/posters.ts
import poster_00 from "@/assets/shop-cards/posters/poster_00.png";
import poster_01 from "@/assets/shop-cards/posters/poster_01.png";
import poster_02 from "@/assets/shop-cards/posters/poster_02.png";
import poster_03 from "@/assets/shop-cards/posters/poster_03.png";
import poster_04 from "@/assets/shop-cards/posters/poster_04.png";
import { ProductBlueprint } from "../types";

export const POSTER_PRODUCTS: ProductBlueprint[] = [
  {
    id: "poster_00",
    name: "Постер Бамбук",
    price: 0,
    image: poster_00,
    roomEffect: { field: "posterType", value: "poster_00" },
  },
  {
    id: "poster_01",
    name: "Постер Сакура",
    price: 20,
    image: poster_01,
    roomEffect: { field: "posterType", value: "poster_01" },
  },
  {
    id: "poster_02",
    name: "Постер Пейзаж",
    price: 20,
    image: poster_02,
    roomEffect: { field: "posterType", value: "poster_02" },
  },
  {
    id: "poster_03",
    name: "Постер Котята",
    price: 40,
    image: poster_03,
    roomEffect: { field: "posterType", value: "poster_03" },
  },
  {
    id: "poster_04",
    name: "Постер Космос",
    price: 40,
    image: poster_04,
    roomEffect: { field: "posterType", value: "poster_04" },
  },
];
