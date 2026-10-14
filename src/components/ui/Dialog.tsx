// src/components/ui/Dialog.tsx
//
// Окно по центру экрана: заголовок, содержимое и ряд кнопок внизу.
// Общий вид для подтверждений (ConfirmModal) и окна с полем ввода (SetTitleModal).
// Тап по затемнению закрывает окно. KeyboardAvoidingView — чтобы клавиатура
// не перекрывала поле ввода.

import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";

interface DialogProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  /** Пояснение под заголовком. */
  message?: string;
  /** Содержимое между текстом и кнопками (например, поле ввода). */
  children?: ReactNode;
  /** Кнопки внизу (DialogButton), в ряд. */
  actions: ReactNode;
}

export function Dialog({
  visible,
  onClose,
  title,
  message,
  children,
  actions,
}: DialogProps) {
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
            <View className="gap-2">
              <Text className="text-center font-nunitoBold text-title text-text">
                {title}
              </Text>
              {message && (
                <Text className="text-center font-nunito text-body text-text opacity-70">
                  {message}
                </Text>
              )}
            </View>

            {children}

            <View className="flex-row gap-3">{actions}</View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

type DialogButtonVariant = "plain" | "primary" | "danger";

const VARIANT_CLASSES: Record<
  DialogButtonVariant,
  { button: string; text: string }
> = {
  plain: { button: "", text: "text-text" },
  primary: { button: "bg-primary", text: "text-white" },
  danger: { button: "bg-error", text: "text-white" },
};

interface DialogButtonProps {
  label: string;
  onPress: () => void;
  variant?: DialogButtonVariant;
  disabled?: boolean;
}

export function DialogButton({
  label,
  onPress,
  variant = "plain",
  disabled = false,
}: DialogButtonProps) {
  const classes = VARIANT_CLASSES[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`min-h-12 flex-1 items-center justify-center rounded-2xl px-3 ${
        classes.button
      } ${disabled ? "opacity-40" : "active:opacity-70"}`}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      <Text className={`font-nunitoBold text-body ${classes.text}`}>
        {label}
      </Text>
    </Pressable>
  );
}
