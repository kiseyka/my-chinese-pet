// src/components/writing/gallery/SavableHanzi.tsx
//
// Превью написания на экране итогов с маленьким значком «в галерею» в углу.
// Тап по превью — окно сохранения (GallerySaveDialog).

import ImagePlusIcon from "@/assets/images/icons/image-plus.svg";
import type { WritingPoint } from "@/store/gameStore";
import { colors } from "@/theme/colors";
import { Pressable, View } from "react-native";
import { HanziView } from "../canvas/HanziView";

interface SavableHanziProps {
  hanzi: string;
  strokes: WritingPoint[][];
  size: number;
  onSave: (hanzi: string, strokes: WritingPoint[][]) => void;
}

export function SavableHanzi({
  hanzi,
  strokes,
  size,
  onSave,
}: SavableHanziProps) {
  const disabled = strokes.length === 0;

  return (
    <Pressable
      onPress={() => onSave(hanzi, strokes)}
      disabled={disabled}
      className="active:opacity-70"
      accessibilityRole="button"
      accessibilityLabel={`${hanzi}: сохранить в галерею`}
    >
      <HanziView size={size} rawStrokes={strokes} />
      {!disabled && (
        <View
          className="absolute items-center justify-center rounded-full bg-surface"
          style={{ right: -4, bottom: -4, width: 22, height: 22 }}
        >
          <ImagePlusIcon width={14} height={14} color={colors.primary} />
        </View>
      )}
    </Pressable>
  );
}
