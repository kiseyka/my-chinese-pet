// content/shop/shopCatalog.ts
import { CABINET_PRODUCTS } from "./products/cabinets";
import { CARPET_PRODUCTS } from "./products/carpets";
import { FLOOR_PRODUCTS } from "./products/floors";
import { POSTER_PRODUCTS } from "./products/posters";
import { WALL_PRODUCTS } from "./products/walls";
import { ProductBlueprint } from "./types";

export const PRODUCTS_BY_CATEGORY: Record<string, ProductBlueprint[]> = {
  cabinets: CABINET_PRODUCTS,
  posters: POSTER_PRODUCTS,
  walls: WALL_PRODUCTS,
  floors: FLOOR_PRODUCTS,
  carpets: CARPET_PRODUCTS,
};

export * from "./categories";
export * from "./types";
