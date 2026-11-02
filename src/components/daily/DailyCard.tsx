// src/components/daily/DailyCard.tsx
//
// Карточка «Сегодня» на экране панды: две строки — «Слова» (перевод) и «Письмо».
// В строке — сделано / всего и кнопка, когда всё сделано — «Готово» с галочкой.
// Шестерёнки нет: тап по заголовку открывает настройку «новых слов в день».
// Пока не настроено — одна кнопка «Настроить слова дня».

import CheckIcon from "@/assets/images/icons/circle-check.svg";
import { interopIconColor } from "@/lib/interopIcon";
import type { DailySkill } from "@/store/dailyStore";
import type { DailyPlan } from "@/utils/daily";
import { Pressable, Text, View } from "react-native";

interopIconColor(CheckIcon);

interface DailyCardProps {
  configured: boolean;
  reading: DailyPlan;
  writing: DailyPlan;
  onStart: (skill: DailySkill) => void;
  onSettings: () => void;
}

export function DailyCard({
  configured,
  reading,
  writing,
  onStart,
  onSettings,
}: DailyCardProps) {
  if (!configured) {
    return (
      <Pressable
        onPress={onSettings}
        className="min-h-14 items-center justify-center rounded-2xl bg-primary px-5 active:opacity-80"
        accessibilityRole="button"
      >
        <Text className="font-nunitoBold text-body text-white">
          Настроить слова дня
        </Text>
      </Pressable>
    );
  }

  return (
    <View className="rounded-2xl border border-primary/30 bg-surface px-4 py-3">
      <Pressable
        onPress={onSettings}
        className="flex-row items-baseline justify-between active:opacity-60"
        accessibilityRole="button"
        accessibilityLabel="Сегодня: настроить слова дня"
        hitSlop={6}
      >
        <Text className="font-nunitoBold text-lead text-text">Сегодня</Text>
        <Text className="font-nunito text-small text-textSecondary">
          настроить
        </Text>
      </Pressable>

      <DailyRow
        title="Слова"
        action="Учить"
        plan={reading}
        onPress={() => onStart("reading")}
      />
      <DailyRow
        title="Письмо"
        action="Писать"
        plan={writing}
        onPress={() => onStart("writing")}
      />
    </View>
  );
}

function DailyRow({
  title,
  action,
  plan,
  onPress,
}: {
  title: string;
  action: string;
  plan: DailyPlan;
  onPress: () => void;
}) {
  const left = plan.check.length + plan.learn.length;
  const finished = plan.total > 0 && left === 0;

  return (
    <View className="mt-2 min-h-11 flex-row items-center gap-3">
      <Text className="flex-1 font-nunito text-body text-text">{title}</Text>

      {plan.total > 0 && (
        <Text className="font-nunito text-small text-textSecondary">
          {plan.done} / {plan.total}
        </Text>
      )}

      {/* Ширина кнопки и «Готово» одна: строка не прыгает, когда всё сделано */}
      <View className="w-24 items-end">
        {plan.total === 0 ? (
          <Text className="font-nunito text-small text-textSecondary">
            нет слов
          </Text>
        ) : finished ? (
          <View className="flex-row items-center gap-1">
            <CheckIcon width={18} height={18} className="text-primary" />
            <Text className="font-nunitoBold text-small text-primary">
              Готово
            </Text>
          </View>
        ) : (
          <Pressable
            onPress={onPress}
            className="min-h-9 w-24 items-center justify-center rounded-xl bg-primary active:opacity-80"
            accessibilityRole="button"
            accessibilityLabel={`${title}: ${action.toLowerCase()}`}
          >
            <Text className="font-nunitoBold text-small text-white">
              {action}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
