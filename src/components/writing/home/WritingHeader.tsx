// src/components/writing/home/WritingHeader.tsx
//
// Шапка экрана «Написание» — компактная, чтобы карте пути досталось почти всё место:
//   строка 1: назад, «Написание», кнопка поиска;
//   строка 2: раздел «HSK 1 ▾» (выбор в панели), «Экзамен» (если есть что сдавать
//             или скоро будет) и «Наборы» (переключает экран на «Мои наборы»).
// Во время поиска обе строки заменяет поле поиска с «Отмена».

import LayersIcon from "@/assets/images/icons/layers.svg";
import SearchIcon from "@/assets/images/icons/search.svg";
import { BackButton } from "@/components/ui/BackButton";
import { SearchField } from "@/components/ui/SearchField";
import { Title } from "@/components/ui/Title";
import { colors } from "@/theme/colors";
import { formatExamWait } from "@/utils/writing/labels";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { SealMark } from "../SealMark";

interface WritingHeaderProps {
  searchOpen: boolean;
  query: string;
  onChangeQuery: (text: string) => void;
  onOpenSearch: () => void;
  onCloseSearch: () => void;

  /** «HSK 1»; на «Моих наборах» вместо раздела — их название. */
  levelLabel: string;
  onPickLevel: () => void;

  setsOpen: boolean;
  onToggleSets: () => void;

  examReady: number;
  nextExamAt?: number;
  now: number;
  onOpenExam: () => void;
}

export function WritingHeader({
  searchOpen,
  query,
  onChangeQuery,
  onOpenSearch,
  onCloseSearch,
  levelLabel,
  onPickLevel,
  setsOpen,
  onToggleSets,
  examReady,
  nextExamAt,
  now,
  onOpenExam,
}: WritingHeaderProps) {
  if (searchOpen) {
    return (
      <View className="flex-row items-center gap-3">
        <SearchField
          value={query}
          onChangeText={onChangeQuery}
          placeholder="Иероглиф, пиньинь или перевод"
          accessibilityLabel="Поиск слова"
          className="flex-1"
          autoFocus
        />
        <Pressable onPress={onCloseSearch} hitSlop={8} accessibilityRole="button">
          <Text className="font-nunitoMedium text-body text-primary">
            Отмена
          </Text>
        </Pressable>
      </View>
    );
  }

  const hasExam = examReady > 0 || nextExamAt !== undefined;

  return (
    <View>
      <View className="flex-row items-center justify-between">
        <BackButton href="/games" />
        <Title>Написание</Title>
        <Pressable
          onPress={onOpenSearch}
          hitSlop={8}
          className="h-10 w-10 items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel="Поиск слова"
        >
          <SearchIcon width={24} height={24} color={colors.text} />
        </Pressable>
      </View>

      <View className="mt-2 flex-row items-center gap-2">
        {setsOpen ? (
          <Text className="font-nunitoBold text-lead text-text">
            Мои наборы
          </Text>
        ) : (
          <Pill onPress={onPickLevel} label={`Раздел: ${levelLabel}`}>
            <Text className="font-nunitoBold text-body text-text">
              {levelLabel}
            </Text>
            <Text className="font-nunito text-small text-textSecondary">▾</Text>
          </Pill>
        )}

        <View className="flex-1" />

        {hasExam && (
          <Pill onPress={onOpenExam} label="Экзамен">
            <SealMark size={22} />
            <Text className="font-nunitoBold text-small text-text">
              {examReady > 0 ? examReady : formatExamWait(nextExamAt!, now)}
            </Text>
          </Pill>
        )}

        <Pill
          onPress={onToggleSets}
          active={setsOpen}
          label={setsOpen ? "Вернуться к пути" : "Мои наборы"}
        >
          <LayersIcon
            width={18}
            height={18}
            color={setsOpen ? "#FFFFFF" : colors.primary}
          />
          <Text
            className={`font-nunitoBold text-small ${
              setsOpen ? "text-white" : "text-text"
            }`}
          >
            Наборы
          </Text>
        </Pill>
      </View>
    </View>
  );
}

function Pill({
  children,
  onPress,
  active = false,
  label,
}: {
  children: ReactNode;
  onPress: () => void;
  active?: boolean;
  label: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`h-10 flex-row items-center gap-1.5 rounded-full px-3.5 active:opacity-70 ${
        active ? "bg-primary" : "bg-surface"
      }`}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {children}
    </Pressable>
  );
}
