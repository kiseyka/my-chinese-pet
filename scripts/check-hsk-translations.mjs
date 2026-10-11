// scripts/check-hsk-translations.mjs
//
// Проверяет src/content/words/data/words.ts:
//   — сколько слов уже с русским переводом;
//   — какие слова ещё без русского (с пиньинем и английским рядом);
//   — слова без английского;
//   — повторы id и повторы иероглифов.
//
// Запуск: node scripts/check-hsk-translations.mjs
// Слова без русского также пишутся в scripts/.cache/hsk-missing.txt.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { WORDS_RELATIVE_PATH, parseWords } from "./lib/hskList.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const WORDS_PATH = join(root, WORDS_RELATIVE_PATH);
const REPORT_PATH = join(root, "scripts/.cache/hsk-missing.txt");

const words = parseWords(readFileSync(WORDS_PATH, "utf8"));

const countBy = (key) => {
  const counts = new Map();
  for (const word of words) counts.set(word[key], (counts.get(word[key]) ?? 0) + 1);
  return [...counts].filter(([, count]) => count > 1);
};

const duplicateIds = countBy("id");
const duplicateHanzi = countBy("hanzi");
const missingRu = words.filter((word) => !word.ru?.trim());
const missingEn = words.filter((word) => !word.en?.trim());

const translated = words.length - missingRu.length;

console.log(`Слов в words.ts:  ${words.length}`);
console.log(`С русским:        ${translated} (${Math.round((translated / words.length) * 100)}%)`);
console.log(`Без русского:     ${missingRu.length}`);

if (duplicateIds.length > 0) {
  console.log(`\nПовторяющиеся id (прогресс у них общий — так быть не должно): ${duplicateIds.length}`);
  for (const [id, count] of duplicateIds) console.log(`  ${id} ×${count}`);
}

if (duplicateHanzi.length > 0) {
  console.log(`\nОдинаковые иероглифы у разных слов: ${duplicateHanzi.length}`);
  for (const [hanzi, count] of duplicateHanzi) console.log(`  ${hanzi} ×${count}`);
}

if (missingEn.length > 0) {
  console.log(`\nБез английского (необязательно): ${missingEn.length}`);
  console.log(`  ${missingEn.map((word) => word.hanzi).join(" ")}`);
}

if (missingRu.length > 0) {
  const lines = missingRu.map(
    (word) => `${word.hanzi}\t${word.pinyin}\t${word.en ?? ""}`,
  );

  mkdirSync(dirname(REPORT_PATH), { recursive: true });
  writeFileSync(REPORT_PATH, `${lines.join("\n")}\n`);

  console.log(`\nПервые без русского (полный список: scripts/.cache/hsk-missing.txt):`);
  for (const line of lines.slice(0, 20)) console.log(`  ${line}`);
  if (lines.length > 20) console.log(`  … и ещё ${lines.length - 20}`);
}

if (missingRu.length === 0 && duplicateIds.length === 0 && duplicateHanzi.length === 0) {
  console.log("\nВсё сходится 🎉");
}
