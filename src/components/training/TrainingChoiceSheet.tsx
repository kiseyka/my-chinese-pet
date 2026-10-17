// src/components/training/TrainingChoiceSheet.tsx
//
// «Как будем тренироваться?» — один выбор режима для любого списка слов
// (тема в «Словаре», избранное, «Другие слова»):
//   «Выбор перевода» — иероглиф → один из четырёх переводов, даёт точки перевода;
//   «Самопроверка»   — «Знаю / Сомневаюсь / Не знаю», без точек;
//   «Письмо»         — урок письма по словам, которые можно писать; даёт точки письма.
// Режим, для которого слов не хватает, показан бледным с причиной.
// returnTo — куда вернёт «Продолжить» на экране итогов (и «назад» из тренировки).

import ArrowRight from "@/assets/images/icons/chevron-right.svg";
import SelfCheckIcon from "@/assets/images/icons/eye.svg";
import PencilIcon from "@/assets/images/icons/pencil.svg";
import ChoiceIcon from "@/assets/images/icons/zap.svg";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { SELF_CHECK_MODE } from "@/hooks/useSelfCheckGame";
import { interopIconColor } from "@/lib/interopIcon";
import { MIN_SET_WORDS } from "@/store/customSetsStore";
import { useGameStore } from "@/store/gameStore";
import { pluralWords } from "@/utils/writing/labels";
import { getWritableWords } from "@/utils/writing/words";
import { resolveWordSource } from "@/utils/wordSource";
import { useRouter, type Href } from "expo-router";
import type { ComponentType } from "react";
import { Pressable, Text, View } from "react-native";

interopIconColor(ArrowRight, SelfCheckIcon, ChoiceIcon, PencilIcon);

interface TrainingChoiceSheetProps {
  /** id источника слов (utils/wordSource.ts); null — панель закрыта. */
  sourceId: string | null;
  returnTo: Href;
  onClose: () => void;
}

export function TrainingChoiceSheet({
  sourceId,
  returnTo,
  onClose,
}: TrainingChoiceSheetProps) {
  const router = useRouter();

  const go = (href: Href) => {
    onClose();
    useGameStore.getState().setReturnTo(returnTo);
    router.push(href);
  };

  return (
    <BottomSheet item={sourceId} onClose={onClose}>
      {(id) => {
        const source = resolveWordSource(id);
        const total = source?.words.length ?? 0;
        const writable = getWritableWords(source?.words ?? []).length;
        const canRead = total >= MIN_SET_WORDS;
        const readReason = `Нужно хотя бы ${MIN_SET_WORDS} слова`;

        return (
          <>
            {source && (
              <Text
                className="text-center font-nunito text-body text-textSecondary"
                numberOfLines={1}
              >
                {source.title} · {total} {pluralWords(total)}
              </Text>
            )}
            <Text className="mt-1 text-center font-nunitoBold text-lead text-text">
              Как будем тренироваться?
            </Text>

            <View className="mt-5 gap-2">
              <ModeButton
                primary
                Icon={ChoiceIcon}
                title="Выбор перевода"
                hint={canRead ? "Даёт точки перевода" : readReason}
                enabled={canRead}
                onPress={() =>
                  go({
                    pathname: "/games/flashcards/[setId]",
                    params: { setId: id },
                  })
                }
              />
              <ModeButton
                Icon={SelfCheckIcon}
                title="Самопроверка"
                hint={canRead ? "Быстро пройтись по словам, без точек" : readReason}
                enabled={canRead}
                onPress={() =>
                  go({
                    pathname: "/games/flashcards/[setId]",
                    params: { setId: id, mode: SELF_CHECK_MODE },
                  })
                }
              />
              <ModeButton
                Icon={PencilIcon}
                title="Письмо"
                hint={
                  writable === 0
                    ? "Здесь нет слов, которые можно писать"
                    : writable === total
                      ? "Даёт точки письма"
                      : `Можно писать ${writable} из ${total}`
                }
                enabled={writable > 0}
                onPress={() =>
                  go({
                    pathname: "/games/writing/path" as any,
                    params: { source: id },
                  })
                }
              />
            </View>
          </>
        );
      }}
    </BottomSheet>
  );
}

function ModeButton({
  Icon,
  title,
  hint,
  enabled,
  primary = false,
  onPress,
}: {
  Icon: ComponentType<{ width: number; height: number; className?: string }>;
  title: string;
  hint: string;
  enabled: boolean;
  primary?: boolean;
  onPress: () => void;
}) {
  const filled = primary && enabled;

  return (
    <Pressable
      onPress={onPress}
      disabled={!enabled}
      className={`min-h-14 flex-row items-center gap-4 rounded-2xl px-5 py-4 active:opacity-80 ${
        filled ? "bg-primary" : "border border-primary/30 bg-surface"
      } ${enabled ? "" : "opacity-50"}`}
      accessibilityRole="button"
      accessibilityState={{ disabled: !enabled }}
      accessibilityHint={hint}
    >
      <Icon
        width={24}
        height={24}
        className={filled ? "text-white" : "text-primary"}
      />
      <View className="flex-1">
        <Text
          className={`font-nunitoBold text-body ${filled ? "text-white" : "text-text"}`}
        >
          {title}
        </Text>
        <Text
          className={`font-nunito text-small ${
            filled ? "text-white/80" : "text-textSecondary"
          }`}
        >
          {hint}
        </Text>
      </View>
      <ArrowRight
        width={20}
        height={20}
        className={filled ? "text-white" : "text-text"}
      />
    </Pressable>
  );
}
