// src/utils/panda/chatApi.ts
//
// Запрос к серверу чата с пандой (server/panda-chat).
// Адрес сервера — EXPO_PUBLIC_PANDA_CHAT_URL в файле .env.local в корне проекта.
// После изменения .env.local перезапустить Metro: npx expo start --dev-client --clear

import type { ChatRole } from "@/store/pandaChatStore";

const CHAT_URL = process.env.EXPO_PUBLIC_PANDA_CHAT_URL;

/** Сервер ждёт одну модель до 15 с, потом запасную — итого не больше ~30–35 с. */
const TIMEOUT_MS = 40_000;

export interface ChatRequest {
  /** ru — перевод реплики панды: модель видит в истории тот же формат, что должна выдать. */
  messages: { role: ChatRole; text: string; ru?: string }[];
  /** Имя из профиля, чтобы панда обращалась по имени (может быть пустым). */
  name: string;
  known: string[];
  stage?: { title: string; words: string[] };
}

export interface PandaReply {
  zh: string;
  pinyin: string;
  /** Пиньинь по символам zh (может отсутствовать у старого сервера). */
  syllables?: string[];
  /** Слова реплики, как их разделила модель (может быть пусто). */
  words?: string[];
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
  const data = await post<{ reply?: PandaReply }>(request);
  if (!data.reply?.zh) throw new ChatError("failed");
  return data.reply;
}

/**
 * Что значит слово в реплике панды: простыми словами по-китайски (zh может быть пустым,
 * если просто не объяснить) и по-русски. known — слова пользователя, ими панда и объясняет.
 */
export async function explainWord(
  word: string,
  sentence: string,
  known: string[],
): Promise<PandaReply> {
  const data = await post<{ explanation?: PandaReply }>({
    mode: "explain",
    word,
    sentence,
    known,
  });
  if (!data.explanation || (!data.explanation.zh && !data.explanation.ru)) {
    throw new ChatError("failed");
  }
  return data.explanation;
}

async function post<T>(body: unknown): Promise<T> {
  if (!CHAT_URL) throw new ChatError("no_url");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(CHAT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
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
    return (await response.json()) as T;
  } catch {
    throw new ChatError("failed");
  }
}
