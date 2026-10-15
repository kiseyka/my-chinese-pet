// src/components/word/WordHeader.tsx
//
// Шапка панели слова — общая для карточек и «Написания»: иероглиф, пиньинь со значком
// звука и перевод. Тап по иероглифу или пиньиню — озвучка (даже при выключенном звуке).
// Перевод — в одну строку с «…»; если он не влез, тап по нему открывает тултип
// с полным переводом.
//
// Тултипом перевода может управлять родитель (translationHint*), чтобы одновременно
// был открыт только один тултип окна; без этих пропсов — своё состояние.

import VolumeIcon from "@/assets/images/icons/volume.svg";
import { Hanzi } from "@/components/ui/Hanzi";
import { Pinyin } from "@/components/ui/Pinyin";
import { TOOLTIP_RAISED, Tooltip } from "@/components/ui/Tooltip";
import { useSpeakHanzi } from "@/hooks/useSpeakHanzi";
import { colors } from "@/theme/colors";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

interface WordHeaderProps {
  hanzi: string;
  pinyin: string;
  /** Уже переведённый текст. */
  translation: string;
  /** Тултип полного перевода открыт (если управляет родитель). */
  translationHintVisible?: boolean;
  onToggleTranslationHint?: () => void;
  onCloseTranslationHint?: () => void;
}

/** Крупно для коротких слов; длинные фразы мельче и переносятся. */
function headerHanziSize(hanzi: string): number | "lg" {
  const length = Array.from(hanzi).length;
  if (length <= 4) return "lg";
  if (length <= 6) return 44;
  return 36;
}

export function WordHeader({
  hanzi,
  pinyin,
  translation,
  translationHintVisible,
  onToggleTranslationHint,
  onCloseTranslationHint,
}: WordHeaderProps) {
  const { speakForced } = useSpeakHanzi();
  const speak = () => speakForced(hanzi);

  // Свой тултип, если родитель им не управляет
  const [ownHint, setOwnHint] = useState(false);
  const controlled = translationHintVisible !== undefined;
  const hintVisible = controlled ? translationHintVisible : ownHint;
  const toggleHint = controlled
    ? (onToggleTranslationHint ?? (() => {}))
    : () => setOwnHint((value) => !value);
  const closeHint = controlled
    ? (onCloseTranslationHint ?? (() => {}))
    : () => setOwnHint(false);

  // Влез ли перевод в одну строку. Пока не измерен — считаем, что влез
  const [truncated, setTruncated] = useState(false);
  useEffect(() => {
    setTruncated(false);
    setOwnHint(false);
  }, [translation]);

  return (
    <View
      className="items-center gap-1"
      style={hintVisible ? TOOLTIP_RAISED : undefined}
    >
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

      <View className="self-stretch">
        <Tooltip
          visible={hintVisible && truncated}
          onClose={closeHint}
          text={translation}
        >
          <Pressable
            onPress={toggleHint}
            disabled={!truncated}
            className="active:opacity-60"
            accessibilityRole={truncated ? "button" : "text"}
            accessibilityLabel={translation}
            accessibilityHint={truncated ? "Показать перевод целиком" : undefined}
          >
            {/* Невидимая копия без ограничения строк: по ней видно, влез ли перевод */}
            <Text
              className="absolute left-0 right-0 text-center font-nunito text-body opacity-0"
              onTextLayout={(event) =>
                setTruncated(event.nativeEvent.lines.length > 1)
              }
              accessible={false}
              importantForAccessibility="no-hide-descendants"
              pointerEvents="none"
            >
              {translation}
            </Text>
            <Text
              className="text-center font-nunito text-body text-text"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {translation}
            </Text>
          </Pressable>
        </Tooltip>
      </View>
    </View>
  );
}
