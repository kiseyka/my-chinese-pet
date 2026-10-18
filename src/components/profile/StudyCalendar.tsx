// src/components/profile/StudyCalendar.tsx
//
// Календарь занятий: месяц сеткой (с понедельника), стрелки — соседние месяцы.
//   кружок — день обучения (была тренировка или экзамен);
//   просто число — день без занятий; рамка — сегодня.
// Листать можно от месяца первого занятия до текущего.
// Без своей подложки: показывается в панели (CalendarSheet в профиле).

import ChevronLeftIcon from "@/assets/images/icons/chevron-left.svg";
import ChevronRightIcon from "@/assets/images/icons/chevron-right.svg";
import { colors } from "@/theme/colors";
import { dayKey, type ActivityDays } from "@/utils/activity";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

const MONTHS = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];
const WEEKDAYS = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];

/** Номер месяца с начала эпохи: удобно сравнивать и листать. */
const monthIndex = (date: Date) => date.getFullYear() * 12 + date.getMonth();

export function StudyCalendar({ days }: { days: ActivityDays }) {
  const today = new Date();
  const todayKey = dayKey(today);
  const lastMonth = monthIndex(today);
  const firstMonth = useMemo(() => {
    const first = Object.keys(days).sort()[0];
    if (!first) return lastMonth;
    const [y, m] = first.split("-").map(Number);
    return y * 12 + (m - 1);
  }, [days, lastMonth]);

  const [shown, setShown] = useState(lastMonth);
  const year = Math.floor(shown / 12);
  const month = shown % 12;

  // Ячейки месяца: пустые до первого числа, потом дни
  const cells = useMemo(() => {
    const first = new Date(year, month, 1);
    const offset = (first.getDay() + 6) % 7;
    const count = new Date(year, month + 1, 0).getDate();
    return [
      ...Array.from({ length: offset }, () => null),
      ...Array.from({ length: count }, (_, i) => new Date(year, month, i + 1)),
    ];
  }, [year, month]);

  const studied = cells.filter((date) => date && days[dayKey(date)]).length;

  const canBack = shown > firstMonth;
  const canForward = shown < lastMonth;

  return (
    <View>
      <View className="mb-3 flex-row items-center justify-between">
        <ArrowButton
          disabled={!canBack}
          onPress={() => setShown(shown - 1)}
          label="Предыдущий месяц"
          Icon={ChevronLeftIcon}
        />
        <View className="items-center">
          <Text className="font-nunitoBold text-body text-text">
            {MONTHS[month]} {year}
          </Text>
          <Text className="font-nunito text-caption text-textSecondary">
            {studied > 0 ? `занятий: ${studied}` : "без занятий"}
          </Text>
        </View>
        <ArrowButton
          disabled={!canForward}
          onPress={() => setShown(shown + 1)}
          label="Следующий месяц"
          Icon={ChevronRightIcon}
        />
      </View>

      <View className="flex-row">
        {WEEKDAYS.map((name) => (
          <Text
            key={name}
            className="flex-1 text-center font-nunito text-caption text-textSecondary"
          >
            {name}
          </Text>
        ))}
      </View>

      <View className="mt-1 flex-row flex-wrap">
        {cells.map((date, index) => {
          if (!date) {
            return <View key={`e${index}`} style={{ width: "14.2857%" }} />;
          }
          const key = dayKey(date);
          const day = days[key];
          const isToday = key === todayKey;
          const isFuture = date.getTime() > today.getTime() && !isToday;

          const circle = day ? "bg-primary" : "";
          const text = day
            ? "text-white font-nunitoBold"
            : isFuture
              ? "text-textSecondary/40 font-nunito"
              : "text-textSecondary font-nunito";

          return (
            <View
              key={key}
              className="items-center py-1"
              style={{ width: "14.2857%" }}
            >
              <View
                className={`h-9 w-9 items-center justify-center rounded-full ${circle} ${
                  isToday ? "border-2 border-primary" : ""
                }`}
              >
                <Text className={`text-small ${text}`}>{date.getDate()}</Text>
              </View>
            </View>
          );
        })}
      </View>

    </View>
  );
}

function ArrowButton({
  disabled,
  onPress,
  label,
  Icon,
}: {
  disabled: boolean;
  onPress: () => void;
  label: string;
  Icon: typeof ChevronLeftIcon;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      className={`h-9 w-9 items-center justify-center rounded-full ${
        disabled ? "opacity-30" : "active:bg-primary/10"
      }`}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
    >
      <Icon width={22} height={22} color={colors.text} />
    </Pressable>
  );
}
