// src/components/flashcards/TrainingModeSheet.tsx
//
// «Как будем тренироваться?» — панель перед тренировкой карточками
// (как выбор быстрой или полной тренировки в «Написании»).
// Открывается по «Тренировать» у ступени, набора и «Повторения»:
//   «Выбор перевода» — иероглиф → один из четырёх переводов, даёт точки чтения;
//   «Самопроверка» — «Знаю / Сомневаюсь / Не знаю», без точек.

import ArrowRight from "@/assets/images/icons/chevron-right.svg";
import SelfCheckIcon from "@/assets/images/icons/eye.svg";
import ChoiceIcon from "@/assets/images/icons/zap.svg";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { SELF_CHECK_MODE } from "@/hooks/useSelfCheckGame";
import { interopIconColor } from "@/lib/interopIcon";
import { useCustomSetsStore } from "@/store/customSetsStore";
import { resolveFlashcardSource } from "@/utils/flashcards/source";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

interopIconColor(ArrowRight, SelfCheckIcon, ChoiceIcon);

interface TrainingModeSheetProps {
  /** Что тренируем: id ступени, набора или «Повторения»; null — панель закрыта. */
  setId: string | null;
  onClose: () => void;
}

export function TrainingModeSheet({ setId, onClose }: TrainingModeSheetProps) {
  const router = useRouter();
  const sets = useCustomSetsStore((state) => state.sets);

  const start = (id: string, selfCheck: boolean) => {
    onClose();
    router.push({
      pathname: "/games/flashcards/[setId]",
      params: selfCheck ? { setId: id, mode: SELF_CHECK_MODE } : { setId: id },
    });
  };

  return (
    <BottomSheet item={setId} onClose={onClose}>
      {(id) => {
        const title = resolveFlashcardSource(id, sets)?.title;

        return (
          <>
            {title && (
              <Text
                className="text-center font-nunito text-body text-textSecondary"
                numberOfLines={1}
              >
                {title}
              </Text>
            )}
            <Text className="mt-1 text-center font-nunitoBold text-lead text-text">
              Как будем тренироваться?
            </Text>

            <View className="mt-5 gap-2">
              <Pressable
                onPress={() => start(id, false)}
                className="min-h-14 flex-row items-center gap-4 rounded-2xl bg-primary px-5 py-4 active:opacity-80"
                accessibilityRole="button"
              >
                <ChoiceIcon width={24} height={24} className="text-white" />
                <Text className="flex-1 font-nunitoBold text-body text-white">
                  Выбор перевода
                </Text>
                <ArrowRight width={20} height={20} className="text-white" />
              </Pressable>

              <Pressable
                onPress={() => start(id, true)}
                className="min-h-14 flex-row items-center gap-4 rounded-2xl border border-primary/30 bg-surface px-5 py-4 active:opacity-70"
                accessibilityRole="button"
                accessibilityHint="Быстро пройтись по словам, без точек"
              >
                <SelfCheckIcon width={24} height={24} className="text-primary" />
                <View className="flex-1">
                  <Text className="font-nunitoBold text-body text-text">
                    Самопроверка
                  </Text>
                  <Text className="font-nunito text-small text-textSecondary">
                    Быстро пройтись по словам, без точек
                  </Text>
                </View>
                <ArrowRight width={20} height={20} className="text-text" />
              </Pressable>
            </View>
          </>
        );
      }}
    </BottomSheet>
  );
}
