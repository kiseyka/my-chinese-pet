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

// Подбираем размер шрифта под длину иероглифа,
// чтобы он всегда помещался в 1 строку
const getHanziFontSize = (length: number) => {
  if (length <= 2) return 84;
  if (length === 3) return 68;
  if (length === 4) return 56;
  if (length === 5) return 46;
  if (length === 6) return 40;
  return 34; // 7+ символов
};

// Фиксированная высота блока с иероглифом + пиньинем,
// чтобы низ карточки (вопрос, варианты) никогда не "прыгал"
const HANZI_BLOCK_HEIGHT = 180;

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
  const hanziFontSize = getHanziFontSize(hanzi.length);

  return (
    <View className="flex-col gap-5">
      <View
        style={{ height: HANZI_BLOCK_HEIGHT }}
        className="justify-center items-center"
      >
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.4}
          className="text-text mb-4"
          style={{
            lineHeight: hanziFontSize * 1.2,
            fontSize: hanziFontSize,
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
