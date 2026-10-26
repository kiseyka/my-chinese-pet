// src/components/learning/StatusChanges.tsx
//
// Экран итогов: «Перешли в изученные» — слова, которые за тренировку набрали все
// точки (6, у слова без письма — 3) или, уже со всеми точками, ушли из «Повторения»
// после верного ответа или «знаю» в самопроверке. Отменить — закладка
// (слово уходит в повторение). Справа те же кнопки, что у остальных слов итогов.
//
// «Вернулись в повторение» (ошибка на изученном слове) показывает не этот блок,
// а сами списки итогов — вместо «Ошибок» / «С подсказками», без повторов.
// Изменения снимает экран итогов один раз при открытии: после отмены слово
// остаётся в своём разделе, меняется только закладка (ничего не прыгает).

import { SetWordRow } from "@/components/flashcards/SetWordRow";
import { ResultActions } from "@/components/results/ResultActions";
import type { Word } from "@/content/flashcards/types";
import type { StatusChange } from "@/utils/learning";
import { findAnyWords } from "@/utils/wordSource";
import { useMemo } from "react";
import { Text, View } from "react-native";

interface StatusChangesProps {
  changes: StatusChange[];
  onOpenWord: (word: Word) => void;
}

export function StatusChanges({ changes, onOpenWord }: StatusChangesProps) {
  const words = useMemo(
    () =>
      findAnyWords(
        changes.filter((c) => c.after === "learned").map((c) => c.wordId),
      ),
    [changes],
  );

  if (words.length === 0) return null;

  return (
    <View className="gap-2">
      <View className="gap-1">
        <Text className="font-nunitoBold text-title text-text">
          Перешли в изученные · {words.length}
        </Text>
        <Text className="font-nunito text-small text-textSecondary">
          Сомневаешься в слове — отметь закладкой, оно останется в повторении.
        </Text>
      </View>
      {words.map((word) => (
        <SetWordRow
          key={word.vocabularyId}
          word={word}
          action="open"
          compact
          onPress={() => {}}
          onOpenWord={onOpenWord}
          trailing={<ResultActions word={word} onOpenWord={onOpenWord} />}
        />
      ))}
    </View>
  );
}
