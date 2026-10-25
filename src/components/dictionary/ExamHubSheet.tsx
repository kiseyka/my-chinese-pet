// src/components/dictionary/ExamHubSheet.tsx
//
// Панель «Экзамен» в «Словаре»: два экзамена, по навыку на строку.
//   Перевод — показан перевод, нужно выбрать иероглиф из похожих (до 10 слов за раз);
//   Письмо  — написать слово по памяти (дальше — окно выбора слов, как раньше).
// Слово попадает на экзамен навыка, когда у него 3 точки этого навыка и прошли сутки.
// Сданный экзамен отмечается галочкой; два провала подряд снимают одну точку.

import LanguagesIcon from "@/assets/images/icons/languages.svg";
import PencilIcon from "@/assets/images/icons/pencil.svg";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { SealMark } from "@/components/writing/SealMark";
import { colors } from "@/theme/colors";
import { formatExamWait, pluralWords } from "@/utils/writing/labels";
import type { ComponentType } from "react";
import { Pressable, Text, View } from "react-native";

export interface ExamSummary {
  ready: number;
  /** Когда откроется ближайший, если готовых нет. */
  nextAt?: number;
}

interface ExamHubSheetProps {
  open: boolean;
  reading: ExamSummary;
  writing: ExamSummary;
  now: number;
  onStartReading: () => void;
  onStartWriting: () => void;
  onClose: () => void;
}

export function ExamHubSheet({
  open,
  reading,
  writing,
  now,
  onStartReading,
  onStartWriting,
  onClose,
}: ExamHubSheetProps) {
  return (
    <BottomSheet item={open ? true : null} onClose={onClose}>
      {() => (
        <>
          <View className="items-center gap-2">
            <SealMark size={40} />
            <Text className="font-nunitoBold text-lead text-text">Экзамен</Text>
            <Text className="text-center font-nunito text-small text-textSecondary">
              Слово попадает на экзамен с 3 точками навыка, через сутки. Сдал —
              галочка; два провала подряд — минус точка.
            </Text>
          </View>

          <View className="mt-5 gap-2">
            <ExamRow
              Icon={LanguagesIcon}
              title="По переводу"
              hint="Видишь перевод — выбираешь иероглиф"
              summary={reading}
              now={now}
              onStart={onStartReading}
            />
            <ExamRow
              Icon={PencilIcon}
              title="По письму"
              hint="Пишешь слово по памяти"
              summary={writing}
              now={now}
              onStart={onStartWriting}
            />
          </View>
        </>
      )}
    </BottomSheet>
  );
}

function ExamRow({
  Icon,
  title,
  hint,
  summary,
  now,
  onStart,
}: {
  Icon: ComponentType<{ width: number; height: number; color: string }>;
  title: string;
  hint: string;
  summary: ExamSummary;
  now: number;
  onStart: () => void;
}) {
  const canStart = summary.ready > 0;
  const status = canStart
    ? `готово ${summary.ready} ${pluralWords(summary.ready)}`
    : summary.nextAt !== undefined
      ? `следующее ${formatExamWait(summary.nextAt, now)}`
      : "пока нет слов с 3 точками";

  return (
    <View className="flex-row items-center gap-3 rounded-2xl bg-background/60 px-4 py-3">
      <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
        <Icon width={20} height={20} color={colors.primary} />
      </View>
      <View className="flex-1">
        <Text className="font-nunitoBold text-body text-text">{title}</Text>
        <Text className="font-nunito text-small text-textSecondary">
          {hint}
        </Text>
        <Text
          className={`font-nunitoMedium text-caption ${
            canStart ? "text-primary" : "text-textSecondary"
          }`}
        >
          {status}
        </Text>
      </View>
      <Pressable
        onPress={onStart}
        disabled={!canStart}
        className={`min-h-10 justify-center rounded-full px-4 active:opacity-80 ${
          canStart ? "bg-primary" : "bg-primary/20"
        }`}
        accessibilityRole="button"
        accessibilityState={{ disabled: !canStart }}
        accessibilityLabel={`Сдать экзамен ${title.toLowerCase()}`}
      >
        <Text className="font-nunitoBold text-small text-white">Сдать</Text>
      </Pressable>
    </View>
  );
}
