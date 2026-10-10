// scripts/tag-hsk.mjs
//
// Проставляет слова из базы (твои и сгенерированные слова HSK) по уровням HSK и частоте
// и записывает src/content/words/hsk.ts.
//
// Источник: открытый список Complete HSK Vocabulary (MIT),
// https://github.com/drkameleon/complete-hsk-vocabulary — файл complete.json скачивается
// при первом запуске и кладётся в scripts/.cache (добавь эту папку в .gitignore).
//
// Как определяется уровень слова:
//   1. слово есть в списке HSK → его уровень (если в списке несколько, берётся наименьший);
//   2. слова нет (например, фраза «早上好»), но каждый его иероглиф есть в списке → наибольший
//      из уровней иероглифов;
//   3. иначе уровня нет (такие слова попадут в раздел «Другие слова»).
//
// Частота (место в частотном списке, чем меньше, тем употребительнее) определяется так же:
// у слова из списка — его частота, у остальных — частота самого редкого из иероглифов.
// По частоте слова раскладываются по ступеням в режиме «Написание».
//
// Запуск:                 node scripts/tag-hsk.mjs
// Другой список (HSK 2.0): node scripts/tag-hsk.mjs old
//   newest — актуальный HSK 3.0 (уровень 7 означает «7–9»), old — HSK 2.0 (уровни 1–6).

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

const SYSTEM = process.argv[2] ?? "newest";
if (!["newest", "new", "old"].includes(SYSTEM)) {
  console.error(
    "Допустимые значения: newest (HSK 3.0), new (черновик HSK 3.0), old (HSK 2.0)",
  );
  process.exit(1);
}

const URL_COMPLETE =
  "https://raw.githubusercontent.com/drkameleon/complete-hsk-vocabulary/main/complete.json";
const CACHE_PATH = join(root, "scripts/.cache/complete.json");
// Папки со словами: твои слова и слова HSK из build-hsk-words.mjs (её может не быть)
const WORD_DIRS = [
  join(root, "src/content/words/data"),
  join(root, "src/content/words/generated"),
];
const OUTPUT_PATH = join(root, "src/content/words/hsk.ts");

// 1. Список HSK (скачиваем один раз)
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

/** Слово → наименьший уровень выбранной системы. */
const levels = new Map();

/** Слово → место в частотном списке (не зависит от системы HSK). */
const frequencies = new Map();

for (const entry of list) {
  if (typeof entry.frequency === "number") {
    frequencies.set(entry.simplified, entry.frequency);
  }

  for (const label of entry.level) {
    const [system, number] = label.split("-");
    if (system !== SYSTEM) continue;

    const level = Number(number);
    const known = levels.get(entry.simplified);
    if (known === undefined || level < known) {
      levels.set(entry.simplified, level);
    }
  }
}

// 2. Слова из базы: id и иероглифы
const words = [];

for (const dir of WORD_DIRS.filter((path) => existsSync(path))) {
  for (const file of readdirSync(dir).filter((name) => name.endsWith(".ts"))) {
    const source = readFileSync(join(dir, file), "utf8");

    for (const match of source.matchAll(
      /id:\s*"([^"]+)",\s*hanzi:\s*"([^"]+)"/g,
    )) {
      words.push({ id: match[1], hanzi: match[2] });
    }
  }
}

// 3. Уровни и частота
const result = {};
const frequencyResult = {};
const exact = [];
const fromCharacters = [];
const missing = [];

for (const { id, hanzi } of words) {
  const directFrequency = frequencies.get(hanzi);
  const characterFrequencies = Array.from(hanzi).map((character) =>
    frequencies.get(character),
  );

  if (directFrequency !== undefined) {
    frequencyResult[id] = directFrequency;
  } else if (characterFrequencies.every((value) => value !== undefined)) {
    frequencyResult[id] = Math.max(...characterFrequencies);
  }

  const direct = levels.get(hanzi);

  if (direct !== undefined) {
    result[id] = direct;
    exact.push(hanzi);
    continue;
  }

  const characterLevels = Array.from(hanzi).map((character) =>
    levels.get(character),
  );

  if (characterLevels.every((level) => level !== undefined)) {
    result[id] = Math.max(...characterLevels);
    fromCharacters.push(`${hanzi} (${result[id]})`);
  } else {
    missing.push(hanzi);
  }
}

// 4. Файл для приложения
const body = Object.entries(result)
  .map(([id, level]) => `  ${JSON.stringify(id)}: ${level},`)
  .join("\n");

const frequencyBody = Object.entries(frequencyResult)
  .map(([id, value]) => `  ${JSON.stringify(id)}: ${value},`)
  .join("\n");

writeFileSync(
  OUTPUT_PATH,
  `// src/content/words/hsk.ts
//
// ФАЙЛ СОЗДАЁТСЯ СКРИПТОМ scripts/tag-hsk.mjs (система: ${SYSTEM}) — не редактируй вручную.
// Уровень HSK и частота слов из базы по id. Слова без уровня относятся к разделу «Другие слова».
// Источник списка: Complete HSK Vocabulary (MIT), https://github.com/drkameleon/complete-hsk-vocabulary

export const wordHsk: Record<string, number> = {
${body}
};

export function getWordHsk(id: string): number | undefined {
  return wordHsk[id];
}

/** Место слова в частотном списке: чем меньше, тем употребительнее. */
export const wordFrequency: Record<string, number> = {
${frequencyBody}
};

export function getWordFrequency(id: string): number | undefined {
  return wordFrequency[id];
}
`,
);

// 5. Отчёт
const counts = {};
for (const level of Object.values(result))
  counts[level] = (counts[level] ?? 0) + 1;

console.log(`Система: ${SYSTEM}. Слов в базе: ${words.length}`);
console.log(`Есть в списке HSK: ${exact.length}`);
console.log(`Уровень по иероглифам: ${fromCharacters.length}`);
console.log(`Без уровня: ${missing.length}`);
console.log("По уровням:", JSON.stringify(counts));
if (fromCharacters.length > 0)
  console.log("\nПо иероглифам:", fromCharacters.join(", "));
if (missing.length > 0) console.log("\nБез уровня:", missing.join(", "));
