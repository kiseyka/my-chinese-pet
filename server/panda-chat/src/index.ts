// server/panda-chat/src/index.ts
//
// ЧАТ С ПАНДОЙ — сервер-посредник между приложением и моделью Cloudflare Workers AI.
//
// Приложение шлёт POST с историей и словами пользователя:
//   { messages: [{ role: "user" | "panda", text }], known: ["你", "好"], stage?: { title, words } }
// Сервер собирает промпт панды, спрашивает модель и отвечает:
//   200 { reply: { zh, pinyin, ru } }
//   400 { error: "bad_request" }  — приложение прислало что-то не то
//   429 { error: "quota" }        — бесплатные «нейроны» на сегодня кончились (сброс в 00:00 UTC)
//   502 { error: "model" }        — модель ответила ошибкой или непонятным текстом
//
// Ключей здесь нет: модель доступна через привязку AI (wrangler.jsonc).
// Модель меняется одной строкой — MODEL ниже.

interface Env {
  AI: Ai;
}

/** Qwen лучше всех из бесплатных моделей знает китайский; стоит как маленькая Llama 3B. */
const MODEL = "@cf/qwen/qwen3-30b-a3b-fp8";

/** Сколько последних сообщений истории отправлять модели. */
const MAX_HISTORY = 8;
const MAX_MESSAGE_LENGTH = 300;
const MAX_KNOWN_WORDS = 150;
const MAX_STAGE_WORDS = 20;
const MAX_WORD_LENGTH = 8;
/** Ответ панды короткий; запас — на случай, если модель всё же начнёт «думать». */
const MAX_TOKENS = 400;

type ChatRole = "user" | "panda";

interface ChatMessage {
  role: ChatRole;
  text: string;
}

interface ChatRequest {
  messages: ChatMessage[];
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
    const { role, text } = item as Record<string, unknown>;
    if ((role !== "user" && role !== "panda") || !isString(text)) return null;
    const trimmed = text.trim().slice(0, MAX_MESSAGE_LENGTH);
    if (trimmed) messages.push({ role, text: trimmed });
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

  return { messages, known: cleanWords(raw.known, MAX_KNOWN_WORDS), stage };
}

// ── Промпт ───────────────────────────────────────────────────────────────────

function buildSystemPrompt({ known, stage }: ChatRequest): string {
  const knownLine =
    known.length > 0 ? known.join(" ") : "(almost none yet — use only the simplest HSK 1 words)";
  const stageLine = stage
    ? `${stage.title}: ${stage.words.join(" ")}`
    : "(no topic — chat about everyday things)";

  return `You are a small friendly panda who lives in a Chinese-learning app. You are learning Chinese together with the user: a study buddy and friend, NOT a teacher. You are curious, warm and a little playful. You never lecture.

How to reply:
- Always reply in simple Mandarin Chinese (simplified characters): 1–2 short sentences, at most 25 characters in total.
- Build your sentences mostly from KNOWN WORDS and TOPIC WORDS below. If you need another word, use only the most basic HSK 1 words.
- The user may write in Russian, Chinese or pinyin. Always answer in Chinese anyway.
- Keep the conversation going: often ask a simple question about the topic.
- If the user's Chinese has a mistake, do not explain it. Just use the correct form naturally in your reply.
- If the user asks for something unrelated, unsafe or inappropriate, gently change the subject back to everyday chat.

Output ONLY a JSON object, nothing else:
{"zh": "<your reply in Chinese>", "pinyin": "<pinyin with tone marks, words separated by spaces>", "ru": "<natural Russian translation>"}

KNOWN WORDS: ${knownLine}
TOPIC WORDS: ${stageLine}
/no_think`;
}

function toModelMessages(request: ChatRequest) {
  return [
    { role: "system", content: buildSystemPrompt(request) },
    ...request.messages.map((message) => ({
      role: message.role === "panda" ? "assistant" : "user",
      content: message.text,
    })),
  ];
}

// ── Ответ модели ─────────────────────────────────────────────────────────────

const CJK = /[一-鿿]/;

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
      const data = JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
      if (isString(data.zh) && CJK.test(data.zh)) {
        return {
          zh: data.zh.trim().slice(0, 120),
          pinyin: isString(data.pinyin) ? data.pinyin.trim().slice(0, 300) : "",
          ru: isString(data.ru) ? data.ru.trim().slice(0, 300) : "",
        };
      }
    } catch {
      // ниже — запасной вариант
    }
  }

  // Модель забыла про JSON, но ответила по-китайски — показываем как есть
  if (CJK.test(cleaned) && !cleaned.includes("{")) {
    return { zh: cleaned.slice(0, 120), pinyin: "", ru: "" };
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

    let result: unknown;
    try {
      result = await env.AI.run(MODEL as any, {
        messages: toModelMessages(chat),
        max_tokens: MAX_TOKENS,
        temperature: 0.7,
      } as any);
    } catch (error) {
      console.error("AI error", error);
      return json({ error: isQuotaError(error) ? "quota" : "model" }, isQuotaError(error) ? 429 : 502);
    }

    const text = extractText(result);
    const reply = parseReply(text);
    if (!reply) {
      console.error("Unparsable reply", text.slice(0, 500));
      return json({ error: "model" }, 502);
    }

    return json({ reply });
  },
} satisfies ExportedHandler<Env>;
