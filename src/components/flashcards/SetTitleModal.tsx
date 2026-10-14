// src/components/flashcards/SetTitleModal.tsx
//
// Окно с полем для названия набора: и для «Создать набор», и для «Переименовать».
// Вид окна общий (Dialog).

import { Dialog, DialogButton } from "@/components/ui/Dialog";
import { MAX_SET_TITLE_LENGTH } from "@/store/customSetsStore";
import { colors } from "@/theme/colors";
import { useEffect, useState } from "react";
import { TextInput } from "react-native";

interface SetTitleModalProps {
  visible: boolean;
  /** Заголовок окна: «Новый набор» или «Название набора». */
  heading: string;
  /** Пояснение под заголовком. */
  message?: string;
  /** Текст в поле при открытии. */
  initialTitle?: string;
  confirmLabel: string;
  onConfirm: (title: string) => void;
  onClose: () => void;
}

export function SetTitleModal({
  visible,
  heading,
  message,
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
    <Dialog
      visible={visible}
      onClose={onClose}
      title={heading}
      message={message}
      actions={
        <>
          <DialogButton label="Отмена" onPress={onClose} />
          <DialogButton
            label={confirmLabel}
            onPress={confirm}
            variant="primary"
            disabled={!canConfirm}
          />
        </>
      }
    >
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
    </Dialog>
  );
}
