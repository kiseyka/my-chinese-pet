// src/components/panda/PandaNavBar.tsx
//
// Нижняя панель экрана панды: «Тренировки» · «Слова дня» · «Магазин».
// Иконки — lucide (как остальные в assets/images/icons), подпись под иконкой.
//
// «Слова дня» (utils/daily): на иконке — сколько слов осталось на сегодня
// (перевод + письмо), когда всё сделано — галочка. Тап — над панелью всплывают
// две кнопки «Слова» и «Письмо» с прогрессом и строка «Настроить». Тап мимо —
// закрыть. Пока слова дня не настроены, тап сразу открывает настройку.
// Всплывашка лежит поверх экрана (absolute): панель и панда не двигаются.

import BookIcon from "@/assets/images/icons/book-open.svg";
import CalendarIcon from "@/assets/images/icons/calendar-check.svg";
import CheckIcon from "@/assets/images/icons/circle-check.svg";
import DumbbellIcon from "@/assets/images/icons/dumbbell.svg";
import PencilIcon from "@/assets/images/icons/pencil.svg";
import ShopIcon from "@/assets/images/icons/shopping-bag.svg";
import { interopIconColor } from "@/lib/interopIcon";
import type { DailySkill } from "@/store/dailyStore";
import type { DailyPlan } from "@/utils/daily";
import { useState, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

interopIconColor(
  BookIcon,
  CalendarIcon,
  CheckIcon,
  DumbbellIcon,
  PencilIcon,
  ShopIcon,
);

const ICON = 26;

interface PandaNavBarProps {
  onTrainings: () => void;
  onShop: () => void;
  daily: {
    configured: boolean;
    reading: DailyPlan;
    writing: DailyPlan;
    onStart: (skill: DailySkill) => void;
    onSettings: () => void;
  };
}

const leftOf = (plan: DailyPlan) => plan.check.length + plan.learn.length;

export function PandaNavBar({ onTrainings, onShop, daily }: PandaNavBarProps) {
  const [open, setOpen] = useState(false);

  const left = leftOf(daily.reading) + leftOf(daily.writing);
  const hasWords = daily.reading.total + daily.writing.total > 0;
  const allDone = daily.configured && hasWords && left === 0;

  const tapDaily = () => {
    if (!daily.configured) {
      daily.onSettings();
      return;
    }
    setOpen((value) => !value);
  };

  const run = (action: () => void) => () => {
    setOpen(false);
    action();
  };

  return (
    <>
      {/* Тап мимо всплывашки закрывает её */}
      {open && (
        <Pressable
          className="absolute inset-0"
          onPress={() => setOpen(false)}
          accessibilityLabel="Закрыть слова дня"
        />
      )}

      <View>
        {open && (
          <View
            className="absolute bottom-full left-0 right-0 mb-2 rounded-3xl border border-primary/20 bg-surface p-3"
          >
            <View className="flex-row gap-3">
              <DailyButton
                icon={<BookIcon width={ICON} height={ICON} className="text-primary" />}
                title="Слова"
                plan={daily.reading}
                onPress={run(() => daily.onStart("reading"))}
              />
              <DailyButton
                icon={<PencilIcon width={ICON} height={ICON} className="text-primary" />}
                title="Письмо"
                plan={daily.writing}
                onPress={run(() => daily.onStart("writing"))}
              />
            </View>
            <Pressable
              onPress={run(daily.onSettings)}
              className="mt-2 min-h-9 items-center justify-center active:opacity-60"
              accessibilityRole="button"
            >
              <Text className="font-nunito text-small text-textSecondary">
                Настроить слова дня
              </Text>
            </Pressable>
          </View>
        )}

        <View className="mb-2 flex-row rounded-3xl border border-primary/20 bg-surface py-2">
          <NavItem
            label="Тренировки"
            icon={<DumbbellIcon width={ICON} height={ICON} className="text-text" />}
            onPress={run(onTrainings)}
          />
          <NavItem
            label="Слова дня"
            active={open}
            icon={
              <CalendarIcon
                width={ICON}
                height={ICON}
                className={open ? "text-primary" : "text-text"}
              />
            }
            badge={
              allDone ? (
                <View className="rounded-full bg-surface">
                  <CheckIcon width={18} height={18} className="text-primary" />
                </View>
              ) : left > 0 ? (
                <View className="min-w-5 items-center rounded-full bg-primary px-1.5">
                  <Text className="font-nunitoBold text-xs text-white">{left}</Text>
                </View>
              ) : null
            }
            onPress={tapDaily}
          />
          <NavItem
            label="Магазин"
            icon={<ShopIcon width={ICON} height={ICON} className="text-text" />}
            onPress={run(onShop)}
          />
        </View>
      </View>
    </>
  );
}

function NavItem({
  label,
  icon,
  badge,
  active = false,
  onPress,
}: {
  label: string;
  icon: ReactNode;
  badge?: ReactNode;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 items-center gap-0.5 py-1 active:opacity-60"
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ expanded: active }}
    >
      <View>
        {icon}
        {/* Счётчик в правом верхнем углу иконки: место не занимает, ничего не сдвигает */}
        {badge && <View className="absolute -right-3 -top-1.5">{badge}</View>}
      </View>
      <Text
        className={`font-nunito text-small ${active ? "text-primary" : "text-text"}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function DailyButton({
  icon,
  title,
  plan,
  onPress,
}: {
  icon: ReactNode;
  title: string;
  plan: DailyPlan;
  onPress: () => void;
}) {
  const left = leftOf(plan);
  const status =
    plan.total === 0 ? "нет слов" : left === 0 ? "готово" : `${plan.done} / ${plan.total}`;
  const disabled = left === 0;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`min-h-20 flex-1 items-center justify-center gap-1 rounded-2xl border px-3 py-2 ${
        disabled ? "border-primary/20 bg-background/50" : "border-primary/40 bg-background active:opacity-80"
      }`}
      accessibilityRole="button"
      accessibilityLabel={`${title}: ${status}`}
    >
      {icon}
      <Text className="font-nunitoBold text-body text-text">{title}</Text>
      <Text className="font-nunito text-small text-textSecondary">{status}</Text>
    </Pressable>
  );
}
