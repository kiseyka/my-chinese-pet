// src/components/writing/results/ExamResultsList.tsx
//
// Итоги экзамена по письму: печать, «Сдано N из M» и строка на каждое слово —
// твоё написание, слово и вердикт (галочка или «через сутки» / «−1 точка»).

import CheckIcon from "@/assets/images/icons/circle-check.svg";
import { Hanzi } from "@/components/ui/Hanzi";
import { Pinyin } from "@/components/ui/Pinyin";
import type { ExamOutcome, ExamVerdict } from "@/hooks/writing/useWritingExam";
import { interopIconColor } from "@/lib/interopIcon";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { HanziView } from "../canvas/HanziView";
import { SealMark } from "../SealMark";

interopIconColor(CheckIcon);

/** Короткая подпись вердикта для итогов. */
const VERDICT_SHORT: Record<ExamVerdict, string> = {
  passed: "Сдано",
  retry: "Через сутки",
  dropped: "−1 точка",
};

export function ExamResultsList({ outcomes }: { outcomes: ExamOutcome[] }) {
  const { t } = useTranslation(["sets"]);
  const passed = outcomes.filter((o) => o.verdict === "passed").length;

  return (
    <>
      <View className="items-center gap-2 py-4">
        <SealMark size={56} />
        <Text className="font-nunitoBold text-title text-text">
          Сдано {passed} из {outcomes.length}
        </Text>
      </View>

      <View className="gap-3">
        {outcomes.map((outcome) => (
          <View
            key={outcome.word.vocabularyId}
            className="flex-row items-center gap-3 rounded-2xl bg-surface px-4 py-3"
          >
            <View className="flex-row gap-1">
              {outcome.chars.map((_, index) => (
                <HanziView
                  key={index}
                  size={52}
                  rawStrokes={outcome.raws[index] ?? []}
                />
              ))}
            </View>

            <View className="flex-1">
              <View className="flex-row items-baseline gap-2">
                <Hanzi size={24}>{outcome.word.hanzi}</Hanzi>
                <Pinyin size="sm">{outcome.word.pinyin}</Pinyin>
              </View>
              <Text
                className="font-nunito text-small text-text"
                numberOfLines={1}
              >
                {t(outcome.word.translation)}
              </Text>
            </View>

            {outcome.verdict === "passed" ? (
              <CheckIcon width={28} height={28} className="text-primary" />
            ) : (
              <Text className="font-nunito text-caption text-text opacity-70">
                {VERDICT_SHORT[outcome.verdict]}
              </Text>
            )}
          </View>
        ))}
      </View>
    </>
  );
}
