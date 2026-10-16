// src/components/ui/SearchField.tsx
//
// Поле поиска: иконка, ввод и крестик «очистить», который появляется, когда есть текст.

import SearchIcon from "@/assets/images/icons/search.svg";
import { colors } from "@/theme/colors";
import { Pressable, Text, TextInput, View } from "react-native";

/** Размер иконки поиска в pt. SVG не понимает className, поэтому размер задаётся пропсами. */
const ICON_SIZE = 18;

interface SearchFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  accessibilityLabel?: string;
  /** Внешние отступы и прочее: добавляются к базовым классам. */
  className?: string;
  /** Сразу открыть клавиатуру (поле, которое появляется по кнопке поиска). */
  autoFocus?: boolean;
}

export function SearchField({
  value,
  onChangeText,
  placeholder,
  accessibilityLabel = "Поиск",
  className = "",
  autoFocus = false,
}: SearchFieldProps) {
  const hasValue = value.length > 0;

  return (
    <View
      className={`min-h-12 flex-row items-center gap-1 rounded-2xl bg-surface px-4 ${className}`}
    >
      {/* stroke="currentColor" в SVG берёт цвет из пропа color */}
      <SearchIcon
        width={ICON_SIZE}
        height={ICON_SIZE}
        color={colors.textSecondary}
      />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        autoFocus={autoFocus}
        className="flex-1 py-3 font-nunito text-body text-text"
        accessibilityLabel={accessibilityLabel}
      />
      {hasValue && (
        <Pressable
          onPress={() => onChangeText("")}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Очистить поиск"
        >
          <Text className="font-nunito text-body text-textSecondary">✕</Text>
        </Pressable>
      )}
    </View>
  );
}
