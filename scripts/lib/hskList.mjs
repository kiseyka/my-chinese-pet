// scripts/lib/hskList.mjs
//
// Общее для скриптов слов: список HSK (Complete HSK Vocabulary, MIT), выбор чтения,
// короткий английский перевод, чтение и запись строк файла src/content/words/data/words.ts.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export const SYSTEM = "newest";
export const ID_PREFIX = "hsk-";

const URL_COMPLETE =
  "https://raw.githubusercontent.com/drkameleon/complete-hsk-vocabulary/main/complete.json";

/** Список HSK. Скачивается один раз в scripts/.cache/complete.json (общий кэш с tag-hsk.mjs). */
export async function loadHskList(root) {
  const cachePath = join(root, "scripts/.cache/complete.json");

  if (!existsSync(cachePath)) {
    console.log("Скачиваю список HSK (около 10 МБ)...");
    const response = await fetch(URL_COMPLETE);

    if (!response.ok) {
      console.error(`Не удалось скачать список: ${response.status}`);
      process.exit(1);
    }

    mkdirSync(dirname(cachePath), { recursive: true });
    writeFileSync(cachePath, Buffer.from(await response.arrayBuffer()));
  }

  return JSON.parse(readFileSync(cachePath, "utf8"));
}

/** Наименьший уровень слова в системе SYSTEM или undefined. */
export function getEntryLevel(entry) {
  const levels = entry.level
    .map((label) => label.split("-"))
    .filter(([system]) => system === SYSTEM)
    .map(([, number]) => Number(number));

  return levels.length > 0 ? Math.min(...levels) : undefined;
}

// ── Выбор чтения ─────────────────────────────────────────────────────────────
// У многих иероглифов несколько чтений, и первое не всегда основное:
// 呵 → «variant of 啊», 说 → shuì «to persuade» вместо shuō «to speak».
// Берём чтение с наибольшим числом обычных значений (не «вариант», не фамилия).

const SECONDARY_MEANING =
  /^(old |archaic |erroneous )?variant of|^surname\b|^used in\b|^see [^\s]|^abbr\. for/i;

function countUseful(form) {
  return form.meanings.filter((meaning) => !SECONDARY_MEANING.test(meaning))
    .length;
}

/**
 * Основное чтение для многозвучных иероглифов, где правило выше ошибается.
 * Дополняй по мере того, как замечаешь неверный пиньинь (или просто поправь слово в words.ts).
 */
const PREFERRED_READING = {
  长: "cháng",
  着: "zhe",
  重: "zhòng",
  啊: "a",
  为: "wèi",
  教: "jiāo",
  数: "shù",
};

export function pickForm(forms, hanzi) {
  const preferred = forms.find(
    (form) => form.transcriptions.pinyin === PREFERRED_READING[hanzi],
  );
  if (preferred) return preferred;

  return forms.reduce((best, form) =>
    countUseful(form) > countUseful(best) ? form : best,
  );
}

// ── Короткий английский перевод ─────────────────────────────────────────────

const MAX_TRANSLATION_LENGTH = 40;

/** Убирает пояснения в скобках и про чтение («also pr. [shuí]»). */
function stripNotes(text) {
  return text
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/\s*\b(also |Taiwan )?pr\. \[[^\]]*\]/g, "")
    .replace(/\.\.\./g, "…")
    .replace(/\s*:\s*/g, " — ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Короткий перевод: значения по одному, без пояснений в скобках, без повторов. */
export function makeTranslation(meanings) {
  const useful = meanings.filter((meaning) => !SECONDARY_MEANING.test(meaning));
  const source = useful.length > 0 ? useful : meanings;

  const pieces = [];

  for (const meaning of source) {
    for (const piece of meaning.split(/;\s*/)) {
      const clean = stripNotes(piece);
      if (clean && !pieces.includes(clean)) pieces.push(clean);
    }
  }

  // Если всё значение было пояснением в скобках («(completed action marker)»), берём его как есть
  if (pieces.length === 0) {
    return source[0]?.split(/;\s*/)[0].replace(/[()]/g, "") ?? "";
  }

  let text =
    pieces[0].length > MAX_TRANSLATION_LENGTH
      ? `${pieces[0].slice(0, MAX_TRANSLATION_LENGTH - 1).trimEnd()}…`
      : pieces[0];
  for (const piece of pieces.slice(1)) {
    if (text.length + piece.length + 2 > MAX_TRANSLATION_LENGTH) break;
    text += `; ${piece}`;
  }

  return text;
}

// ── Файл words.ts ────────────────────────────────────────────────────────────

export const WORDS_RELATIVE_PATH = "src/content/words/data/words.ts";

const J = JSON.stringify;

/** Одна строка файла words.ts. Порядок полей id → hanzi важен для tag-hsk и build-hanzi-data. */
export function formatWordLine(word) {
  const parts = [
    `id: ${J(word.id)}`,
    `hanzi: ${J(word.hanzi)}`,
    `pinyin: ${J(word.pinyin)}`,
    `ru: ${J(word.ru ?? "")}`,
    `en: ${J(word.en ?? "")}`,
  ];

  if (word.colloquial) {
    const c = word.colloquial;
    parts.push(
      `colloquial: { hanzi: ${J(c.hanzi)}, pinyin: ${J(c.pinyin)}, note: ${J(c.note)} }`,
    );
  }

  return `  { ${parts.join(", ")} },`;
}

/** Строковое поле внутри куска текста: name: "…" или name: '…'. */
export function readField(segment, name) {
  const match = segment.match(
    new RegExp(String.raw`\b${name}:\s*(["'])((?:\\.|(?!\1)[^\\])*)\1`),
  );
  if (!match) return undefined;
  return match[1] === '"' ? JSON.parse(`"${match[2]}"`) : match[2];
}

/**
 * Слова из исходника words.ts (или любого файла со словами): файл делится на куски
 * «от id до следующего id», поля берутся первые в куске — до colloquial.
 */
export function parseWords(source) {
  const ids = [...source.matchAll(/\bid:\s*(["'])([^"']+)\1/g)];

  return ids.map((match, index) => {
    const segment = source.slice(match.index, ids[index + 1]?.index ?? source.length);
    const colloquialMatch = segment.match(/\bcolloquial:\s*\{([^}]*)\}/);
    const main = colloquialMatch ? segment.slice(0, colloquialMatch.index) : segment;

    return {
      id: match[2],
      hanzi: readField(main, "hanzi") ?? "",
      pinyin: readField(main, "pinyin") ?? "",
      ru: readField(main, "ru"),
      en: readField(main, "en"),
      translation: readField(main, "translation"),
      colloquial: colloquialMatch
        ? {
            hanzi: readField(colloquialMatch[1], "hanzi") ?? "",
            pinyin: readField(colloquialMatch[1], "pinyin") ?? "",
            note: readField(colloquialMatch[1], "note") ?? "",
          }
        : undefined,
    };
  });
}
