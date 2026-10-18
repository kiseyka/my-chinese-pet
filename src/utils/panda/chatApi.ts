// src/utils/panda/chatApi.ts
//
// Запрос к серверу чата с пандой (server/panda-chat).
// Адрес сервера — EXPO_PUBLIC_PANDA_CHAT_URL в файле .env.local в корне проекта.
// После изменения .env.local перезапустить Metro: npx expo start --dev-client --clear

import type { ChatRole } from "@/store/pandaChatStore";

const CHAT_URL = process.env.EXPO_PUBLIC_PANDA_CHAT_URL;

/** Модель иногда думает долго; дольше ждать нет смысла. */
const TIMEOUT_MS = 45_000;

export interface ChatRequest {
  /** ru — перевод реплики панды: модель видит в истории тот же формат, что должна выдать. */
  messages: { role: ChatRole; text: string; ru?: string }[];
  known: string[];
  stage?: { title: string; words: string[] };
}

export interface PandaReply {
  zh: string;
  pinyin: string;
  ru: string;
}

/** Почему не получилось: каждой причине — своя фраза на экране. */
export type ChatErrorKind =
  | "no_url" // адрес сервера не задан
  | "offline" // нет сети
  | "timeout" // сервер не ответил вовремя
  | "quota" // бесплатные запросы на сегодня кончились
  | "failed"; // сервер или модель ответили ошибкой

export class ChatError extends Error {
  constructor(public kind: ChatErrorKind) {
    super(kind);
  }
}

export async function askPanda(request: ChatRequest): Promise<PandaReply> {
  if (!CHAT_URL) throw new ChatError("no_url");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(CHAT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal: controller.signal,
    });
  } catch {
    throw new ChatError(controller.signal.aborted ? "timeout" : "offline");
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 429) throw new ChatError("quota");
  if (!response.ok) throw new ChatError("failed");

  try {
    const data = (await response.json()) as { reply?: PandaReply };
    if (!data.reply?.zh) throw new Error("empty");
    return data.reply;
  } catch {
    throw new ChatError("failed");
  }
}
