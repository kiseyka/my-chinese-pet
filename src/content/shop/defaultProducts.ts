// content/shop/defaultProducts.ts
//
// Предметы, которые есть у всех с самого начала, без покупки.
// Это отдельный список, а не price: 0 — цена 0 НЕ делает предмет купленным
// (так случайно забытая цена не превратится в бесплатный подарок).
//
// Купленность считается как «есть в ownedProductIds ИЛИ есть в этом списке».
// В стор эти id не записываются, поэтому новый предмет по умолчанию
// появится у всех сразу, даже у тех, у кого стор уже сохранён на телефоне.

export const DEFAULT_PRODUCT_IDS: readonly string[] = [
  "cabinet_00",
  "wall_000",
  "floor_000",
  "carpet_000",
  "poster_00",
  // сюда добавляй остальные предметы по умолчанию: стену, пол, ковёр…
];

export const isDefaultProduct = (productId: string) =>
  DEFAULT_PRODUCT_IDS.includes(productId);
