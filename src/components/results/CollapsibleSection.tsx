// src/components/results/CollapsibleSection.tsx
//
// Раздел слов на экране итогов, который сворачивается: «Ошибки», «Верно»,
// «С подсказками»… Сначала свёрнут — сверху остаются главные новости
// («Перешли в изученные», «Вернулись в повторение»).
// Тап по заголовку раскрывает и сворачивает. action — кнопка справа от заголовка
// (например, «Все в повторение»), она работает и в свёрнутом разделе.

import ChevronRight from "@/assets/images/icons/chevron-right.svg";
import { colors } from "@/theme/colors";
import { useState, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

interface CollapsibleSectionProps {
  title: string;
  count: number;
  action?: ReactNode;
  children: ReactNode;
}

export function CollapsibleSection({
  title,
  count,
  action,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(false);

  return (
    <View className="gap-2">
      <View className="min-h-11 flex-row items-center gap-3">
        <Pressable
          onPress={() => setOpen((value) => !value)}
          className="min-h-11 flex-1 flex-row items-center gap-1.5 active:opacity-70"
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          accessibilityLabel={`${title}: ${count}`}
        >
          <Text className="font-nunitoBold text-lead text-text">
            {title} · {count}
          </Text>
          <View style={{ transform: [{ rotate: open ? "90deg" : "0deg" }] }}>
            <ChevronRight width={20} height={20} color={colors.text} />
          </View>
        </Pressable>
        {action}
      </View>
      {open && children}
    </View>
  );
}
