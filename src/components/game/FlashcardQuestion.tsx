// components/game/FlashcardQuestion.tsx

import { useTranslation } from "react-i18next";
import { Text, TouchableOpacity, View } from "react-native";

interface FlashcardQuestionProps {
  hanzi: string;
  pinyin: string;
  options: string[];
  correctAnswer: string;
  selected: string | null;
  isAnswered: boolean;
  onSelect: (option: string) => void;
}

export function FlashcardQuestion({
  hanzi,
  pinyin,
  options,
  correctAnswer,
  selected,
  isAnswered,
  onSelect,
}: FlashcardQuestionProps) {
  const { t } = useTranslation();

  return (
    <View className="flex-col gap-5">
      <View className="py-10">
        <Text
          className="text-text mb-4"
          style={{
            lineHeight: 100,
            fontSize: 84,
            textAlign: "center",
            fontFamily: "NotoSansSC",
          }}
        >
          {hanzi}
        </Text>

        <Text className="text-center text-xl text-primary">{pinyin}</Text>
      </View>

      <Text className="text-center text-lg text-text">
        Как переводится этот иероглиф?
      </Text>

      <View className="flex-col w-full my-3 gap-y-3">
        {options.map((option) => {
          const isCorrect = option === correctAnswer;
          const isSelected = option === selected;

          let buttonStyle = "bg-background border border-border/50";

          if (isAnswered) {
            if (isCorrect) {
              buttonStyle = "bg-[#7A8265]";
            } else if (isSelected) {
              buttonStyle = "bg-primary";
            }
          }

          const textStyle =
            isAnswered && (isCorrect || isSelected)
              ? "text-white"
              : "text-text";

          return (
            <TouchableOpacity
              key={option}
              disabled={isAnswered}
              onPress={() => onSelect(option)}
              className={`rounded-xl ${buttonStyle}`}
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
