// src/components/ui/ConfirmModal.tsx
//
// Подтверждение действия: заголовок, пояснение, «Отмена» и кнопка действия.
// По умолчанию — выход из тренировки. Вид окна общий (Dialog).

import { Dialog, DialogButton } from "./Dialog";

interface ConfirmModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  cancelLabel?: string;
  confirmLabel?: string;
  /** Опасное действие (удаление): кнопка красная. */
  isDestructive?: boolean;
}

export function ConfirmModal({
  isVisible,
  onClose,
  onConfirm,
  title = "Выйти из тренировки?",
  message = "Прогресс этой тренировки не сохранится.",
  cancelLabel = "Остаться",
  confirmLabel = "Выйти",
  isDestructive = false,
}: ConfirmModalProps) {
  return (
    <Dialog
      visible={isVisible}
      onClose={onClose}
      title={title}
      message={message}
      actions={
        <>
          <DialogButton label={cancelLabel} onPress={onClose} />
          <DialogButton
            label={confirmLabel}
            onPress={onConfirm}
            variant={isDestructive ? "danger" : "primary"}
          />
        </>
      }
    />
  );
}
