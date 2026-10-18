// server/panda-chat/src/index.ts
//
// ЧАТ С ПАНДОЙ — сервер-посредник между приложением и моделью Cloudflare Workers AI.
//
// Приложение шлёт POST с историей и словами пользователя:
//   { messages: [{ role: "user" | "panda", text, ru? }], known: ["你", "好"], stage?: { title, words } }
// Сервер собирает промпт панды, спрашивает модель и отвечает:
//   200 { reply: { zh, pinyin, ru } }
//   400 { error: "bad_request" }  — приложение прислало что-то не то
//   429 { error: "quota" }        — бесплатные «нейроны» на сегодня кончились (сброс в 00:00 UTC)
//   502 { error: "model" }        — модель ответила ошибкой или непонятным текстом
//
// Ключей здесь нет: модель доступна через привязку AI (wrangler.jsonc).
// Модель задаётся в wrangler.jsonc (vars.MODEL) — поменять и снова `npx wrangler deploy`.
// Модель пишет только иероглифы и перевод. Пиньинь считает библиотека pinyin-pro:
// она не путает тоны так, как модель, и знает изменения тонов у 不 и 一.

import { pinyin } from "pinyin-pro";
import { buildSystemPrompt } from "./prompt";

interface Env {
  AI: Ai;
  /** Модель Workers AI из wrangler.jsonc. */
  MODEL?: string;
}

/** Если в wrangler.jsonc модель не указана. */
const DEFAULT_MODEL = "@cf/google/gemma-4-26b-a4b-it";
/** Запасная модель: если основная ответила ошибкой или непонятно, спрашиваем её. */
const FALLBACK_MODEL = "@cf/qwen/qwen3-30b-a3b-fp8";

/** Сколько последних сообщений истории отправлять модели. */
const MAX_HISTORY = 8;
const MAX_MESSAGE_LENGTH = 300;
const MAX_KNOWN_WORDS = 150;
const MAX_STAGE_WORDS = 20;
const MAX_WORD_LENGTH = 8;
/** Ответ панды короткий; запас — на случай, если модель всё же начнёт «думать». */
const MAX_TOKENS = 500;

type ChatRole = "user" | "panda";

interface ChatMessage {
  role: ChatRole;
  text: string;
  /** Перевод реплики панды — чтобы в истории модель видела тот же формат, что должна выдать. */
  ru?: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  /** Имя пользователя из профиля (может быть пустым). */
  name: string;
  known: string[];
  stage?: { title: string; words: string[] };
}

interface PandaReply {
  zh: string;
  pinyin: string;
  ru: string;
}

// ── Ответы ───────────────────────────────────────────────────────────────────

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

// ── Проверка запроса ─────────────────────────────────────────────────────────

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function cleanWords(value: unknown, max: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isString)
    .map((word) => word.trim())
    .filter((word) => word.length > 0 && word.length <= MAX_WORD_LENGTH)
    .slice(0, max);
}

function parseRequest(body: unknown): ChatRequest | null {
  if (!body || typeof body !== "object") return null;
  const raw = body as Record<string, unknown>;
  if (!Array.isArray(raw.messages)) return null;

  const messages: ChatMessage[] = [];
  for (const item of raw.messages.slice(-MAX_HISTORY)) {
    if (!item || typeof item !== "object") return null;
    const { role, text, ru } = item as Record<string, unknown>;
    if ((role !== "user" && role !== "panda") || !isString(text)) return null;
    const trimmed = text.trim().slice(0, MAX_MESSAGE_LENGTH);
    if (!trimmed) continue;
    messages.push({
      role,
      text: trimmed,
      ...(role === "panda" &&
        isString(ru) && { ru: ru.trim().slice(0, MAX_MESSAGE_LENGTH) }),
    });
  }
  // Последнее сообщение — от пользователя, иначе отвечать не на что
  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    return null;
  }

  let stage: ChatRequest["stage"];
  if (raw.stage && typeof raw.stage === "object") {
    const { title, words } = raw.stage as Record<string, unknown>;
    if (isString(title)) {
      stage = {
        title: title.trim().slice(0, 60),
        words: cleanWords(words, MAX_STAGE_WORDS),
      };
    }
  }

  const name = isString(raw.name) ? raw.name.trim().slice(0, 24) : "";

  return {
    messages,
    name,
    known: cleanWords(raw.known, MAX_KNOWN_WORDS),
    stage,
  };
}

// ── Промпт (сам текст — в prompt.ts) ─────────────────────────────────────────

function toModelMessages(request: ChatRequest, model: string) {
  // Qwen 3 по умолчанию «думает» перед ответом — долго; так ему велят не думать
  const noThink = model.includes("qwen3") ? "\n/no_think" : "";
  return [
    { role: "system", content: buildSystemPrompt(request) + noThink },
    ...request.messages.map((message) =>
      message.role === "panda"
        ? {
            role: "assistant",
            content: JSON.stringify({ zh: message.text, ru: message.ru ?? "" }),
          }
        : { role: "user", content: message.text },
    ),
  ];
}

// ── Ответ модели ─────────────────────────────────────────────────────────────

const HAN = /\p{Script=Han}/u;

/** Китайская пунктуация → обычная, чтобы пиньинь читался: «hěn hǎo! nǐ ne?» */
const PUNCTUATION: Record<string, string> = {
  "，": ",",
  "。": ".",
  "！": "!",
  "？": "?",
  "：": ":",
  "；": ";",
  "、": ",",
  "（": "(",
  "）": ")",
  "“": '"',
  "”": '"',
};

/** Пиньинь с тонами: слоги через пробел, знаки препинания прижаты к слогу. */
function toPinyin(zh: string): string {
  const syllables = pinyin(zh, { type: "array", nonZh: "consecutive" });
  let result = "";
  for (const part of syllables) {
    const item = part.trim();
    if (!item) continue;
    const mapped = Array.from(item)
      .map((ch) => PUNCTUATION[ch] ?? ch)
      .join("");
    const isPunctuation = !/\p{L}/u.test(mapped);
    result += isPunctuation || !result ? mapped : ` ${mapped}`;
  }
  return result.trim();
}

/** Текст из ответа модели: у новых моделей — choices[0].message.content, у старых — response. */
function extractText(result: unknown): string {
  if (!result || typeof result !== "object") return "";
  const raw = result as Record<string, any>;
  if (isString(raw.response)) return raw.response;
  const content = raw.choices?.[0]?.message?.content;
  if (isString(content)) return content;
  // Некоторые модели отдают content списком частей: [{ type: "text", text }]
  if (Array.isArray(content)) {
    return content
      .map((part: any) => (isString(part?.text) ? part.text : ""))
      .join("");
  }
  return "";
}

function parseReply(text: string): PandaReply | null {
  // Qwen иногда «думает» вслух перед ответом
  const cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end > start) {
    try {
      const data = JSON.parse(cleaned.slice(start, end + 1)) as Record<
        string,
        unknown
      >;
      if (isString(data.zh) && HAN.test(data.zh)) {
        const zh = data.zh.trim().slice(0, 120);
        return {
          zh,
          pinyin: toPinyin(zh),
          ru: isString(data.ru) ? data.ru.trim().slice(0, 300) : "",
        };
      }
    } catch {
      // ниже — запасной вариант
    }
  }

  // Модель забыла про JSON, но ответила по-китайски — показываем как есть
  if (HAN.test(cleaned) && !cleaned.includes("{")) {
    const zh = cleaned.slice(0, 120);
    return { zh, pinyin: toPinyin(zh), ru: "" };
  }
  return null;
}

/** Бесплатный лимит на сегодня исчерпан (код 4006 у Workers AI). */
function isQuotaError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /4006|daily free allocation|neurons/i.test(message);
}

// ── Обработчик ───────────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== "POST") {
      return json({ ok: true, hint: "POST a chat request" });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return json({ error: "bad_request" }, 400);
    }

    const chat = parseRequest(body);
    if (!chat) return json({ error: "bad_request" }, 400);

    const primary = env.MODEL || DEFAULT_MODEL;
    const models =
      primary === FALLBACK_MODEL ? [primary] : [primary, FALLBACK_MODEL];

    for (const model of models) {
      const outcome = await askModel(env, model, chat);
      if (outcome.reply) return json({ reply: outcome.reply });
      // Лимит общий на все модели — запасная тоже не ответит
      if (outcome.quota) return json({ error: "quota" }, 429);
    }
    return json({ error: "model" }, 502);
  },
} satisfies ExportedHandler<Env>;

/** Один запрос к модели. Всё, что пошло не так, — в логах (`npx wrangler tail`). */
async function askModel(
  env: Env,
  model: string,
  chat: ChatRequest,
): Promise<{ reply?: PandaReply; quota?: boolean }> {
  const startedAt = Date.now();
  let result: unknown;
  try {
    result = await env.AI.run(
      model as any,
      {
        messages: toModelMessages(chat, model),
        max_tokens: MAX_TOKENS,
        temperature: 0.7,
        // Gemma 4 по умолчанию «думает» перед ответом и тратит на это все токены —
        // ответ приходит пустым. Выключаем размышления (у Qwen для этого /no_think).
        ...(!model.includes("qwen3") && {
          chat_template_kwargs: { enable_thinking: false },
        }),
      } as any,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${model} error: ${message}`);
    return { quota: isQuotaError(error) };
  }

  const text = extractText(result);
  console.log(`${model} answered in ${Date.now() - startedAt} ms`);
  const reply = parseReply(text);
  if (!reply) {
    console.error(
      `${model} unparsable reply: ${JSON.stringify(result).slice(0, 800)}`,
    );
    return {};
  }
  return { reply };
}
