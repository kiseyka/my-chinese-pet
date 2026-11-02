// components/game/AnswerOption.tsx
//
// Вариант ответа и его состояния. Верный ответ — шалфей с оливковой рамкой и
// галочкой (тот же цвет, что у изученных слов), неверный — приглушённая терракота
// с крестиком. Значки нужны, чтобы не полагаться только на бледные цвета.
// Рамка есть у всех состояний (у обычного — прозрачная): после ответа ничего не прыгает.

import CheckIcon from "@/assets/images/icons/circle-check.svg";
import CrossIcon from "@/assets/images/icons/circle-x.svg";
import { colors } from "@/theme/colors";
import { Text, TouchableOpacity, View } from "react-native";

export type OptionState = "idle" | "correct" | "wrong" | "dimmed";

export const OPTION_STYLES: Record<
  OptionState,
  { button: string; text: string }
> = {
  idle: { button: "border-transparent bg-surface", text: "text-text" },
  correct: { button: "border-primary bg-learned", text: "text-text" },
  wrong: { button: "border-wrongBorder bg-wrong", text: "text-text" },
  dimmed: { button: "border-transparent bg-surface opacity-40", text: "text-text" },
};

/** Значок состояния: галочка у верного, крестик у неверного. */
export function OptionMark({
  state,
  size = 22,
}: {
  state: OptionState;
  size?: number;
}) {
  if (state === "correct")
    return <CheckIcon width={size} height={size} color={colors.primary} />;
  if (state === "wrong")
    return <CrossIcon width={size} height={size} color={colors.error} />;
  return null;
}

export function getOptionState(
  isAnswered: boolean,
  isCorrect: boolean,
  isSelected: boolean,
): OptionState {
  if (!isAnswered) return "idle";
  if (isCorrect) return "correct";
  if (isSelected) return "wrong";
  return "dimmed";
}

interface AnswerOptionProps {
  label: string;
  state: OptionState;
  disabled: boolean;
  onPress: () => void;
}

export function AnswerOption({
  label,
  state,
  disabled,
  onPress,
}: AnswerOptionProps) {
  const { button, text } = OPTION_STYLES[state];

  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={onPress}
      className={`flex-row items-center rounded-xl border-2 py-4 pl-10 pr-4 ${button}`}
    >
      <Text className={`flex-1 text-xl font-nunitoMedium ${text}`}>
        {label}
      </Text>
      {/* Место под значок есть всегда */}
      <View className="h-6 w-6 items-center justify-center">
        <OptionMark state={state} />
      </View>
    </TouchableOpacity>
  );
}
