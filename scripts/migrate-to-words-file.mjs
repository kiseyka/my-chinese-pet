// scripts/migrate-to-words-file.mjs
//
// ОДНОРАЗОВЫЙ переход: все слова и их переводы — в одном файле
// src/content/words/data/words.ts.
//
// Что делает:
//   1. Берёт слова HSK из src/content/words/generated/hskWords.ts (их id не меняются,
//      прогресс по ним сохраняется) и твои русские переводы из ru/hsk.json (или ru/words.json).
//   2. Берёт твои слова из остальных файлов src/content/words/data/*.ts:
//      — если слово есть в списке HSK, оно получает id «hsk-<иероглифы>», пиньинь
//        и английский из словаря;
//      — если нет, id «word-<иероглифы>», пиньинь твой, английский пустой.
//      Разговорный вариант (colloquial) переносится. Старые переводы не переносятся.
//      Прогресс твоих слов начнётся заново (id меняются).
//   3. Записывает всё в words.ts: по уровню HSK, внутри — от частых к редким,
//      слова без уровня в конце.
//   4. Меняет id слов в наборах карточек (src/content/sets/definitions.ts).
//   5. Убирает старые переводы твоих слов из JSON в src/i18n/locales.
//   6. Удаляет старые файлы: data/*.ts (кроме words.ts), generated/hskWords.ts,
//      ru/hsk.json, ru/words.json, en/words.json.
//
// Перед запуском сделай коммит в git. Запуск: node scripts/migrate-to-words-file.mjs
// После: node scripts/tag-hsk.mjs (уровни и частота считаются по id — у твоих слов id новые).

import {
  existsSync,
  readFileSync,
  readdirSync,
  rmdirSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import {
  ID_PREFIX,
  WORDS_RELATIVE_PATH,
  formatWordLine,
  getEntryLevel,
  loadHskList,
  makeTranslation,
  parseWords,
  pickForm,
  readField,
} from "./lib/hskList.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const DATA_DIR = join(root, "src/content/words/data");
const WORDS_PATH = join(root, WORDS_RELATIVE_PATH);
const GENERATED_PATH = join(root, "src/content/words/generated/hskWords.ts");
const DEFINITIONS_PATH = join(root, "src/content/sets/definitions.ts");
const LOCALES_DIR = join(root, "src/i18n/locales");
const RU_HSK_PATH = join(LOCALES_DIR, "ru/hsk.json");
const RU_WORDS_PATH = join(LOCALES_DIR, "ru/words.json");
const EN_WORDS_PATH = join(LOCALES_DIR, "en/words.json");

/** Префикс id твоих слов, которых нет в списке HSK. */
const OWN_PREFIX = "word-";

if (existsSync(WORDS_PATH)) {
  console.error(`${WORDS_RELATIVE_PATH} уже есть — переход уже сделан.`);
  process.exit(1);
}

const readJson = (path) =>
  existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : {};

// ── 1. Словарь HSK ───────────────────────────────────────────────────────────

const list = await loadHskList(root);

/** Иероглифы → статья списка (если статей несколько, берём ту, у которой есть уровень). */
const byHanzi = new Map();
for (const entry of list) {
  const known = byHanzi.get(entry.simplified);
  if (!known || (getEntryLevel(known) === undefined && getEntryLevel(entry) !== undefined)) {
    byHanzi.set(entry.simplified, entry);
  }
}

function dictionaryInfo(hanzi) {
  const entry = byHanzi.get(hanzi);
  if (!entry) return null;

  const form = pickForm(entry.forms, hanzi);
  return {
    pinyin: form.transcriptions.pinyin,
    en: makeTranslation(form.meanings),
    level: getEntryLevel(entry),
    frequency: entry.frequency,
  };
}

// ── 2. Русские переводы HSK-слов ────────────────────────────────────────────

const ruById = { ...readJson(RU_WORDS_PATH), ...readJson(RU_HSK_PATH) };

// ── 3. Слова ─────────────────────────────────────────────────────────────────

/** Иероглифы → слово для words.ts. */
const words = new Map();
/** Старый id → новый id (для наборов). */
const idMap = new Map();

// 3а. Сгенерированные слова HSK: id остаются
let generatedCount = 0;

if (existsSync(GENERATED_PATH)) {
  const source = readFileSync(GENERATED_PATH, "utf8");
  const ids = [...source.matchAll(/\bid:\s*(["'])([^"']+)\1/g)];

  ids.forEach((match, index) => {
    const segment = source.slice(match.index, ids[index + 1]?.index ?? source.length);
    const id = match[2];
    const hanzi = readField(segment, "hanzi") ?? "";
    const info = dictionaryInfo(hanzi);

    words.set(hanzi, {
      id,
      hanzi,
      pinyin: readField(segment, "pinyin") ?? info?.pinyin ?? "",
      en: readField(segment, "translationEn") ?? info?.en ?? "",
      ru: ruById[id] ?? "",
      level: info?.level,
      frequency: info?.frequency,
    });
    idMap.set(id, id);
    generatedCount++;
  });
}

// 3б. Твои слова
const ownFiles = readdirSync(DATA_DIR).filter(
  (name) => name.endsWith(".ts") && join(DATA_DIR, name) !== WORDS_PATH,
);

const ownWords = [];
for (const file of ownFiles) {
  ownWords.push(...parseWords(readFileSync(join(DATA_DIR, file), "utf8")));
}

const ownToHsk = [];
const ownNotInHsk = [];
let ownDuplicates = 0;

for (const own of ownWords) {
  const existing = words.get(own.hanzi);

  if (existing) {
    idMap.set(own.id, existing.id);
    if (!existing.colloquial && own.colloquial) existing.colloquial = own.colloquial;
    ownDuplicates++;
    continue;
  }

  const info = dictionaryInfo(own.hanzi);
  const id = `${info ? ID_PREFIX : OWN_PREFIX}${own.hanzi}`;

  words.set(own.hanzi, {
    id,
    hanzi: own.hanzi,
    pinyin: info?.pinyin ?? own.pinyin,
    en: info?.en ?? "",
    ru: ruById[id] ?? "",
    colloquial: own.colloquial,
    level: info?.level,
    frequency: info?.frequency,
  });
  idMap.set(own.id, id);

  if (info) ownToHsk.push(own.hanzi);
  else ownNotInHsk.push(own.hanzi);
}

// ── 4. words.ts ──────────────────────────────────────────────────────────────

const sorted = [...words.values()].sort(
  (a, b) =>
    (a.level ?? Infinity) - (b.level ?? Infinity) ||
    (a.frequency ?? Infinity) - (b.frequency ?? Infinity),
);

writeFileSync(
  WORDS_PATH,
  `// ${WORDS_RELATIVE_PATH}
//
// ВСЕ СЛОВА ПРИЛОЖЕНИЯ. Это обычный файл: добавляй слова и правь переводы прямо здесь.
//   id         — ключ прогресса слова. После создания НЕ МЕНЯТЬ, иначе прогресс потеряется.
//   ru, en     — переводы. Пустой ru — показывается английский.
//   colloquial — разговорный вариант (note — ключ i18n пояснения).
// Новые слова HSK дописывает в конец scripts/build-hsk-words.mjs, существующие строки не трогает.
// Пиньинь и английский HSK-слов: Complete HSK Vocabulary (MIT),
// https://github.com/drkameleon/complete-hsk-vocabulary

import type { WordEntry } from "../types";

export const words: WordEntry[] = [
${sorted.map(formatWordLine).join("\n")}
];
`,
);

// ── 5. Наборы карточек ───────────────────────────────────────────────────────

let setReplacements = 0;
const unknownSetIds = [];

if (existsSync(DEFINITIONS_PATH)) {
  const source = readFileSync(DEFINITIONS_PATH, "utf8");

  // Меняем только строки внутри массивов wordIds
  const updated = source.replace(
    /(["']?wordIds["']?\s*:\s*\[)([^\]]*)(\])/g,
    (_, open, body, close) => {
      const newBody = body.replace(/(["'])([^"']+)\1/g, (full, quote, id) => {
        const newId = idMap.get(id);
        if (!newId) {
          unknownSetIds.push(id);
          return full;
        }
        if (newId !== id) setReplacements++;
        return `${quote}${newId}${quote}`;
      });
      return `${open}${newBody}${close}`;
    },
  );

  writeFileSync(DEFINITIONS_PATH, updated);
}

// ── 6. Старые переводы твоих слов в JSON ────────────────────────────────────

const SKIP_JSON = new Set(["words.json", "hsk.json"]);

function collectJson(dir, out) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) collectJson(path, out);
    else if (name.endsWith(".json") && !SKIP_JSON.has(name)) out.push(path);
  }
  return out;
}

function loadLanguage(lang) {
  const files = [];
  const flat = join(LOCALES_DIR, `${lang}.json`);
  if (existsSync(flat)) files.push(flat);
  collectJson(join(LOCALES_DIR, lang), files);
  return files.map((path) => ({
    path,
    data: JSON.parse(readFileSync(path, "utf8")),
    changed: false,
  }));
}

/** Строка по ключу: плоский ключ "a.b" или вложенный путь a → b. */
function findValue(sources, rawKey) {
  const key = rawKey.includes(":") ? rawKey.split(":").slice(1).join(":") : rawKey;

  for (const source of sources) {
    if (typeof source.data[key] === "string") return { source, key, flat: true };

    let node = source.data;
    for (const part of key.split(".")) {
      if (node && typeof node === "object" && part in node) node = node[part];
      else {
        node = undefined;
        break;
      }
    }
    if (typeof node === "string") return { source, key, flat: false };
  }
  return null;
}

function removeValue({ source, key, flat }) {
  if (flat) {
    if (!(key in source.data)) return;
    delete source.data[key];
  } else {
    const parts = key.split(".");
    const chain = [];
    let node = source.data;
    for (const part of parts.slice(0, -1)) {
      if (!node || typeof node !== "object" || !(part in node)) return;
      chain.push([node, part]);
      node = node[part];
    }
    if (!node || !(parts[parts.length - 1] in node)) return;
    delete node[parts[parts.length - 1]];

    for (let i = chain.length - 1; i >= 0; i--) {
      const [parent, part] = chain[i];
      if (Object.keys(parent[part]).length === 0) delete parent[part];
      else break;
    }
  }
  source.changed = true;
}

const localeSources = [...loadLanguage("ru"), ...loadLanguage("en")];
let removedKeys = 0;

for (const own of ownWords) {
  if (!own.translation) continue;

  // Ключ лежит в нескольких файлах (ru и en) — убираем из каждого
  for (const source of localeSources) {
    const found = findValue([source], own.translation);
    if (found) {
      removeValue(found);
      removedKeys++;
    }
  }
}

const cleanedFiles = [];
for (const source of localeSources) {
  if (!source.changed) continue;
  writeFileSync(source.path, `${JSON.stringify(source.data, null, 2)}\n`);
  cleanedFiles.push(relative(root, source.path));
}

// ── 7. Удаляем старые файлы ──────────────────────────────────────────────────

const deleted = [];
const remove = (path) => {
  if (existsSync(path)) {
    unlinkSync(path);
    deleted.push(relative(root, path));
  }
};

for (const file of ownFiles) remove(join(DATA_DIR, file));
remove(GENERATED_PATH);
remove(RU_HSK_PATH);
remove(RU_WORDS_PATH);
remove(EN_WORDS_PATH);

const generatedDir = dirname(GENERATED_PATH);
if (existsSync(generatedDir) && readdirSync(generatedDir).length === 0) {
  rmdirSync(generatedDir);
}

// ── Отчёт ────────────────────────────────────────────────────────────────────

const levelCounts = {};
for (const word of sorted) {
  const key = word.level ?? "без уровня";
  levelCounts[key] = (levelCounts[key] ?? 0) + 1;
}

console.log(`Записано слов: ${sorted.length} → ${WORDS_RELATIVE_PATH}`);
console.log("По уровням:", JSON.stringify(levelCounts));
console.log(`Из hskWords.ts: ${generatedCount} (id прежние)`);
console.log(`Твоих слов: ${ownWords.length}`);
console.log(`  нашлись в HSK (id «hsk-…», английский из словаря): ${ownToHsk.length}`);
console.log(`  дубли по иероглифам (слиты в одно слово): ${ownDuplicates}`);
console.log(
  `  нет в HSK (id «word-…», английский пустой): ${ownNotInHsk.length}${
    ownNotInHsk.length ? ` — ${ownNotInHsk.join(" ")}` : ""
  }`,
);
console.log(`С русским переводом: ${sorted.filter((w) => w.ru).length} из ${sorted.length}`);
console.log(`\nНаборы карточек: заменено id — ${setReplacements}`);
if (unknownSetIds.length > 0) {
  console.warn(`  В наборах есть id, которых не было среди слов: ${unknownSetIds.join(", ")}`);
}
console.log(`Старых ключей перевода убрано из JSON: ${removedKeys}`);
for (const path of cleanedFiles) console.log(`  ${path}`);
console.log("\nУдалены файлы:");
for (const path of deleted) console.log(`  ${path}`);

console.log("\nДальше:");
console.log("  1. замени файлы приложения (types.ts, words/index.ts, sets.ts, i18n/index.ts, writingLessons.ts)");
console.log("  2. node scripts/tag-hsk.mjs");
console.log("  3. node scripts/check-hsk-translations.mjs — список слов без русского");
console.log("  4. npx expo start --clear");
