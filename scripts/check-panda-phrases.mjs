// scripts/check-panda-phrases.mjs
//
// Проверяет фразы панды (src/content/panda/thoughtPhrases.ts):
//   - повторяющиеся id фраз и ответов;
//   - слова фразы, которых нет в словаре (src/content/words/data/words.ts) — с такими
//     словами фраза никогда не покажется: панда ждёт точку у каждого слова;
//   - слова ответов и реакций, которых нет в словаре (фраза покажется, но тап по слову
//     ничего не переведёт);
//   - склейку: words должны быть разбиты по словам, а не по одному иероглифу без нужды;
//   - requires, который ссылается на несуществующий вопрос или ответ;
//   - пустой перевод;
//   - when: неизвестное время суток или года;
//   - выражения из иероглифов в пояснении (note), которым нечего показать по тапу:
//     нет ни в note.terms, ни среди строк фразы, ни в словаре.
// Печатает каждую фразу с пиньинем — удобно сверить тоны.
//
// Запуск: node --no-warnings --experimental-strip-types scripts/check-panda-phrases.mjs
// (на Node 22.18+ флаг --experimental-strip-types можно не писать)

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const HAN = /\p{Script=Han}/u;

const wordsSource = readFileSync(join(root, "src/content/words/data/words.ts"), "utf8");
const pinyinByHanzi = new Map();
for (const m of wordsSource.matchAll(/hanzi: "([^"]+)",\s*pinyin: "([^"]*)"/g)) {
  if (!pinyinByHanzi.has(m[1])) pinyinByHanzi.set(m[1], m[2]);
}

// Глоссарий панды (имя, кактус — src/content/panda/glossary.ts): не из словаря,
// но во фразах разрешён
const { PANDA_GLOSSARY } = await import(
  pathToFileURL(join(root, "src/content/panda/glossary.ts")).href
);
for (const [hanzi, entry] of Object.entries(PANDA_GLOSSARY)) {
  pinyinByHanzi.set(hanzi, entry.pinyin);
}

const { pandaPhrases: dailyPhrases, roomPhrases } = await import(
  pathToFileURL(join(root, "src/content/panda/thoughtPhrases.ts")).href
);

const lineIssues = (line, label) => {
  const issues = [];
  const missing = line.words.filter((w) => HAN.test(w) && !pinyinByHanzi.has(w));
  if (missing.length) issues.push(`${label}: нет в словаре: ${missing.join(" ")}`);
  if (!line.ru) issues.push(`${label}: нет русского перевода`);
  return issues;
};

const pinyinOf = (line) =>
  line.words
    .map((w) =>
      HAN.test(w) ? (line.pinyin?.[w] ?? pinyinByHanzi.get(w) ?? "?") : w,
    )
    .join(" ");

// Фразы дня и фразы о комнате проверяются вместе (id не должны совпадать)
const pandaPhrases = [...dailyPhrases, ...roomPhrases];
const byId = new Map(pandaPhrases.map((p) => [p.id, p]));
let problems = 0;
const seen = new Set();

for (const phrase of pandaPhrases) {
  const issues = lineIssues(phrase, "фраза");
  if (seen.has(phrase.id)) issues.push("повторяется id");
  seen.add(phrase.id);

  if (phrase.requires) {
    const question = byId.get(phrase.requires.phraseId);
    if (!question) issues.push(`requires: нет фразы ${phrase.requires.phraseId}`);
    else if (!question.replies?.some((r) => r.id === phrase.requires.replyId)) {
      issues.push(`requires: у ${question.id} нет ответа ${phrase.requires.replyId}`);
    }
  }

  const replyIds = new Set();
  for (const reply of phrase.replies ?? []) {
    if (replyIds.has(reply.id)) issues.push(`ответ ${reply.id}: повторяется id`);
    replyIds.add(reply.id);
    issues.push(...lineIssues(reply, `ответ ${reply.id}`));
    if (reply.reaction) {
      issues.push(...lineIssues(reply.reaction, `реакция на ${reply.id}`));
    }
  }

  const TIMES = ["morning", "day", "evening", "night"];
  const SEASONS = ["winter", "spring", "summer", "autumn"];
  for (const t of phrase.when?.time ?? []) {
    if (!TIMES.includes(t)) issues.push(`when.time: нет такого времени суток «${t}»`);
  }
  for (const t of phrase.when?.season ?? []) {
    if (!SEASONS.includes(t)) issues.push(`when.season: нет такого времени года «${t}»`);
  }

  if (phrase.note) {
    const hanOnly = (line) => line.words.join("").replace(/[^\p{Script=Han}]/gu, "");
    const lines = [phrase];
    for (const reply of phrase.replies ?? []) {
      lines.push(reply);
      if (reply.reaction) lines.push(reply.reaction);
    }
    const known = new Set(lines.map(hanOnly));
    for (const run of phrase.note.ru.match(/\p{Script=Han}+/gu) ?? []) {
      if (phrase.note.terms?.[run] || known.has(run) || pinyinByHanzi.has(run)) continue;
      issues.push(`пояснение: нет перевода для ${run} — допиши в note.terms`);
    }
  }

  const mark = issues.length ? "✗" : "✓";
  const when = phrase.when
    ? `  [${[...(phrase.when.time ?? []), ...(phrase.when.season ?? [])].join(", ")}]`
    : "";
  const extra =
    (phrase.requires
      ? `  [после ${phrase.requires.phraseId}=${phrase.requires.replyId}]`
      : "") + when;
  console.log(`${mark} ${phrase.id}: ${phrase.words.join("")}  ${pinyinOf(phrase)}${extra}`);
  for (const reply of phrase.replies ?? []) {
    const reaction = reply.reaction ? `  → ${reply.reaction.words.join("")}` : "";
    console.log(`    · ${reply.words.join("")}  ${pinyinOf(reply)}${reaction}`);
  }
  for (const issue of issues) console.log(`    ! ${issue}`);
  problems += issues.length;
}

console.log(`\nФраз: ${pandaPhrases.length}, проблем: ${problems}`);
process.exit(problems > 0 ? 1 : 0);
