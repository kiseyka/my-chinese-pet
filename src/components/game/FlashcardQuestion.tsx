// components/game/FlashcardQuestion.tsx

import { AnswerOption, getOptionState } from "@/components/game/AnswerOption";
import { useSpeakHanzi } from "@/hooks/useSpeakHanzi";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Text, TouchableOpacity, View } from "react-native";

interface FlashcardQuestionProps {
  hanzi: string;
  pinyin: string;
  options: string[];
  correctAnswer: string;
  selected: string | null;
  isAnswered: boolean;
  showPinyin: boolean;
  onSelect: (option: string) => void;
}

// Размер шрифта по количеству иероглифов (индекс = длина)
const HANZI_FONT_SIZES = [84, 84, 84, 68, 56, 46, 40];
const HANZI_MIN_FONT_SIZE = 34;
const HANZI_BLOCK_HEIGHT = 180;

const getHanziFontSize = (length: number) =>
  HANZI_FONT_SIZES[length] ?? HANZI_MIN_FONT_SIZE;

export function FlashcardQuestion({
  hanzi,
  pinyin,
  options,
  correctAnswer,
  selected,
  isAnswered,
  showPinyin,
  onSelect,
}: FlashcardQuestionProps) {
  const { t } = useTranslation(["sets"]);
  const { speak, speakForced } = useSpeakHanzi();

  const hanziFontSize = getHanziFontSize(hanzi.length);

  useEffect(() => {
    speak(hanzi);
  }, [hanzi, speak]);

  return (
    <View className="flex-col gap-5">
      <View
        style={{ height: HANZI_BLOCK_HEIGHT }}
        className="items-center justify-center"
      >
        <TouchableOpacity
          onPress={() => speakForced(hanzi)}
          activeOpacity={0.6}
        >
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.4}
            className="mb-4 mt-8 text-text"
            style={{
              lineHeight: hanziFontSize * 1.2,
              fontSize: hanziFontSize,
              textAlign: "center",
              fontFamily: "NotoSansSC",
            }}
          >
            {hanzi}
          </Text>
        </TouchableOpacity>

        <Text
          className="text-center text-xl text-primary"
          style={{ opacity: showPinyin ? 1 : 0 }}
        >
          {pinyin}
        </Text>
      </View>

      <View className="my-3 w-full flex-col gap-y-3">
        {options.map((option) => (
          <AnswerOption
            key={option}
            label={t(option)}
            state={getOptionState(
              isAnswered,
              option === correctAnswer,
              option === selected,
            )}
            disabled={isAnswered}
            onPress={() => onSelect(option)}
          />
        ))}
      </View>
    </View>
  );
}
