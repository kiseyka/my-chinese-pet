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
          router.push(href);
        } else {
          router.back();
        }
      }}
    >
      <BackIcon width={28} height={28} color="#2C241E" />
    </Pressable>
  );
};
