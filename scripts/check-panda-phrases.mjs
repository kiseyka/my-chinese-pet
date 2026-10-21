// scripts/check-panda-phrases.mjs
//
// Проверяет фразы панды (src/content/panda/thoughtPhrases.ts):
//   - повторяющиеся id;
//   - слова фразы, которых нет в словаре (src/content/words/data/words.ts) — с такими
//     словами фраза никогда не покажется: панда ждёт точку у каждого слова;
//   - пустой перевод.
// Печатает каждую фразу с пиньинем из словаря — удобно сверить тоны.
//
// Запуск: node scripts/check-panda-phrases.mjs

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(join(root, path), "utf8");

const HAN = /\p{Script=Han}/u;

const wordsSource = read("src/content/words/data/words.ts");
const pinyinByHanzi = new Map();
for (const m of wordsSource.matchAll(/hanzi: "([^"]+)",\s*pinyin: "([^"]*)"/g)) {
  if (!pinyinByHanzi.has(m[1])) pinyinByHanzi.set(m[1], m[2]);
}

const source = read("src/content/panda/thoughtPhrases.ts");
const phrases = [
  ...source.matchAll(
    /id: "([^"]+)",\s*words: \[([^\]]*)\],\s*ru: "([^"]*)",\s*en: "([^"]*)",?(?:\s*pinyin: \{([^}]*)\})?/g,
  ),
].map((m) => ({
  id: m[1],
  words: [...m[2].matchAll(/"([^"]*)"/g)].map((w) => w[1]),
  ru: m[3],
  en: m[4],
  pinyin: new Map(
    [...(m[5] ?? "").matchAll(/"?([^"\s:,]+)"?\s*:\s*"([^"]*)"/g)].map((p) => [p[1], p[2]]),
  ),
}));

let problems = 0;
const seen = new Set();

for (const phrase of phrases) {
  const issues = [];
  if (seen.has(phrase.id)) issues.push("повторяется id");
  seen.add(phrase.id);

  const missing = phrase.words.filter((w) => HAN.test(w) && !pinyinByHanzi.has(w));
  if (missing.length) issues.push(`нет в словаре: ${missing.join(" ")}`);
  if (!phrase.ru) issues.push("нет русского перевода");

  const pinyin = phrase.words
    .map((w) => (HAN.test(w) ? (phrase.pinyin.get(w) ?? pinyinByHanzi.get(w) ?? "?") : w))
    .join(" ");

  console.log(`${issues.length ? "✗" : "✓"} ${phrase.id}: ${phrase.words.join("")}  ${pinyin}`);
  for (const issue of issues) console.log(`    ${issue}`);
  problems += issues.length;
}

console.log(`\nФраз: ${phrases.length}, проблем: ${problems}`);
process.exit(problems > 0 ? 1 : 0);
