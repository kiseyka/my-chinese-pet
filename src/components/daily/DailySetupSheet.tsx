// src/components/daily/DailySetupSheet.tsx
//
// «Сколько новых слов в день?» — отдельно для перевода и письма.
// Показывается сам при первом заходе на панду; потом — по тапу на «Сегодня».
// Новые числа действуют со следующего добора (с завтрашнего дня).

import { BottomSheet, SheetBody } from "@/components/ui/BottomSheet";
import type { DailySkill } from "@/store/dailyStore";
import { DEFAULT_PER_DAY, PER_DAY_OPTIONS, poolCap } from "@/utils/daily";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

type PerDay = Record<DailySkill, number>;

interface DailySetupSheetProps {
  /** Открыто, пока не null: текущие числа или null, если ещё не настроено. */
  open: { current: PerDay | null } | null;
  onClose: () => void;
  onSave: (perDay: PerDay) => void;
}

const ROWS: { skill: DailySkill; title: string; hint: string }[] = [
  {
    skill: "reading",
    title: "Слова",
    hint: "Узнавать перевод и чтение",
  },
  {
    skill: "writing",
    title: "Письмо",
    hint: "Писать иероглифы по памяти",
  },
];

export function DailySetupSheet({ open, onClose, onSave }: DailySetupSheetProps) {
  const [value, setValue] = useState<PerDay>(DEFAULT_PER_DAY);

  return (
    <BottomSheet
      item={open}
      onClose={onClose}
      onOpen={(item) => setValue(item.current ?? DEFAULT_PER_DAY)}
      manualScroll
    >
      {(item) => (
        <SheetBody
          footer={
            <Pressable
              onPress={() => onSave(value)}
              className="min-h-14 items-center justify-center rounded-2xl bg-primary px-5 active:opacity-80"
              accessibilityRole="button"
            >
              <Text className="font-nunitoBold text-body text-white">
                {item.current ? "Сохранить" : "Начать"}
              </Text>
            </Pressable>
          }
        >
          <Text className="font-nunitoBold text-title text-text">
            Слова дня
          </Text>
          <Text className="mt-1 font-nunito text-body text-textSecondary">
            Сколько новых слов в день? Вчерашние тоже будут повторяться, поэтому
            в работе одновременно — не больше вдвое.
          </Text>

          {ROWS.map(({ skill, title, hint }) => (
            <View key={skill} className="mt-5">
              <View className="flex-row items-baseline justify-between">
                <Text className="font-nunitoBold text-lead text-text">
                  {title}
                </Text>
                <Text className="font-nunito text-small text-textSecondary">
                  в работе до {poolCap(value[skill])}
                </Text>
              </View>
              <Text className="font-nunito text-small text-textSecondary">
                {hint}
              </Text>

              <View className="mt-2 flex-row gap-2">
                {PER_DAY_OPTIONS[skill].map((option) => {
                  const selected = value[skill] === option;
                  return (
                    <Pressable
                      key={option}
                      onPress={() =>
                        setValue((prev) => ({ ...prev, [skill]: option }))
                      }
                      className={`h-12 flex-1 items-center justify-center rounded-xl border ${
                        selected
                          ? "border-primary bg-primary"
                          : "border-primary/30 bg-surface"
                      } active:opacity-80`}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      accessibilityLabel={`${title}: ${option} в день`}
                    >
                      <Text
                        className={`font-nunitoBold text-body ${
                          selected ? "text-white" : "text-text"
                        }`}
                      >
                        {option}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}

          {item.current && (
            <Text className="mt-4 font-nunito text-small text-textSecondary">
              Новые числа начнут действовать завтра.
            </Text>
          )}
        </SheetBody>
      )}
    </BottomSheet>
  );
}
