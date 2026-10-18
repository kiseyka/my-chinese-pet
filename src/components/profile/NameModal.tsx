// src/components/profile/NameModal.tsx
//
// Окно «Как тебя зовут?» — тот же вид, что у названия набора (Dialog).

import { Dialog, DialogButton } from "@/components/ui/Dialog";
import { MAX_NAME_LENGTH } from "@/store/profileStore";
import { colors } from "@/theme/colors";
import { useEffect, useState } from "react";
import { TextInput } from "react-native";

interface NameModalProps {
  visible: boolean;
  initialName: string;
  onConfirm: (name: string) => void;
  onClose: () => void;
}

export function NameModal({
  visible,
  initialName,
  onConfirm,
  onClose,
}: NameModalProps) {
  const [name, setName] = useState(initialName);

  useEffect(() => {
    if (visible) setName(initialName);
  }, [visible, initialName]);

  const canConfirm = name.trim().length > 0;
  const confirm = () => {
    if (canConfirm) onConfirm(name);
  };

  return (
    <Dialog
      visible={visible}
      onClose={onClose}
      title="Как тебя зовут?"
      message="Имя видно только тебе и панде"
      actions={
        <>
          <DialogButton label="Отмена" onPress={onClose} />
          <DialogButton
            label="Сохранить"
            onPress={confirm}
            variant="primary"
            disabled={!canConfirm}
          />
        </>
      }
    >
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Имя"
        placeholderTextColor={colors.textSecondary}
        maxLength={MAX_NAME_LENGTH}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={confirm}
        className="min-h-12 rounded-2xl bg-surface px-4 py-3 font-nunito text-body text-text"
        accessibilityLabel="Имя"
      />
    </Dialog>
  );
}
