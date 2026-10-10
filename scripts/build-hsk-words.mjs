// scripts/build-hsk-words.mjs
//
// Добавляет в базу слов все слова HSK (HSK 3.0, уровни 1–MAX_LEVEL) и записывает
// src/content/words/generated/hskWords.ts.
//
// Твои слова из src/content/words/data главнее: если слово с такими же иероглифами там уже
// есть, сюда оно не попадает (у твоих слов русский перевод, свой id и прогресс).
// У добавленных слов перевод английский (поле translationEn), русский можно добавить потом.
//
// Источник: Complete HSK Vocabulary (MIT), https://github.com/drkameleon/complete-hsk-vocabulary
// Тот же файл, что использует tag-hsk.mjs (scripts/.cache/complete.json), скачивается при первом запуске.
//
// Подготовка: npm i -D hanzi-writer-data (уже установлен для build-hanzi-data.mjs)
//
// Запуск:                        node scripts/build-hsk-words.mjs
// Другой максимальный уровень:   node scripts/build-hsk-words.mjs 6
//   (по умолчанию 4: около 1950 слов и 2.7 МБ данных черт; 6 — около 5200 слов и 5 МБ;
//   7 означает «HSK 7–9», это ещё почти 5000 слов)
//
// После запуска выполни по порядку:
//   node scripts/build-hanzi-data.mjs
//   node scripts/tag-hsk.mjs

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const MAX_LEVEL = Number(process.argv[2] ?? 4);
if (!Number.isInteger(MAX_LEVEL) || MAX_LEVEL < 1 || MAX_LEVEL > 7) {
  console.error("Уровень должен быть числом от 1 до 7");
  process.exit(1);
}

const SYSTEM = "newest";
const URL_COMPLETE =
  "https://raw.githubusercontent.com/drkameleon/complete-hsk-vocabulary/main/complete.json";
const CACHE_PATH = join(root, "scripts/.cache/complete.json");
const OWN_WORDS_DIR = join(root, "src/content/words/data");
const STROKES_DIR = join(root, "node_modules/hanzi-writer-data");
const OUTPUT_PATH = join(root, "src/content/words/generated/hskWords.ts");

/** Префикс id добавленных слов: не пересекается с id твоих слов. */
const ID_PREFIX = "hsk-";

/** Перевод собираем из коротких значений, пока не превысим эту длину. */
const MAX_TRANSLATION_LENGTH = 40;

// 1. Список HSK (скачиваем один раз, общий кэш с tag-hsk.mjs)
if (!existsSync(CACHE_PATH)) {
  console.log("Скачиваю список HSK (около 10 МБ)...");
  const response = await fetch(URL_COMPLETE);

  if (!response.ok) {
    console.error(`Не удалось скачать список: ${response.status}`);
    process.exit(1);
  }

  mkdirSync(dirname(CACHE_PATH), { recursive: true });
  writeFileSync(CACHE_PATH, Buffer.from(await response.arrayBuffer()));
}

const list = JSON.parse(readFileSync(CACHE_PATH, "utf8"));

// 2. Иероглифы твоих слов: такие слова не дублируем
const ownHanzi = new Set();

for (const file of readdirSync(OWN_WORDS_DIR).filter((name) =>
  name.endsWith(".ts"),
)) {
  const source = readFileSync(join(OWN_WORDS_DIR, file), "utf8");

  for (const match of source.matchAll(/hanzi:\s*["']([^"']+)["']/g)) {
    ownHanzi.add(match[1]);
  }
}

// 3. Выбор чтения. У многих иероглифов несколько чтений, и первое не всегда основное:
//    呵 → «variant of 啊», 说 → shuì «to persuade» вместо shuō «to speak».
//    Берём чтение с наибольшим числом обычных значений (не «вариант», не фамилия).
const SECONDARY_MEANING =
  /^(old |archaic |erroneous )?variant of|^surname\b|^used in\b|^see [^\s]|^abbr\. for/i;

function countUseful(form) {
  return form.meanings.filter((meaning) => !SECONDARY_MEANING.test(meaning))
    .length;
}

/**
 * Основное чтение для многозвучных иероглифов, где правило выше ошибается.
 * Дополняй по мере того, как замечаешь неверный пиньинь (или добавь слово в свои слова —
 * они всегда главнее).
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

function pickForm(forms, hanzi) {
  const preferred = forms.find(
    (form) => form.transcriptions.pinyin === PREFERRED_READING[hanzi],
  );
  if (preferred) return preferred;

  return forms.reduce((best, form) =>
    countUseful(form) > countUseful(best) ? form : best,
  );
}

/**
 * Убирает пояснения: в скобках («to be (followed by substantives only)» → «to be»)
 * и про чтение («also pr. [shuí]»). Двоеточие заменяет на тире: перевод может пройти
 * через i18next, а там двоеточие отделяет пространство имён.
 */
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
function makeTranslation(meanings) {
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

// 4. Слова
const words = [];
const skippedOwn = [];
const skippedNoStrokes = [];

for (const entry of list) {
  const levels = entry.level
    .map((label) => label.split("-"))
    .filter(([system]) => system === SYSTEM)
    .map(([, number]) => Number(number));

  if (levels.length === 0) continue;

  const level = Math.min(...levels);
  if (level > MAX_LEVEL) continue;

  const hanzi = entry.simplified;
  const characters = Array.from(hanzi);

  if (!characters.every((char) => /\p{Script=Han}/u.test(char))) continue;

  if (ownHanzi.has(hanzi)) {
    skippedOwn.push(hanzi);
    continue;
  }

  if (
    !characters.every((char) => existsSync(join(STROKES_DIR, `${char}.json`)))
  ) {
    skippedNoStrokes.push(hanzi);
    continue;
  }

  const form = pickForm(entry.forms, hanzi);

  words.push({
    id: `${ID_PREFIX}${hanzi}`,
    hanzi,
    pinyin: form.transcriptions.pinyin,
    translationEn: makeTranslation(form.meanings),
    frequency: entry.frequency,
    level,
  });
}

// По уровню, внутри уровня — от частых к редким
words.sort((a, b) => a.level - b.level || a.frequency - b.frequency);

// 5. Файл для приложения. Порядок полей id → hanzi важен: по нему слова находят
//    build-hanzi-data.mjs и tag-hsk.mjs.
const body = words
  .map(
    ({ id, hanzi, pinyin, translationEn, frequency }) =>
      `  { id: ${JSON.stringify(id)}, hanzi: ${JSON.stringify(hanzi)}, pinyin: ${JSON.stringify(pinyin)}, translationEn: ${JSON.stringify(translationEn)}, frequency: ${frequency} },`,
  )
  .join("\n");

mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
writeFileSync(
  OUTPUT_PATH,
  `// src/content/words/generated/hskWords.ts
//
// ФАЙЛ СОЗДАЁТСЯ СКРИПТОМ scripts/build-hsk-words.mjs (HSK 3.0, уровни 1–${MAX_LEVEL}) — не редактируй вручную.
// Слова HSK, которых нет среди твоих слов в src/content/words/data. Перевод английский.
// Уровень HSK берётся из hsk.ts (его пишет tag-hsk.mjs), как у остальных слов.
// Источник: Complete HSK Vocabulary (MIT), https://github.com/drkameleon/complete-hsk-vocabulary

export type GeneratedWord = {
  id: string;
  hanzi: string;
  pinyin: string;
  /** Английский перевод (одно-два значения из CC-CEDICT). */
  translationEn: string;
  /** Место в частотном списке: чем меньше, тем употребительнее слово. */
  frequency: number;
};

export const hskWords: GeneratedWord[] = [
${body}
];
`,
);

// 6. Отчёт
const counts = {};
for (const word of words) counts[word.level] = (counts[word.level] ?? 0) + 1;

console.log(`Добавлено слов: ${words.length} → ${OUTPUT_PATH}`);
console.log("По уровням:", JSON.stringify(counts));
console.log(`Уже есть среди твоих слов: ${skippedOwn.length}`);
if (skippedNoStrokes.length > 0) {
  console.warn(`Нет данных черт, пропущено: ${skippedNoStrokes.join(" ")}`);
}
console.log(
  "\nДальше: node scripts/build-hanzi-data.mjs, затем node scripts/tag-hsk.mjs",
);
