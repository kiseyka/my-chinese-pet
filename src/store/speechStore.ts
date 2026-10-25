// src/store/speechStore.ts
//
// Идёт ли сейчас озвучка (не сохраняется на диск). По нему панда в сцене разговора
// «говорит» (вход talking в panda_talk.riv), пока звучит фраза.

import { create } from "zustand";

interface SpeechStore {
  /** Номер звучащей фразы; 0 — тишина. */
  speakingId: number;
}

export const useSpeechStore = create<SpeechStore>()(() => ({ speakingId: 0 }));

let nextId = 0;

/** Началась новая фраза: её номер — чтобы конец старой не погасил новую. */
export function speechStarted(): number {
  nextId += 1;
  useSpeechStore.setState({ speakingId: nextId });
  return nextId;
}

export function speechEnded(id: number) {
  if (useSpeechStore.getState().speakingId === id) {
    useSpeechStore.setState({ speakingId: 0 });
  }
}
