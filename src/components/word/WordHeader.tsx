// src/components/word/WordHeader.tsx
//
// Шапка панели слова — общая для карточек и «Написания»: иероглиф, пиньинь со значком
// звука и перевод. Тап по иероглифу или пиньиню — озвучка (даже при выключенном звуке).

import VolumeIcon from "@/assets/images/icons/volume.svg";
import { Hanzi } from "@/components/ui/Hanzi";
import { Pinyin } from "@/components/ui/Pinyin";
import { useSpeakHanzi } from "@/hooks/useSpeakHanzi";
import { colors } from "@/theme/colors";
import { Pressable, Text, View } from "react-native";

interface WordHeaderProps {
  hanzi: string;
  pinyin: string;
  /** Уже переведённый текст. */
  translation: string;
}

/** Крупно для коротких слов; длинные фразы мельче и переносятся. */
function headerHanziSize(hanzi: string): number | "lg" {
  const length = Array.from(hanzi).length;
  if (length <= 4) return "lg";
  if (length <= 6) return 44;
  return 36;
}

export function WordHeader({ hanzi, pinyin, translation }: WordHeaderProps) {
  const { speakForced } = useSpeakHanzi();
  const speak = () => speakForced(hanzi);

  return (
    <View className="items-center gap-1">
      <Pressable
        onPress={speak}
        className="active:opacity-60"
        accessibilityRole="button"
        accessibilityLabel={`${hanzi}: послушать`}
      >
        <Hanzi
          size={headerHanziSize(hanzi)}
          numberOfLines={2}
          className="text-center"
        >
          {hanzi}
        </Hanzi>
      </Pressable>

      <Pressable
        onPress={speak}
        className="flex-row items-center gap-2 active:opacity-60"
        accessibilityRole="button"
        accessibilityLabel="Послушать"
        hitSlop={8}
      >
        <Pinyin size="md">{pinyin}</Pinyin>
        <VolumeIcon width={20} height={20} color={colors.primary} />
      </Pressable>

      <Text
        className="text-center font-nunito text-body text-text"
        numberOfLines={2}
      >
        {translation}
      </Text>
    </View>
  );
}
