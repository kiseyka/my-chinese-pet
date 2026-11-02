// src/components/game/PinyinQuestion.tsx
//
// Вопрос про чтение: показан иероглиф, выбрать пиньинь. Неверные варианты — то же
// слово с другими тонами (mǎi / māi / mái / mài), так что вопрос проверяет тоны.
// Пока не ответил, иероглиф не озвучивается (иначе ответ был бы на слух) и тап по
// нему ничего не делает. После ответа звучит слово, тап по иероглифу — ещё раз.
// Иероглиф стоит там же, где в прямом вопросе, варианты — те же плашки ответа.

import { AnswerOption, getOptionState } from "@/components/game/AnswerOption";
import { useSpeakHanzi } from "@/hooks/useSpeakHanzi";
import { useEffect } from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface PinyinQuestionProps {
  hanzi: string;
  options: string[];
  correctAnswer: string;
  selected: string | null;
  isAnswered: boolean;
  onSelect: (option: string) => void;
}

// Как в FlashcardQuestion: размер по числу иероглифов, высота блока одна
const HANZI_FONT_SIZES = [84, 84, 84, 68, 56, 46, 40];
const HANZI_MIN_FONT_SIZE = 34;
const HANZI_BLOCK_HEIGHT = 180;

export function PinyinQuestion({
  hanzi,
  options,
  correctAnswer,
  selected,
  isAnswered,
  onSelect,
}: PinyinQuestionProps) {
  const { speak, speakForced } = useSpeakHanzi();
  const fontSize =
    HANZI_FONT_SIZES[Array.from(hanzi).length] ?? HANZI_MIN_FONT_SIZE;

  // Озвучка — только после ответа
  useEffect(() => {
    if (isAnswered) speak(hanzi);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAnswered]);

  return (
    <View className="flex-col gap-5">
      <View
        style={{ height: HANZI_BLOCK_HEIGHT }}
        className="items-center justify-center"
      >
        <TouchableOpacity
          onPress={() => speakForced(hanzi)}
          disabled={!isAnswered}
          activeOpacity={0.6}
          accessibilityHint={isAnswered ? "Послушать" : undefined}
        >
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.4}
            className="mb-4 mt-8 text-text"
            style={{
              lineHeight: fontSize * 1.2,
              fontSize,
              textAlign: "center",
              fontFamily: "NotoSansSC",
            }}
          >
            {hanzi}
          </Text>
        </TouchableOpacity>

        <Text className="font-nunito text-small text-textSecondary">
          Как читается?
        </Text>
      </View>

      <View className="my-3 w-full flex-col gap-y-3">
        {options.map((option) => (
          <AnswerOption
            key={option}
            label={option}
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
