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

  // Влез ли перевод в одну строку: сравниваем ширину строки перевода без переносов
  // (невидимая копия в очень широком блоке) с шириной места под перевод.
  // Пока не измерено (null) — тап всё равно открывает полный перевод.
  const [boxWidth, setBoxWidth] = useState<number | null>(null);
  const [textWidth, setTextWidth] = useState<number | null>(null);
  useEffect(() => {
    setTextWidth(null);
    setOwnHint(false);
  }, [translation]);
  const fits =
    boxWidth !== null && textWidth !== null ? textWidth <= boxWidth + 1 : null;
  const canExpand = fits !== true;

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

      <View
        className="self-stretch"
        onLayout={(event) => setBoxWidth(event.nativeEvent.layout.width)}
      >
        {/* Невидимая копия в одну строку без ограничения ширины: её ширина —
            сколько места нужно переводу целиком */}
        <View
          style={{ position: "absolute", left: 0, top: 0, width: 10000, opacity: 0 }}
          pointerEvents="none"
          importantForAccessibility="no-hide-descendants"
        >
          <Text
            className="self-start font-nunito text-body"
            numberOfLines={1}
            onTextLayout={(event) =>
              setTextWidth(event.nativeEvent.lines[0]?.width ?? 0)
            }
          >
            {translation}
          </Text>
        </View>

        <Tooltip
          visible={hintVisible && canExpand}
          onClose={closeHint}
          text={translation}
        >
          <Pressable
            onPress={toggleHint}
            disabled={!canExpand}
            className="active:opacity-60"
            accessibilityRole={canExpand ? "button" : "text"}
            accessibilityLabel={translation}
            accessibilityHint={
              canExpand ? "Показать перевод целиком" : undefined
            }
          >
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
