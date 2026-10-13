// src/components/flashcards/SetTitleModal.tsx
//
// Окно с полем для названия набора: и для «Создать набор», и для «Переименовать».
// Окно по центру (а не панель снизу), чтобы клавиатура его не перекрывала.

import { MAX_SET_TITLE_LENGTH } from "@/store/customSetsStore";
import { colors } from "@/theme/colors";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

interface SetTitleModalProps {
  visible: boolean;
  /** Заголовок окна: «Новый набор» или «Название набора». */
  heading: string;
  /** Текст в поле при открытии. */
  initialTitle?: string;
  confirmLabel: string;
  onConfirm: (title: string) => void;
  onClose: () => void;
}

export function SetTitleModal({
  visible,
  heading,
  initialTitle = "",
  confirmLabel,
  onConfirm,
  onClose,
}: SetTitleModalProps) {
  const [title, setTitle] = useState(initialTitle);

  // При каждом открытии — исходное название
  useEffect(() => {
    if (visible) setTitle(initialTitle);
  }, [visible, initialTitle]);

  const canConfirm = title.trim().length > 0;

  const confirm = () => {
    if (!canConfirm) return;
    onConfirm(title);
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        {/* Затемнение: тап закрывает окно */}
        <Pressable
          className="flex-1 items-center justify-center bg-black/40 px-6"
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Закрыть"
        >
          {/* Само окно: тапы по нему не закрывают */}
          <Pressable
            onPress={() => {}}
            className="w-full gap-4 rounded-2xl bg-background p-6"
          >
            <Text className="text-center font-nunitoBold text-title text-text">
              {heading}
            </Text>

            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Например: слова из сериала"
              placeholderTextColor={colors.textSecondary}
              maxLength={MAX_SET_TITLE_LENGTH}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={confirm}
              className="min-h-12 rounded-2xl bg-surface px-4 py-3 font-nunito text-body text-text"
              accessibilityLabel="Название набора"
            />

            <View className="flex-row gap-3">
              <Pressable
                onPress={onClose}
                className="min-h-12 flex-1 items-center justify-center rounded-2xl active:opacity-60"
                accessibilityRole="button"
              >
                <Text className="font-nunitoBold text-body text-text">
                  Отмена
                </Text>
              </Pressable>

              <Pressable
                onPress={confirm}
                disabled={!canConfirm}
                className={`min-h-12 flex-1 items-center justify-center rounded-2xl bg-primary ${
                  canConfirm ? "active:opacity-80" : "opacity-40"
                }`}
                accessibilityRole="button"
                accessibilityState={{ disabled: !canConfirm }}
              >
                <Text className="font-nunitoBold text-body text-white">
                  {confirmLabel}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
