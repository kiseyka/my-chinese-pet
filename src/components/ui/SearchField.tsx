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
}

export function SearchField({
  value,
  onChangeText,
  placeholder,
  accessibilityLabel = "Поиск",
  className = "",
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
        className="flex-1 py-3 font-nunito text-body text-text"
        accessibilityLabel={accessibilityLabel}
      />
      {hasValue && (
        // Очищаем сразу при касании (onPressIn), а не по отпусканию: пока открыта
        // клавиатура, отпускание пальца с крошечного «✕» часто не засчитывалось.
        // Зона нажатия — квадрат 40×40, а не один символ
        <Pressable
          onPressIn={() => onChangeText("")}
          hitSlop={8}
          className="-mr-2 h-10 w-10 items-center justify-center rounded-full active:bg-text/10"
          accessibilityRole="button"
          accessibilityLabel="Очистить поиск"
        >
          <Text className="font-nunito text-lead text-textSecondary">✕</Text>
        </Pressable>
      )}
    </View>
  );
}
