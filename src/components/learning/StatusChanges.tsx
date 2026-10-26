// src/components/learning/StatusChanges.tsx
//
// Экран итогов: «Перешли в изученные» — слова, которые за тренировку набрали все
// точки (6, у слова без письма — 3) или, уже со всеми точками, ушли из «Повторения»
// после верного ответа или «знаю» в самопроверке.
// Строки выглядят как ячейки «Словаря»: изучено — фон шалфея, в повторении —
// зелёная рамка; вид меняется сразу, когда ставишь или снимаешь закладку. Под заголовком — откуда пришли
// («Из повторения → В изученное · 4»). Отменить — закладка (слово уходит
// в повторение). Справа те же кнопки, что у остальных слов итогов.
//
// «Вернулись в повторение» — изученные слова с ошибкой (в письме — с подсказками):
// тренировка положила их в повторение, закладка уже стоит; сняв её, слово
// останется изученным.
// Ниже на экране — свёрнутые «Ошибки» и «Верно»: слово может быть и там.
// Изменения — снимок конца тренировки (gameStore.statusChanges): после отмены слово
// остаётся в своём разделе, меняется только закладка (ничего не прыгает).

import { SetWordRow } from "@/components/flashcards/SetWordRow";
import { TransitionLine } from "@/components/learning/TransitionLine";
import { ResultActions } from "@/components/results/ResultActions";
import type { Word } from "@/content/flashcards/types";
import type { StatusChange } from "@/utils/learning";
import { findAnyWords } from "@/utils/wordSource";
import LearnedIcon from "@/assets/images/icons/circle-check.svg";
import ReviewIcon from "@/assets/images/icons/bookmark.svg";
import { useWordProgressStore } from "@/store/wordProgressStore";
import { colors } from "@/theme/colors";
import { statusOf } from "@/utils/learning";
import { useMemo, type ReactNode } from "react";
import { Text, View } from "react-native";

interface StatusChangesProps {
  changes: StatusChange[];
  onOpenWord: (word: Word) => void;
}

export function StatusChanges({ changes, onOpenWord }: StatusChangesProps) {
  const { words, returned, fromReview, fromLearning } = useMemo(() => {
    const learned = changes.filter((c) => c.after === "learned");
    return {
      words: findAnyWords(learned.map((c) => c.wordId)),
      returned: findAnyWords(
        changes
          .filter((c) => c.before === "learned" && c.after === "review")
          .map((c) => c.wordId),
      ),
      fromReview: learned.filter((c) => c.before === "review").length,
      fromLearning: learned.filter((c) => c.before === "learning").length,
    };
  }, [changes]);

  if (words.length === 0 && returned.length === 0) return null;

  const row = (word: Word) => (
    <StatusRow key={word.vocabularyId} word={word} onOpenWord={onOpenWord} />
  );

  return (
    <View className="gap-6">
      {words.length > 0 && (
        <View className="gap-2">
          <View className="gap-1">
            <Heading icon={<LearnedMark />}>
              Перешли в изученные · {words.length}
            </Heading>
            {fromReview > 0 && (
              <TransitionLine
                from="Из повторения"
                to="В изученное"
                count={fromReview}
              />
            )}
            {fromLearning > 0 && (
              <TransitionLine
                from="Набрали все точки"
                to="В изученное"
                count={fromLearning}
              />
            )}
          </View>
          {words.map(row)}
        </View>
      )}

      {returned.length > 0 && (
        <View className="gap-2">
          <View className="gap-1">
            <Heading icon={<ReviewMark />}>
              Вернулись в повторение · {returned.length}
            </Heading>
            <TransitionLine from="Из изученного" to="В повторение" />
          </View>
          {returned.map(row)}
        </View>
      )}
    </View>
  );
}

/**
 * Строка слова, которая показывает, где слово сейчас, — как ячейка в «Словаре»:
 * изучено — фон шалфея, в повторении — зелёная рамка. Закладка справа
 * переключает, и строка сразу меняет вид: видно, что отмена сработала.
 */
function StatusRow({
  word,
  onOpenWord,
}: {
  word: Word;
  onOpenWord: (word: Word) => void;
}) {
  const status = useWordProgressStore((s) =>
    statusOf(word.vocabularyId, s.flashcardWords, s.review),
  );

  return (
    <SetWordRow
      word={word}
      action="open"
      compact
      tone={status === "learning" ? "plain" : status}
      onPress={() => {}}
      onOpenWord={onOpenWord}
      trailing={<ResultActions word={word} onOpenWord={onOpenWord} />}
    />
  );
}

function Heading({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <View className="flex-row items-center gap-2">
      {icon}
      <Text className="font-nunitoBold text-lead text-text">{children}</Text>
    </View>
  );
}

/** Значки как у плиток «Изученное» и «Повторение» в «Словаре». */
function LearnedMark() {
  return (
    <View className="h-7 w-7 items-center justify-center rounded-lg bg-learned">
      <LearnedIcon width={16} height={16} color={colors.primary} />
    </View>
  );
}

function ReviewMark() {
  return (
    <View className="h-7 w-7 items-center justify-center rounded-lg border border-primary bg-primary/15">
      <ReviewIcon width={16} height={16} color={colors.primary} />
    </View>
  );
}
