// components/ui/BackButton.tsx
//
// Стрелка «назад».
//   href — куда вернуться: router.navigate переходит к уже открытому экрану
//          (вкладки держат экран панды живым — его анимации не грузятся заново).
//          Не push: push строил поверх стопки новую копию экрана, и каждый выход
//          стрелкой заново загружал Rive и копил экраны в памяти.
//   без href — router.back().
// Область нажатия больше самой стрелки: 44 × 44 и hitSlop.

import BackIcon from "@/assets/images/icons/arrow-left.svg";
import { useRouter, type Href } from "expo-router";
import { Pressable } from "react-native";

type BackButtonProps = {
  href?: Href;
};

export const BackButton = ({ href }: BackButtonProps) => {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => {
        if (href) {
          router.navigate(href);
        } else {
          router.back();
        }
      }}
      hitSlop={10}
      className="h-11 w-11 items-start justify-center active:opacity-60"
      accessibilityRole="button"
      accessibilityLabel="Назад"
    >
      <BackIcon width={28} height={28} color="#4A4A4A" />
    </Pressable>
  );
};
