// scripts/check-hsk-translations.mjs
//
// Сверяет русские переводы (src/i18n/locales/ru/hsk.json) со списком HSK-слов
// (src/content/words/generated/hskWords.ts) и показывает:
//   — сколько слов переведено;
//   — каких слов ещё нет в переводе (с английским рядом);
//   — лишние ключи (опечатка в id или слова уже нет в списке);
//   — повторяющиеся ключи (JSON молча оставляет только последний);
//   — пустые переводы.
//
// Запуск: node scripts/check-hsk-translations.mjs
// Результат также пишется в scripts/.cache/hsk-missing.txt (недостающие слова).

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const WORDS_PATH = join(root, "src/content/words/generated/hskWords.ts");
const RU_PATH = join(root, "src/i18n/locales/ru/hsk.json");
const REPORT_PATH = join(root, "scripts/.cache/hsk-missing.txt");

// 1. Слова из сгенерированного файла (в порядке файла: по уровню, потом по частоте)
const wordsSource = readFileSync(WORDS_PATH, "utf8");
const words = [];

for (const match of wordsSource.matchAll(
  /\{\s*id:\s*("(?:[^"\\]|\\.)*"),\s*hanzi:\s*("(?:[^"\\]|\\.)*"),\s*pinyin:\s*("(?:[^"\\]|\\.)*"),\s*translationEn:\s*("(?:[^"\\]|\\.)*")/g,
)) {
  words.push({
    id: JSON.parse(match[1]),
    hanzi: JSON.parse(match[2]),
    pinyin: JSON.parse(match[3]),
    en: JSON.parse(match[4]),
  });
}

const wordIds = new Set(words.map((word) => word.id));

// 2. Переводы. Сначала проверяем, что JSON вообще читается.
const ruSource = readFileSync(RU_PATH, "utf8");
let ru;

try {
  ru = JSON.parse(ruSource);
} catch (error) {
  console.error(`hsk.json не читается: ${error.message}`);
  console.error("Чаще всего это лишняя или пропущенная запятая рядом с указанным местом.");
  process.exit(1);
}

// 3. Повторы ключей ищем по исходному тексту: после JSON.parse их уже не видно
const keyCounts = new Map();
for (const match of ruSource.matchAll(/"((?:[^"\\]|\\.)*)"\s*:/g)) {
  const key = JSON.parse(`"${match[1]}"`);
  keyCounts.set(key, (keyCounts.get(key) ?? 0) + 1);
}
const duplicates = [...keyCounts].filter(([, count]) => count > 1);

// 4. Сверка
const missing = words.filter((word) => !(word.id in ru));
const extra = Object.keys(ru).filter((key) => !wordIds.has(key));
const empty = Object.entries(ru)
  .filter(([key, value]) => wordIds.has(key) && !String(value).trim())
  .map(([key]) => key);

const translated = words.length - missing.length;

console.log(`Слов в hskWords.ts: ${words.length}`);
console.log(`Ключей в hsk.json:  ${Object.keys(ru).length}`);
console.log(`Переведено:         ${translated} (${Math.round((translated / words.length) * 100)}%)`);
console.log(`Без перевода:       ${missing.length}`);

if (duplicates.length > 0) {
  console.log(`\nПовторяющиеся ключи (остался только последний перевод): ${duplicates.length}`);
  for (const [key, count] of duplicates) console.log(`  ${key} ×${count}`);
}

if (extra.length > 0) {
  console.log(`\nЛишние ключи (нет такого слова в списке — опечатка или слово ушло): ${extra.length}`);
  for (const key of extra) console.log(`  ${key}`);
}

if (empty.length > 0) {
  console.log(`\nПустые переводы: ${empty.length}`);
  for (const key of empty) console.log(`  ${key}`);
}

if (missing.length > 0) {
  const lines = missing.map(
    (word) => `${word.id}\t${word.pinyin}\t${word.en}`,
  );

  mkdirSync(dirname(REPORT_PATH), { recursive: true });
  writeFileSync(REPORT_PATH, `${lines.join("\n")}\n`);

  console.log(`\nПервые без перевода (полный список: scripts/.cache/hsk-missing.txt):`);
  for (const line of lines.slice(0, 20)) console.log(`  ${line}`);
  if (lines.length > 20) console.log(`  … и ещё ${lines.length - 20}`);
}

if (missing.length === 0 && extra.length === 0 && duplicates.length === 0 && empty.length === 0) {
  console.log("\nВсё сходится 🎉");
}
