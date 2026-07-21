// components/ui/ConfirmModal.tsx
import React from "react";
import { useTranslation } from "react-i18next";
import { Modal, Text, TouchableOpacity, View } from "react-native";

interface ConfirmModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  titleKey?: string; // Опциональный ключ перевода для заголовка
  messageKey?: string; // Опциональный ключ перевода для описания
  cancelTextKey?: string; // Опциональный ключ для кнопки отмены
  confirmTextKey?: string; // Опциональный ключ для кнопки действия
  isDestructive?: boolean; // Если true, кнопка действия будет бордовой/опасной
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isVisible,
  onClose,
  onConfirm,
  titleKey,
  messageKey,
  cancelTextKey,
  confirmTextKey,
  isDestructive = true, // По умолчанию действие важное/опасное
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      transparent={true}
      visible={isVisible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1  justify-center items-center bg-black/40 px-6">
        <View className=" bg-background  border-background  rounded-2xl p-6 shadow-xl items-center relative overflow-hidden">
          <Text
            className="text-text text-2xl text-center mt-2"
            style={{ fontFamily: "NotoSansSCMedium" }}
          >
            {titleKey
              ? t(titleKey)
              : t("games.quiz.exitTitle", "Покинуть уровень?")}
          </Text>
          <Text className="text-textSecondary text-sm text-center font-['NunitoRegular'] mt-3 mb-6 px-2 leading-5">
            {messageKey
              ? t(messageKey)
              : t(
                  "games.quiz.exitMessage",
                  "Ваш текущий прогресс будет полностью сброшен.",
                )}
          </Text>
          <View className="w-full flex-row justify-between gap-3">
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 py-3.5  border-b border-borderSecondary/40 rounded-xl "
            >
              <Text
                style={{
                  fontFamily: "NotoSansSCBold",
                }}
                className="text-text  text-center text-lg"
              >
                {cancelTextKey ? t(cancelTextKey) : t("common.cancel", "Нет")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              className={`flex-1 py-3.5 border-b  border-borderSecondary/40 rounded-xl `}
            >
              <Text
                style={{ fontFamily: "NotoSansSCBold" }}
                className=" text-center text-lg"
              >
                {confirmTextKey ? t(confirmTextKey) : t("common.exit", "Да")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
