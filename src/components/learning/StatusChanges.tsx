// src/components/learning/StatusChanges.tsx
//
// Экран итогов: какие слова тренировка перенесла между «Повторением» и «Изученным».
//   «Перешли в изученные» — набрали все точки (6, у слова без письма — 3) или,
//   уже со всеми точками, ушли из «Повторения» после верного ответа или «знаю»
//   в самопроверке. Кнопка «В повторение» отменяет.
//   «Вернулись в повторение» — ошибка на изученном слове (в письме — подсказки).
//   Кнопка «В изученные» отменяет: вдруг просто поспешил.
// Список снимается один раз при открытии экрана: после отмены слово остаётся
// в своём разделе, меняется только кнопка (ничего не прыгает).

import { SetWordRow } from "@/components/flashcards/SetWordRow";
import { MoveButton } from "@/components/learning/MoveButton";
import type { Word } from "@/content/flashcards/types";
import { collectStatusChanges } from "@/utils/learning";
import { findAnyWords } from "@/utils/wordSource";
import { useState } from "react";
import { Text, View } from "react-native";

interface StatusChangesProps {
  onOpenWord: (word: Word) => void;
}

export function StatusChanges({ onOpenWord }: StatusChangesProps) {
  const [changes] = useState(() => {
    const list = collectStatusChanges();
    return {
      learned: findAnyWords(
        list.filter((c) => c.after === "learned").map((c) => c.wordId),
      ),
      review: findAnyWords(
        list
          .filter((c) => c.before === "learned" && c.after === "review")
          .map((c) => c.wordId),
      ),
    };
  });

  if (changes.learned.length === 0 && changes.review.length === 0) return null;

  return (
    <View className="gap-8">
      {changes.learned.length > 0 && (
        <Section
          title="Перешли в изученные"
          caption="Сомневаешься в слове — отправь его в повторение."
          words={changes.learned}
          onOpenWord={onOpenWord}
        />
      )}
      {changes.review.length > 0 && (
        <Section
          title="Вернулись в повторение"
          caption="В тренировке была ошибка. Если слово знакомо, верни его в изученные."
          words={changes.review}
          onOpenWord={onOpenWord}
        />
      )}
    </View>
  );
}

function Section({
  title,
  caption,
  words,
  onOpenWord,
}: {
  title: string;
  caption: string;
  words: Word[];
  onOpenWord: (word: Word) => void;
}) {
  return (
    <View className="gap-3">
      <View className="gap-1">
        <Text className="font-nunitoBold text-title text-text">
          {title} · {words.length}
        </Text>
        <Text className="font-nunito text-small text-textSecondary">
          {caption}
        </Text>
      </View>
      {words.map((word) => (
        <SetWordRow
          key={word.vocabularyId}
          word={word}
          action="open"
          onPress={() => {}}
          onOpenWord={onOpenWord}
          trailing={<MoveButton word={word} />}
        />
      ))}
    </View>
  );
}
