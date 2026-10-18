// components/ui/ReviewButton.tsx
//
// Закладка «Повторение»: залита — слово в списке повторения.

import BookmarkSvgRaw from "@/assets/images/icons/bookmark.svg";
import { interopIcon } from "@/lib/interopIcon";
import { Pressable } from "react-native";

const BookmarkSvg = interopIcon(BookmarkSvgRaw);

type ReviewButtonProps = {
  inReview: boolean;
  onToggle?: () => void;
  size?: number;
};

export function ReviewButton({
  inReview,
  onToggle,
  size = 22,
}: ReviewButtonProps) {
  return (
    <Pressable
      onPress={onToggle}
      hitSlop={18}
      accessibilityRole="button"
      accessibilityState={{ selected: inReview }}
      accessibilityLabel={inReview ? "Убрать из повторения" : "В повторение"}
    >
      <BookmarkSvg
        height={size}
        width={size}
        className={
          inReview ? "fill-primary stroke-primary" : "fill-none stroke-primary"
        }
        strokeWidth={1.5}
      />
    </Pressable>
  );
}
