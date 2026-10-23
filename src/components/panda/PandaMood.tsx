// src/components/panda/PandaMood.tsx
//
// Как панда в сцене разговора (/panda-talk) отзывается на то, что происходит в диалоге.
// Диалог (фразы, вопросы, загадки) только сообщает события, а сцена решает, что
// показать в Rive (PandaTalkStage):
//   setListening(true)  — ждёт ответа (вопрос или загадка ещё без ответа);
//   react("happy")      — ответили на вопрос, верно отгадали загадку;
//   react("surprised")  — ошибка в загадке или неожиданный ответ («четыре?»).
// «Говорит» — отдельно, по озвучке (store/speechStore).
//
// Вне сцены (например, фразы в профиле) провайдера нет — события просто ничего не делают.

import { createContext, useContext, useEffect } from "react";

export type PandaReaction = "happy" | "surprised";

export interface PandaMood {
  setListening: (listening: boolean) => void;
  react: (reaction: PandaReaction) => void;
}

const noop: PandaMood = { setListening: () => {}, react: () => {} };

export const PandaMoodContext = createContext<PandaMood>(noop);

export function usePandaMood(): PandaMood {
  return useContext(PandaMoodContext);
}

/** Панда слушает, пока waiting — true (и перестаёт, когда компонент уходит). */
export function usePandaListening(waiting: boolean) {
  const { setListening } = usePandaMood();
  useEffect(() => {
    setListening(waiting);
    return () => setListening(false);
  }, [waiting, setListening]);
}
