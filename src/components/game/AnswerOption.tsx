// components/game/AnswerOption.tsx

import { Text, TouchableOpacity } from "react-native";

export type OptionState = "idle" | "correct" | "wrong" | "dimmed";

export const OPTION_STYLES: Record<
  OptionState,
  { button: string; text: string }
> = {
  idle: { button: "bg-surface", text: "text-text" },
  correct: { button: "bg-primary", text: "text-white" },
  wrong: { button: "bg-error", text: "text-white" },
  dimmed: { button: "bg-surface opacity-40", text: "text-text" },
};

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
      className={`rounded-xl py-4 pl-10 ${button}`}
    >
      <Text className={`text-xl font-nunitoMedium ${text}`}>{label}</Text>
    </TouchableOpacity>
  );
}
