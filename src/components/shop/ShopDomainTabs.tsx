import ClothingIcon from "@/assets/images/category/cloth.svg";
import FurnitureIcon from "@/assets/images/category/furniture.svg";
import PlantIcon from "@/assets/images/category/plant.svg";
import { Domain } from "@/content/shop/shopCatalog";
import { Pressable, Text, View } from "react-native";
import type { SvgProps } from "react-native-svg";

type ShopDomainTabsProps = {
  activeDomain: Domain;
  onChange: (id: Domain) => void;
};

type DomainMeta = {
  id: Domain;
  label: string;
  icon: React.FC<SvgProps> | string;
};

const DOMAINS: DomainMeta[] = [
  { id: "interior", label: "Мебель", icon: FurnitureIcon },
  { id: "clothing", label: "Одежда", icon: ClothingIcon },
  { id: "flowers", label: "Растения", icon: PlantIcon }, // TODO: заменить на свой svg
];

export const ShopDomainTabs = ({
  activeDomain,
  onChange,
}: ShopDomainTabsProps) => {
  return (
    <View className="flex-row justify-between gap-1 px-2">
      {DOMAINS.map((domain) => {
        const isActive = domain.id === activeDomain;
        const isEmojiIcon = typeof domain.icon === "string";
        const DomainIcon = isEmojiIcon
          ? null
          : (domain.icon as React.FC<SvgProps>);

        return (
          <Pressable
            key={domain.id}
            onPress={() => onChange(domain.id)}
            className={`flex-1 flex-row items-center justify-center gap-1 py-3.5 px-2 rounded-t-2xl border-t border-l border-r ${
              isActive
                ? "bg-primary border-primary"
                : "bg-[#E8DAC3] border-[#D8C3A3]"
            }`}
          >
            {isEmojiIcon ? (
              <Text className="text-base">{domain.icon as string}</Text>
            ) : (
              DomainIcon && (
                <DomainIcon
                  width={28}
                  height={28}
                  color={isActive ? "#ffffff" : "#9EA792"}
                />
              )
            )}
            <Text
              className={`font-nunito text-lg ${
                isActive ? "text-white" : "text-[#967F67]"
              }`}
            >
              {domain.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};
