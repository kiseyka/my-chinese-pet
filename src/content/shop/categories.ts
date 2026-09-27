// content/shop/categories.ts
import CabinetsIcon from "@/assets/images/category/cabinet.svg";
import CarpetsIcon from "@/assets/images/category/carpet.svg";
import ClothingIcon from "@/assets/images/category/cloth.svg";
import CurtainsIcon from "@/assets/images/category/curtain.svg";
import FloorsIcon from "@/assets/images/category/floor.svg";

import PaintsIcon from "@/assets/images/category/poster.svg";
import TablesIcon from "@/assets/images/category/table.svg";
import WallsIcon from "@/assets/images/category/wall.svg";
import WindowsIcon from "@/assets/images/category/window.svg";
import { SvgProps } from "react-native-svg";

export type Domain = "clothing" | "interior" | "flowers";

export type Category = {
  id: string;
  label: string;
  icon: React.FC<SvgProps>;
};

export const CATEGORIES_BY_DOMAIN: Record<Domain, Category[]> = {
  interior: [
    { id: "cabinets", label: "Шкафы", icon: CabinetsIcon },
    { id: "walls", label: "Стены", icon: WallsIcon },
    { id: "floor", label: "Полы", icon: FloorsIcon },
    { id: "carpets", label: "Ковры", icon: CarpetsIcon },
    { id: "cupboards", label: "Тумбы", icon: TablesIcon },
    { id: "windows", label: "Окна", icon: WindowsIcon },
    { id: "curtains", label: "Шторы", icon: CurtainsIcon },
    { id: "posters", label: "Плакаты", icon: PaintsIcon },
  ],
  clothing: [
    { id: "hats", label: "Шляпы", icon: ClothingIcon },
    { id: "scarves", label: "Шарфы", icon: ClothingIcon },
  ],
  flowers: [],
};
