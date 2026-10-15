// src/components/word/SetToggleList.tsx
//
// «Добавить в набор» в панели слова: свои наборы карточками-переключателями
// (как «Добавить в повторение») и «Новый набор» — окно с названием,
// слово сразу попадает в новый набор. Наборы общие для карточек и «Написания».

import PlusIcon from "@/assets/images/icons/circle-plus.svg";
import { SetTitleModal } from "@/components/flashcards/SetTitleModal";
import type { Word } from "@/content/flashcards/types";
import { interopIconColor } from "@/lib/interopIcon";
import { useCustomSetsStore } from "@/store/customSetsStore";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { IconSlot, ToggleCard } from "./ToggleCard";

interopIconColor(PlusIcon);

interface SetToggleListProps {
  word: Word;
  className?: string;
}

export function SetToggleList({ word, className = "" }: SetToggleListProps) {
  const sets = useCustomSetsStore((state) => state.sets);
  const toggleWord = useCustomSetsStore((state) => state.toggleWord);
  const createSet = useCustomSetsStore((state) => state.createSet);

  const [isCreating, setIsCreating] = useState(false);

  return (
    <View className={`gap-2 ${className}`}>
      <Text className="font-nunitoBold text-lead text-text">
        Добавить в набор
      </Text>

      {sets.map((set) => (
        <ToggleCard
          key={set.id}
          label={set.title}
          checked={set.wordIds.includes(word.vocabularyId)}
          onPress={() => toggleWord(set.id, word.vocabularyId)}
        />
      ))}

      {/* Новый набор сразу с этим словом */}
      <Pressable
        onPress={() => setIsCreating(true)}
        className="flex-row items-center gap-3 rounded-2xl border border-dashed border-primary p-4 active:opacity-70"
        accessibilityRole="button"
      >
        <Text className="flex-1 font-nunitoBold text-body text-primary">
          Новый набор
        </Text>
        <IconSlot>
          <PlusIcon width={28} height={28} className="text-primary" />
        </IconSlot>
      </Pressable>

      {/* Поверх панели: название нового набора */}
      <SetTitleModal
        visible={isCreating}
        heading="Новый набор"
        message={`${word.hanzi} сразу попадёт в него`}
        confirmLabel="Создать"
        onClose={() => setIsCreating(false)}
        onConfirm={(title) => {
          const setId = createSet(title);
          toggleWord(setId, word.vocabularyId);
          setIsCreating(false);
        }}
      />
    </View>
  );
}
