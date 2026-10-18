// src/store/pandaChatStore.ts
//
// Чат с пандой: история сообщений и дневной лимит.
// Лимит считается на телефоне: сервер общий, а бесплатных запросов в сутки ограниченное число.

import { dayKey } from "@/utils/activity";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/** Сколько сообщений панде можно отправить за день. */
export const DAILY_CHAT_LIMIT = 20;

/** Сколько последних сообщений храним на телефоне. */
const MAX_STORED_MESSAGES = 60;

export type ChatRole = "user" | "panda";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  /** Текст пользователя или реплика панды по-китайски. */
  text: string;
  /** Только у панды: пиньинь и перевод (могут быть пустыми). */
  pinyin?: string;
  ru?: string;
  at: number;
}

interface PandaChatState {
  messages: ChatMessage[];
  /** Сколько сообщений отправлено в день `day` (локальная дата «2026-10-18»). */
  usage: { day: string; count: number };
}

interface PandaChatActions {
  addMessage: (message: Omit<ChatMessage, "id" | "at">) => void;
  /** Засчитать отправленное сообщение в дневной лимит. */
  countSent: () => void;
  clear: () => void;
}

export const usePandaChatStore = create<PandaChatState & PandaChatActions>()(
  persist(
    (set) => ({
      messages: [],
      usage: { day: dayKey(), count: 0 },

      addMessage: (message) =>
        set((state) => ({
          messages: [
            ...state.messages,
            {
              ...message,
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              at: Date.now(),
            },
          ].slice(-MAX_STORED_MESSAGES),
        })),

      countSent: () =>
        set((state) => {
          const today = dayKey();
          const count = state.usage.day === today ? state.usage.count : 0;
          return { usage: { day: today, count: count + 1 } };
        }),

      clear: () => set({ messages: [] }),
    }),
    {
      name: "panda_chat",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

/** Сколько сообщений осталось на сегодня. */
export function getChatMessagesLeft(usage: PandaChatState["usage"]): number {
  const used = usage.day === dayKey() ? usage.count : 0;
  return Math.max(0, DAILY_CHAT_LIMIT - used);
}
