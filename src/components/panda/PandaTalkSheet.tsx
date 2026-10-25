// src/components/panda/PandaTalkSheet.tsx
//
// Разговор с пандой — нижняя шторка поверх комнаты (панда в комнате видна над ней).
// Открывается любым тапом по панде:
//   есть облачко — сначала фраза дня (PhraseOfDay), после «Продолжить» — меню игр;
//   нет облачка  — сразу меню игр «Чем займёмся?» (PlayContent). В меню — «Фраза дня»,
//                  если её уже читали сегодня: открыть ещё раз.
// Закрыть — свайп вниз или тап по затемнению. Недочитанная фраза остаётся, облачко
// вернётся. Панды крупным планом нет (решено 25 октября).
//
// Переход на другой экран (письмо, этап из тултипа слова) сначала закрывает шторку:
// иначе она осталась бы поверх нового экрана.

import { usePandaStore } from "@/store/pandaStore";
import { resolveThought } from "@/utils/panda/thoughts";
import { useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { PlayContent } from "./PandaPlayContent";
import { PhraseOfDay } from "./PandaThoughtContent";

type Step =
  | { kind: "menu" }
  /**
   * again — фраза, прочитанная сегодня, открыта ещё раз из меню;
   * room — фраза о комнате (в коллекцию не идёт).
   */
  | { kind: "phrase"; phraseId: string; again: boolean; room?: boolean };

interface PandaTalkSheetProps {
  /** Номер открытия (новое число — разговор с начала); null — шторка закрыта. */
  openId: number | null;
  onClose: () => void;
}

export function PandaTalkSheet({ openId, onClose }: PandaTalkSheetProps) {
  return (
    <BottomSheet item={openId} onClose={onClose}>
      {(id) => <TalkContent key={id} onClose={onClose} />}
    </BottomSheet>
  );
}

function TalkContent({ onClose }: { onClose: () => void }) {
  // Есть фраза дня (облачко) — начинаем с неё, иначе сразу меню игр
  const [step, setStep] = useState<Step>(() => {
    const thought = usePandaStore.getState().thought;
    return thought
      ? {
          kind: "phrase",
          phraseId: thought.phraseId,
          again: false,
          room: thought.kind === "room",
        }
      : { kind: "menu" };
  });

  if (step.kind === "menu") {
    return (
      <PlayContent
        onClose={onClose}
        onOpenPhrase={(phraseId) => setStep({ kind: "phrase", phraseId, again: true })}
      />
    );
  }

  return (
    <PhraseOfDay
      key={`${step.phraseId}-${step.again}`}
      phraseId={step.phraseId}
      again={step.again}
      collect={!step.room}
      onDone={() => {
        if (!step.again) resolveThought();
        setStep({ kind: "menu" });
      }}
      // Ушли на экран этапа — шторку закрываем, недочитанная фраза остаётся
      onLeave={onClose}
    />
  );
}
