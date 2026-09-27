// content/shop/shopCatalog.ts
import { CABINET_PRODUCTS } from "./products/cabinets";
import { POSTER_PRODUCTS } from "./products/posters";
import { ProductBlueprint } from "./types";

export const PRODUCTS_BY_CATEGORY: Record<string, ProductBlueprint[]> = {
  cabinets: CABINET_PRODUCTS,
  posters: POSTER_PRODUCTS,
};

export * from "./categories";
export * from "./types";
