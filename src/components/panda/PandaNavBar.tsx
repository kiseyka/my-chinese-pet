// src/components/panda/PandaNavBar.tsx
//
// Нижняя панель экрана панды: «Тренировки» · «Слова дня» · «Магазин».
// Иконки — lucide (как остальные в assets/images/icons), подпись под иконкой.
//
// Оформление — пергамент (components/ui/Parchment): листья в нижних углах,
// между пунктами тонкие линии, иконки — оливковые (primary) и тонкие, подписи — «чернила» (ink).
//
// «Слова дня» (utils/daily): пока на сегодня что-то осталось — красная точка
// на иконке, когда всё сделано — точки нет. Тап — над панелью всплывают
// две кнопки «Слова» и «Письмо» с прогрессом и строка «Настроить». Тап мимо —
// закрыть. Пока слова дня не настроены, тап сразу открывает настройку.
// Всплывашка лежит поверх экрана (absolute): панель и панда не двигаются.

import BookIcon from "@/assets/images/icons/book-open.svg";
import CalendarIcon from "@/assets/images/icons/calendar-check.svg";
import DumbbellIcon from "@/assets/images/icons/dumbbell.svg";
import PencilIcon from "@/assets/images/icons/pencil.svg";
import ShopIcon from "@/assets/images/icons/shopping-bag.svg";
import { interopIconColor } from "@/lib/interopIcon";
import { PARCHMENT, Parchment } from "@/components/ui/Parchment";
import { colors } from "@/theme/colors";
import type { DailySkill } from "@/store/dailyStore";
import type { DailyPlan } from "@/utils/daily";
import { useState, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

interopIconColor(
  BookIcon,
  CalendarIcon,
  DumbbellIcon,
  PencilIcon,
  ShopIcon,
);

const ICON = 26;
/** Иконки тоньше обычных (2): рядом с акварелью мягче. */
const STROKE = 1.5;

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
          <Parchment
            className="absolute bottom-full left-6 right-6 mb-3 p-3"
            radius={24}
          >
            <View className="flex-row gap-3">
              <DailyButton
                icon={<BookIcon width={ICON} height={ICON} strokeWidth={STROKE} color={colors.primary} />}
                title="Слова"
                plan={daily.reading}
                onPress={run(() => daily.onStart("reading"))}
              />
              <DailyButton
                icon={<PencilIcon width={ICON} height={ICON} strokeWidth={STROKE} color={colors.primary} />}
                title="Письмо"
                plan={daily.writing}
                onPress={run(() => daily.onStart("writing"))}
              />
            </View>
            <Pressable
              onPress={run(daily.onSettings)}
              className="mt-1 min-h-9 items-center justify-center active:opacity-60"
              accessibilityRole="button"
            >
              <Text className="font-nunito text-small" style={{ color: PARCHMENT.ink, opacity: 0.7 }}>
                Настроить слова дня
              </Text>
            </Pressable>
          </Parchment>
        )}

        <Parchment
          className="mb-2 flex-row py-2"
          radius={36}
          decor={[
            // Листья из нижних углов: слева как есть, справа зеркально
            { sprig: "leafLong", width: 76, position: { left: -18, bottom: -12 }, opacity: 0.6 },
            { sprig: "leafShort", width: 64, position: { right: -16, bottom: -12 }, flip: true, opacity: 0.6 },
          ]}
        >
          <NavItem
            label="Тренировки"
            icon={<DumbbellIcon width={ICON} height={ICON} strokeWidth={STROKE} color={colors.primary} />}
            onPress={run(onTrainings)}
          />
          <Divider />
          <NavItem
            label="Слова дня"
            active={open}
            icon={
              <CalendarIcon
                width={ICON}
                height={ICON}
                strokeWidth={STROKE}
                color={colors.primary}
              />
            }
            dot={daily.configured ? left > 0 : true}
            onPress={tapDaily}
          />
          <Divider />
          <NavItem
            label="Магазин"
            icon={<ShopIcon width={ICON} height={ICON} strokeWidth={STROKE} color={colors.primary} />}
            onPress={run(onShop)}
          />
        </Parchment>
      </View>
    </>
  );
}

/** Тонкая вертикальная линия между пунктами. */
function Divider() {
  return (
    <View className="my-2 w-px" style={{ backgroundColor: PARCHMENT.border }} />
  );
}

function NavItem({
  label,
  icon,
  dot = false,
  active = false,
  onPress,
}: {
  label: string;
  icon: ReactNode;
  /** Красная точка «есть что сделать» у правого верхнего угла иконки. */
  dot?: boolean;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="min-h-14 flex-1 items-center justify-center gap-0.5 py-1 active:opacity-60"
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ expanded: active }}
    >
      <View>
        {icon}
        {/* Точка поверх иконки: место не занимает, ничего не сдвигает */}
        {dot && (
          <View
            className="absolute -right-1.5 -top-1 h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: PARCHMENT.seal, borderWidth: 1, borderColor: "#F8F1E4" }}
          />
        )}
      </View>
      <Text
        className="font-nunitoMedium text-small"
        style={{ color: active ? colors.primary : PARCHMENT.ink }}
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
        disabled ? "opacity-50" : "active:opacity-70"
      }`}
      style={{
        borderColor: PARCHMENT.border,
        backgroundColor: disabled ? "transparent" : "rgba(228, 214, 190, 0.4)",
      }}
      accessibilityRole="button"
      accessibilityLabel={`${title}: ${status}`}
    >
      {icon}
      <Text className="font-nunitoBold text-body" style={{ color: PARCHMENT.ink }}>
        {title}
      </Text>
      <Text className="font-nunito text-small" style={{ color: PARCHMENT.ink, opacity: 0.7 }}>
        {status}
      </Text>
    </Pressable>
  );
}
