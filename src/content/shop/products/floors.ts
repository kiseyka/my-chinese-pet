// content/shop/products/floors.ts
import floor_000 from "@/assets/shop-cards/floors/floor_000.png";
import floor_001 from "@/assets/shop-cards/floors/floor_001.png";
import floor_002 from "@/assets/shop-cards/floors/floor_002.png";
import floor_003 from "@/assets/shop-cards/floors/floor_003.png";
import floor_004 from "@/assets/shop-cards/floors/floor_004.png";
import floor_005 from "@/assets/shop-cards/floors/floor_005.png";
import floor_006 from "@/assets/shop-cards/floors/floor_006.png";
import floor_007 from "@/assets/shop-cards/floors/floor_007.png";
import floor_008 from "@/assets/shop-cards/floors/floor_008.png";
import floor_009 from "@/assets/shop-cards/floors/floor_009.png";
import floor_010 from "@/assets/shop-cards/floors/floor_010.png";
import floor_011 from "@/assets/shop-cards/floors/floor_011.png";
import floor_012 from "@/assets/shop-cards/floors/floor_012.png";

import { ProductBlueprint } from "../types";

export const FLOOR_PRODUCTS: ProductBlueprint[] = [
  {
    id: "floor_000",
    name: "Постер Бамбук",
    price: 0,
    image: floor_000,
    roomEffect: { field: "floorType", value: "floor_000" },
  },
  {
    id: "floor_001",
    name: "Постер Сакура",
    price: 0,
    image: floor_001,
    roomEffect: { field: "floorType", value: "floor_001" },
  },
  {
    id: "floor_002",
    name: "Постер Пейзаж",
    price: 0,
    image: floor_002,
    roomEffect: { field: "floorType", value: "floor_002" },
  },
  {
    id: "floor_003",
    name: "Постер Котята",
    price: 10,
    image: floor_003,
    roomEffect: { field: "floorType", value: "floor_003" },
  },
  {
    id: "floor_004",
    name: "Постер Космос",
    price: 10,
    image: floor_004,
    roomEffect: { field: "floorType", value: "floor_004" },
  },
  {
    id: "floor_005",
    name: "Постер Океан",
    price: 15,
    image: floor_005,
    roomEffect: { field: "floorType", value: "floor_005" },
  },
  {
    id: "floor_006",
    name: "Постер Горы",
    price: 15,
    image: floor_006,
    roomEffect: { field: "floorType", value: "floor_006" },
  },
  {
    id: "floor_007",
    name: "Постер Лес",
    price: 20,
    image: floor_007,
    roomEffect: { field: "floorType", value: "floor_007" },
  },
  {
    id: "floor_008",
    name: "Постер Закат",
    price: 20,
    image: floor_008,
    roomEffect: { field: "floorType", value: "floor_008" },
  },
  {
    id: "floor_009",
    name: "Постер Ночной город",
    price: 25,
    image: floor_009,
    roomEffect: { field: "floorType", value: "floor_009" },
  },
  {
    id: "floor_010",
    name: "Постер Абстракция",
    price: 25,
    image: floor_010,
    roomEffect: { field: "floorType", value: "floor_010" },
  },
  {
    id: "floor_011",
    name: "Постер Цветы",
    price: 50,
    image: floor_011,
    roomEffect: { field: "floorType", value: "floor_011" },
  },
  {
    id: "floor_012",
    name: "Постер Море",
    price: 50,
    image: floor_012,
    roomEffect: { field: "floorType", value: "floor_012" },
  },
];
