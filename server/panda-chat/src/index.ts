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

interface Env {
  AI: Ai;
  /** Модель Workers AI из wrangler.jsonc. */
  MODEL?: string;
}

/** Если в wrangler.jsonc модель не указана. */
const DEFAULT_MODEL = "@cf/google/gemma-4-26b-a4b-it";

/** Сколько последних сообщений истории отправлять модели. */
const MAX_HISTORY = 8;
const MAX_MESSAGE_LENGTH = 300;
const MAX_KNOWN_WORDS = 150;
const MAX_STAGE_WORDS = 20;
const MAX_WORD_LENGTH = 8;
/** Ответ панды короткий; запас — на случай, если модель всё же начнёт «думать». */
const MAX_TOKENS = 300;

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

// ── Промпт ───────────────────────────────────────────────────────────────────

function buildSystemPrompt({ name, known, stage }: ChatRequest): string {
  const knownLine =
    known.length > 0
      ? known.join(" ")
      : "(almost none yet — use only the simplest HSK 1 words)";
  const stageLine = stage
    ? `${stage.title}: ${stage.words.join(" ")}`
    : "(no topic — chat about everyday things)";
  const userLine = name
    ? `The user is a human named ${name}. Call them ${name} sometimes.`
    : "The user is a human; you don't know their name yet — you may ask it.";

  return `You are 熊猫 (a panda), a character in a Chinese-learning app. ${userLine} The user is NOT a panda: never call them 熊猫 or 小熊猫.
You and the user are learning Chinese together. You are their friend and study buddy, not a teacher: curious, warm, a little playful, never lecturing.

How to reply:
- Always reply in simple Mandarin Chinese (simplified characters): 1–2 short sentences, at most 40 characters.
- Prefer KNOWN WORDS and TOPIC WORDS below. Other words only if simple (HSK 1–2).
- The user may write in Russian, Chinese or pinyin. Understand them and always answer in Chinese.
- Keep the meaning exact. Example: "тепло" is 暖和, not 热 ("жарко").
- If the user asks how to say something in Chinese, give exactly that phrase in your reply, then continue the chat.
- If the user does not understand you, say the same thing again in even simpler Chinese.
- If the user's Chinese has a mistake, don't explain it — just use the correct form naturally.
- Greet only once at the start of the chat. Keep the conversation going with a simple question about the user or the topic.
- If the user asks for something unsafe or inappropriate, gently change the subject.

Every reply, including later ones, is ONLY a JSON object, nothing else:
{"zh": "<your reply in Chinese>", "ru": "<natural Russian translation of zh>"}

KNOWN WORDS: ${knownLine}
TOPIC WORDS: ${stageLine}`;
}

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
  return isString(content) ? content : "";
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

    const model = env.MODEL || DEFAULT_MODEL;
    const startedAt = Date.now();
    let result: unknown;
    try {
      result = await env.AI.run(
        model as any,
        {
          messages: toModelMessages(chat, model),
          max_tokens: MAX_TOKENS,
          temperature: 0.7,
        } as any,
      );
    } catch (error) {
      console.error("AI error", error);
      const quota = isQuotaError(error);
      return json({ error: quota ? "quota" : "model" }, quota ? 429 : 502);
    }

    const text = extractText(result);
    console.log(`${model} answered in ${Date.now() - startedAt} ms`);
    const reply = parseReply(text);
    if (!reply) {
      console.error("Unparsable reply", text.slice(0, 500));
      return json({ error: "model" }, 502);
    }

    return json({ reply });
  },
} satisfies ExportedHandler<Env>;
