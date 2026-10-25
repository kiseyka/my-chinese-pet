// src/components/panda/PandaMood.tsx
//
// Как панда в сцене разговора (/panda-talk) отзывается на то, что происходит в диалоге.
// Диалог (фразы, вопросы, загадки) только сообщает события, а сцена решает, что
// показать в Rive (PandaTalkStage):
//   setWaiting("listening") — ждёт ответа на свой вопрос (наклон головы);
//   setWaiting("thinking")  — загадала загадку и думает вместе с тобой (лапка у
//                             подбородка): «Как по-китайски …?», «Послушай и угадай»;
//   setWaiting(null)        — больше не ждёт;
//   react("happy")      — ответили на вопрос, верно отгадали загадку;
//   react("surprised")  — ошибка в загадке или неожиданный ответ («четыре?»).
// «Говорит» — отдельно, по озвучке (store/speechStore).
//
// Вне сцены (например, фразы в профиле) провайдера нет — события просто ничего не делают.

import { createContext, useContext, useEffect } from "react";

export type PandaReaction = "happy" | "surprised";
export type PandaWaiting = "listening" | "thinking";

export interface PandaMood {
  setWaiting: (waiting: PandaWaiting | null) => void;
  react: (reaction: PandaReaction) => void;
}

const noop: PandaMood = { setWaiting: () => {}, react: () => {} };

export const PandaMoodContext = createContext<PandaMood>(noop);

export function usePandaMood(): PandaMood {
  return useContext(PandaMoodContext);
}

/** Панда ждёт (слушает или думает), пока active — true; перестаёт, когда компонент уходит. */
export function usePandaWaiting(active: boolean, how: PandaWaiting) {
  const { setWaiting } = usePandaMood();
  useEffect(() => {
    setWaiting(active ? how : null);
    return () => setWaiting(null);
  }, [active, how, setWaiting]);
}
