// content/shop/types.ts
import { ImageSourcePropType } from "react-native";

export type RoomField =
  | "cabinetType"
  | "posterType"
  | "wallType"
  | "floorType"
  | "carpetType";

export type ProductBlueprint = {
  id: string;
  name: string;
  price: number;
  image: ImageSourcePropType;
  // Только для товаров, которые реально применяются в комнате.
  roomEffect?: { field: RoomField; value: string };
};

export type Product = ProductBlueprint & {
  owned: boolean;
  equipped: boolean;
};
