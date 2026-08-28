// components/game/FlashcardQuestion.tsx

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

const getHanziFontSize = (length: number) => {
  if (length <= 2) return 84;
  if (length === 3) return 68;
  if (length === 4) return 56;
  if (length === 5) return 46;
  if (length === 6) return 40;
  return 34;
};

const HANZI_BLOCK_HEIGHT = 180;

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
  const answeredCorrectly = isAnswered && selected === correctAnswer;

  useEffect(() => {
    speak(hanzi);
  }, [hanzi]);

  return (
    <View className="flex-col gap-5">
      <View
        style={{ height: HANZI_BLOCK_HEIGHT }}
        className="justify-center items-center"
      >
        <TouchableOpacity
          onPress={() => speakForced(hanzi)}
          activeOpacity={0.6}
        >
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.4}
            className="text-text mt-8 mb-4"
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

      <View className="flex-col self-end w-full my-3 gap-y-3">
        {options.map((option) => {
          const isCorrect = option === correctAnswer;
          const isSelected = option === selected;

          let buttonStyle = "bg-background border border-border/50";
          let textStyle = "text-text";
          let containerStyle = "";

          if (isAnswered) {
            if (answeredCorrectly) {
              // Пользователь угадал: правильный — оливковый, остальные тускнеют
              if (isCorrect) {
                buttonStyle = "bg-primary border border-primary";
                textStyle = "text-white";
              } else {
                containerStyle = "opacity-40";
              }
            } else {
              // Пользователь ошибся: его выбор — бежевый, правильный — оливковый, остальные тускнеют
              if (isSelected) {
                buttonStyle = "bg-accentBeige border border-accentBeige";
              } else if (isCorrect) {
                buttonStyle = "bg-primary border border-primary";
                textStyle = "text-white";
              } else {
                containerStyle = "opacity-40";
              }
            }
          }

          return (
            <TouchableOpacity
              key={option}
              disabled={isAnswered}
              onPress={() => onSelect(option)}
              className={`rounded-xl ${buttonStyle} ${containerStyle}`}
            >
              <Text
                className={`py-4 pl-10 rounded-xl text-xl font-['NunitoMedium'] ${textStyle}`}
              >
                {t(option)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
