// FavoriteButton.tsx
import StarSvgRaw from "@/assets/images/icons/star.svg";
import { interopIcon } from "@/lib/interopIcon";
import { Pressable } from "react-native";

const StarSvg = interopIcon(StarSvgRaw);

type FavoriteButtonProps = {
  isFavorite: boolean;
  onToggle?: () => void;
  size?: number;
};

export function FavoriteButton({
  isFavorite,
  onToggle,
  size = 22,
}: FavoriteButtonProps) {
  return (
    <Pressable onPress={onToggle} hitSlop={18}>
      <StarSvg
        height={size}
        width={size}
        className={
          isFavorite
            ? "fill-primary stroke-primary"
            : "fill-none stroke-primary"
        }
        strokeWidth={1}
      />
    </Pressable>
  );
}
