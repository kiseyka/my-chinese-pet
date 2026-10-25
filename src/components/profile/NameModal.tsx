// src/components/profile/NameModal.tsx
//
// Окно «Как тебя зовут?» — тот же вид, что у названия набора (Dialog).
// Под именем — «Как к тебе обращаться?»: он / она. Повторный тап снимает выбор
// (не указано — панда пишет нейтрально: «ты пил(а)»).

import { Dialog, DialogButton } from "@/components/ui/Dialog";
import { MAX_NAME_LENGTH } from "@/store/profileStore";
import { colors } from "@/theme/colors";
import type { Gender } from "@/utils/gender";
import { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

const GENDERS: { value: Gender; label: string }[] = [
  { value: "male", label: "Он" },
  { value: "female", label: "Она" },
];

interface NameModalProps {
  visible: boolean;
  initialName: string;
  initialGender: Gender | null;
  onConfirm: (name: string, gender: Gender | null) => void;
  onClose: () => void;
}

export function NameModal({
  visible,
  initialName,
  initialGender,
  onConfirm,
  onClose,
}: NameModalProps) {
  const [name, setName] = useState(initialName);
  const [gender, setGender] = useState(initialGender);

  useEffect(() => {
    if (visible) {
      setName(initialName);
      setGender(initialGender);
    }
  }, [visible, initialName, initialGender]);

  // Имя можно не задавать, если выбран только род
  const canConfirm = name.trim().length > 0 || gender !== initialGender;
  const confirm = () => {
    if (canConfirm) onConfirm(name, gender);
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

      <View className="gap-2">
        <Text className="font-nunito text-small text-textSecondary">
          Как к тебе обращаться? Панда скажет «ты пил» или «ты пила»
        </Text>
        <View className="flex-row gap-2">
          {GENDERS.map((option) => {
            const active = gender === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => setGender(active ? null : option.value)}
                className={`min-h-11 flex-1 items-center justify-center rounded-2xl px-3 active:opacity-70 ${
                  active ? "bg-primary" : "border border-primary/30 bg-surface"
                }`}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text
                  className={`font-nunitoBold text-body ${
                    active ? "text-white" : "text-text"
                  }`}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </Dialog>
  );
}
