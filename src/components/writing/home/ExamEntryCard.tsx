// src/components/writing/home/ExamEntryCard.tsx
//
// Вход в экзамен на экране «Написание» — такая же строка, как «Повторение»:
//   есть готовые слова — «Экзамен · 12 слов», по тапу открывается ExamModal;
//   готовых нет, но скоро будут — «Экзамен · через 5 ч» (в окне видно, какие слова);
//   иначе строки нет.

import { EntryRow } from "@/components/ui/EntryRow";
import { formatExamWait, pluralWords } from "@/utils/writing/labels";
import { SealMark } from "../SealMark";

interface ExamEntryCardProps {
  /** Сколько слов готово к экзамену прямо сейчас. */
  readyCount: number;
  /** Когда откроется ближайший экзамен (если готовых нет). */
  nextAvailableAt?: number;
  now: number;
  onPress: () => void;
}

export function ExamEntryCard({
  readyCount,
  nextAvailableAt,
  now,
  onPress,
}: ExamEntryCardProps) {
  if (readyCount === 0 && nextAvailableAt === undefined) return null;

  const value =
    readyCount > 0
      ? `${readyCount} ${pluralWords(readyCount)}`
      : formatExamWait(nextAvailableAt!, now);

  return (
    <EntryRow
      icon={<SealMark size={28} />}
      title="Экзамен"
      value={value}
      onPress={onPress}
    />
  );
}
