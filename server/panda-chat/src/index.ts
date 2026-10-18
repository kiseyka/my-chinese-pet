// server/panda-chat/src/index.ts
//
// ЧАТ С ПАНДОЙ — сервер-посредник между приложением и моделью Cloudflare Workers AI.
//
// Два вида запросов (POST):
//   Реплика:  { messages: [{ role: "user" | "panda", text, ru? }], name, known: ["你", "好"], stage? }
//             → 200 { reply: { zh, pinyin, syllables, ru } }
//             syllables — пиньинь каждого символа zh (по одному на символ, знаки — как есть),
//             чтобы приложение подписало пиньинь под каждым словом.
//   Слово:    { mode: "explain", word: "冰淇淋", sentence: "冰淇淋很好吃吗？" }
//             → 200 { explanation: "…" } — что слово значит в этой фразе, по-русски.
// Ошибки:
//   400 { error: "bad_request" }  — приложение прислало что-то не то
//   429 { error: "quota" }        — бесплатные «нейроны» на сегодня кончились (сброс в 00:00 UTC)
//   502 { error: "model" }        — модель ответила ошибкой или непонятным текстом
//
// Ключей здесь нет: модель доступна через привязку AI (wrangler.jsonc).
// Модель задаётся в wrangler.jsonc (vars.MODEL) — поменять и снова `npx wrangler deploy`.
// Модель пишет только иероглифы и перевод. Пиньинь считает библиотека pinyin-pro:
// она не путает тоны так, как модель, и знает изменения тонов у 不 и 一.

import { pinyin } from "pinyin-pro";
import { buildExplainPrompt, buildSystemPrompt } from "./prompt";

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
/** Потолок длины ответа. Ответ панды — около 50 токенов; потолок защищает лимит, если модель разговорится. */
const MAX_TOKENS = 200;
/**
 * Сколько ждать одну модель. Обычно ответ за 1 секунду; если Cloudflare завис —
 * не ждём, а спрашиваем запасную модель. Две попытки укладываются в 40 секунд,
 * которые ждёт приложение.
 */
const MODEL_TIMEOUT_MS = 15_000;

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
  /** Пиньинь по символам zh: Array.from(zh)[i] ↔ syllables[i]. */
  syllables: string[];
  /** Слова реплики (их склейка = zh); пусто — модель не разбила, приложение разобьёт само. */
  words: string[];
  ru: string;
}

interface ExplainRequest {
  word: string;
  sentence: string;
}

function parseExplainRequest(raw: Record<string, unknown>): ExplainRequest | null {
  if (!isString(raw.word) || !isString(raw.sentence)) return null;
  const word = raw.word.trim();
  const sentence = raw.sentence.trim();
  if (!word || Array.from(word).length > MAX_WORD_LENGTH) return null;
  if (!sentence || sentence.length > 200) return null;
  return { word, sentence };
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

type ModelMessage = { role: string; content: string };

/** Qwen 3 по умолчанию «думает» перед ответом — долго; так ему велят не думать. */
function systemMessage(prompt: string, model: string): ModelMessage {
  const noThink = model.includes("qwen3") ? "\n/no_think" : "";
  return { role: "system", content: prompt + noThink };
}

function toModelMessages(request: ChatRequest, model: string): ModelMessage[] {
  return [
    systemMessage(buildSystemPrompt(request), model),
    ...request.messages.map((message) =>
      message.role === "panda"
        ? {
            role: "assistant",
            // Приложение присылает реплики панды со словами через пробел —
            // тот же формат, что модель должна выдать
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
        return makeReply(
          data.zh.slice(0, 200),
          isString(data.ru) ? data.ru.trim().slice(0, 300) : "",
        );
      }
    } catch {
      // ниже — запасной вариант
    }
  }

  // Модель забыла про JSON, но ответила по-китайски — показываем как есть
  if (HAN.test(cleaned) && !cleaned.includes("{")) {
    return makeReply(cleaned.slice(0, 120), "");
  }
  return null;
}

/**
 * Слова из ответа модели: «我 没 吃过 冰淇淋。» → 我 · 没 · 吃过 · 冰淇淋 · 。
 * Модель разделяет слова пробелами; знаки, прилипшие к слову, отделяем сами.
 * Пробелы внутри латиницы (имя «Ann Lee») в китайском тексте редки — не страшно.
 */
function splitWords(spaced: string): string[] {
  const words: string[] = [];
  for (const token of spaced.trim().split(/\s+/)) {
    // Иероглифы отдельно от знаков и латиницы: «吗？» → 吗 · ？
    const parts = token.match(/\p{Script=Han}+|[^\p{Script=Han}]+/gu) ?? [];
    words.push(...parts);
  }
  return words;
}

function makeReply(spacedZh: string, ru: string): PandaReply {
  const words = splitWords(spacedZh);
  const zh = words.join("");
  // Модель не разделила слова (одно длинное «слово») — пусть приложение разобьёт само
  const hanWords = words.filter((w) => HAN.test(w));
  const spaced = hanWords.length > 1 || Array.from(zh).length <= 4;
  return {
    zh,
    pinyin: toPinyin(zh),
    syllables: pinyin(zh, { type: "array" }),
    words: spaced ? words : [],
    ru,
  };
}

/** Объяснение слова: {"ru": "…"}. */
function parseExplanation(text: string): string | null {
  const cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end > start) {
    try {
      const data = JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
      if (isString(data.ru) && data.ru.trim()) return data.ru.trim().slice(0, 400);
    } catch {
      // ниже — запасной вариант
    }
  }
  // Ответила просто текстом — тоже годится, если это не обрывок JSON
  return cleaned && !cleaned.includes("{") ? cleaned.slice(0, 400) : null;
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

    const raw = (body ?? {}) as Record<string, unknown>;

    // Что значит слово
    if (raw.mode === "explain") {
      const explain = parseExplainRequest(raw);
      if (!explain) return json({ error: "bad_request" }, 400);
      const outcome = await askModels(
        env,
        (model) => [
          systemMessage(buildExplainPrompt(explain.word, explain.sentence), model),
          { role: "user", content: explain.word },
        ],
        parseExplanation,
      );
      return "value" in outcome
        ? json({ explanation: outcome.value })
        : json({ error: outcome.error }, outcome.error === "quota" ? 429 : 502);
    }

    // Реплика панды
    const chat = parseRequest(body);
    if (!chat) return json({ error: "bad_request" }, 400);
    const outcome = await askModels(
      env,
      (model) => toModelMessages(chat, model),
      parseReply,
    );
    return "value" in outcome
      ? json({ reply: outcome.value })
      : json({ error: outcome.error }, outcome.error === "quota" ? 429 : 502);
  },
} satisfies ExportedHandler<Env>;

/** Основная модель, при сбое — запасная. Лимит общий: кончился — запасную не спрашиваем. */
async function askModels<T>(
  env: Env,
  buildMessages: (model: string) => ModelMessage[],
  parse: (text: string) => T | null,
): Promise<{ value: T } | { error: "quota" | "model" }> {
  const primary = env.MODEL || DEFAULT_MODEL;
  const models =
    primary === FALLBACK_MODEL ? [primary] : [primary, FALLBACK_MODEL];

  for (const model of models) {
    const outcome = await askModel(env, model, buildMessages(model), parse);
    if (outcome.value !== undefined) return { value: outcome.value };
    if (outcome.quota) return { error: "quota" };
  }
  return { error: "model" };
}

/** Один запрос к модели. Всё, что пошло не так, — в логах (`npx wrangler tail`). */
async function askModel<T>(
  env: Env,
  model: string,
  messages: ModelMessage[],
  parse: (text: string) => T | null,
): Promise<{ value?: T; quota?: boolean }> {
  const startedAt = Date.now();
  let result: unknown;
  try {
    const call = env.AI.run(
      model as any,
      {
        messages,
        max_tokens: MAX_TOKENS,
        temperature: 0.7,
        // Gemma 4 по умолчанию «думает» перед ответом и тратит на это все токены —
        // ответ приходит пустым. Выключаем размышления (у Qwen для этого /no_think).
        ...(!model.includes("qwen3") && {
          chat_template_kwargs: { enable_thinking: false },
        }),
      } as any,
    );
    result = await Promise.race([
      call,
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error(`timeout after ${MODEL_TIMEOUT_MS} ms`)),
          MODEL_TIMEOUT_MS,
        ),
      ),
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${model} error: ${message}`);
    return { quota: isQuotaError(error) };
  }

  const text = extractText(result);
  console.log(`${model} answered in ${Date.now() - startedAt} ms`);
  const value = parse(text);
  if (value === null) {
    console.error(
      `${model} unparsable reply: ${JSON.stringify(result).slice(0, 800)}`,
    );
    return {};
  }
  return { value };
}
