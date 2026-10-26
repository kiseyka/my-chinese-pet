// src/components/game/ReverseQuestion.tsx
//
// Обратный вопрос в тренировке перевода: показан перевод, нужно выбрать иероглиф
// из похожих (сетка 2×2). Пиньинь вариантов до ответа скрыт — иначе вопрос
// решался бы по пиньиню, а не по иероглифу. После ответа у верного и выбранного
// варианта появляется пиньинь (место под него зарезервировано: ничего не прыгает)
// и звучит верный иероглиф.

import { getOptionState, type OptionState } from "@/components/game/AnswerOption";
import { Hanzi } from "@/components/ui/Hanzi";
import { Pinyin } from "@/components/ui/Pinyin";
import type { QuizOptionWord } from "@/content/flashcards/types";
import { useSpeakHanzi } from "@/hooks/useSpeakHanzi";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

interface ReverseQuestionProps {
  translation: string;
  options: QuizOptionWord[];
  correctId: string;
  selected: string | null;
  isAnswered: boolean;
  onSelect: (vocabularyId: string) => void;
}

/** Высота блока с переводом — как у иероглифа в прямом вопросе. */
const PROMPT_HEIGHT = 180;

const CELL_STYLES: Record<OptionState, string> = {
  idle: "border-transparent bg-surface active:opacity-70",
  correct: "border-primary bg-primary/15",
  wrong: "border-error bg-error/10",
  dimmed: "border-transparent bg-surface opacity-40",
};

export function ReverseQuestion({
  translation,
  options,
  correctId,
  selected,
  isAnswered,
  onSelect,
}: ReverseQuestionProps) {
  const { t } = useTranslation(["sets"]);
  const { speak } = useSpeakHanzi();

  // После ответа — озвучить верный иероглиф
  const correct = options.find((o) => o.vocabularyId === correctId);
  useEffect(() => {
    if (isAnswered && correct) speak(correct.hanzi);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAnswered]);

  return (
    <View className="flex-col gap-5">
      <View
        style={{ height: PROMPT_HEIGHT }}
        className="items-center justify-center gap-2 px-2"
      >
        <Text className="font-nunito text-small text-textSecondary">
          Какой иероглиф значит
        </Text>
        <Text
          numberOfLines={3}
          adjustsFontSizeToFit
          className="text-center font-nunitoBold text-heading text-text"
        >
          {t(translation)}
        </Text>
      </View>

      <View className="my-3 flex-row flex-wrap justify-between gap-y-3">
        {options.map((option) => {
          const isCorrect = option.vocabularyId === correctId;
          const state = getOptionState(
            isAnswered,
            isCorrect,
            option.vocabularyId === selected,
          );
          const showPinyin =
            isAnswered && (isCorrect || option.vocabularyId === selected);

          return (
            <Pressable
              key={option.vocabularyId}
              onPress={() => onSelect(option.vocabularyId)}
              disabled={isAnswered}
              className={`h-28 items-center justify-center gap-1 rounded-2xl border-2 px-2 ${CELL_STYLES[state]}`}
              style={{ width: "48%" }}
              accessibilityRole="button"
              accessibilityLabel={option.hanzi}
            >
              <Hanzi
                size={Array.from(option.hanzi).length > 2 ? 32 : 44}
                numberOfLines={1}
                adjustsFontSizeToFit
                maxFontSizeMultiplier={1.2}
              >
                {option.hanzi}
              </Hanzi>
              {/* Место под пиньинь есть всегда: после ответа ячейка не растёт */}
              <View style={{ opacity: showPinyin ? 1 : 0 }}>
                <Pinyin size="sm" numberOfLines={1}>
                  {option.pinyin || " "}
                </Pinyin>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
