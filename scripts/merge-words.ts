// scripts/merge-words.ts
//
// Склеивает дубликаты слов по списку из src/content/words/aliases.ts:
//   1. удаляет лишние слова из файлов базы (src/content/words/data);
//   2. заменяет лишние id на оставшиеся в наборах (src/content/sets/definitions.ts),
//      убирая повторы внутри набора.
// Прогресс пользователя переносится отдельно (при запуске приложения), см. aliases.ts.
//
// Запуск: npx tsx scripts/merge-words.ts
// Скрипт можно запускать повторно: уже склеенные слова он пропускает.

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { setDefinitions } from "../src/content/sets/definitions";
import { wordAliases } from "../src/content/words/aliases";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = join(root, "src/content/words/data");

const files = readdirSync(dataDir)
  .filter((name) => name.endsWith(".ts"))
  .map((name) => ({ path: join(dataDir, name), name, text: "" }));

for (const file of files) {
  file.text = readFileSync(file.path, "utf8");
}

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Блок слова в сгенерированном файле: от «  {» с id до закрывающего «  },». */
const blockPattern = (id: string) =>
  new RegExp(`\\n  \\{\\n    id: "${escapeRegExp(id)}",[\\s\\S]*?\\n  \\},`);

const field = (text: string, key: string) =>
  text.match(new RegExp(`${key}: "([^"]*)"`))?.[1] ?? "";

const findBlock = (id: string) => {
  for (const file of files) {
    const match = file.text.match(blockPattern(id));
    if (match) return { file, block: match[0] };
  }
  return null;
};

let removed = 0;
const problems: string[] = [];

for (const [alias, canonical] of Object.entries(wordAliases)) {
  const aliasBlock = findBlock(alias);
  const canonicalBlock = findBlock(canonical);

  if (!aliasBlock) continue; // уже склеено

  if (!canonicalBlock) {
    problems.push(`${alias} → ${canonical}: слова ${canonical} нет в базе`);
    continue;
  }

  const a = aliasBlock.block;
  const c = canonicalBlock.block;

  if (field(a, "hanzi") !== field(c, "hanzi")) {
    problems.push(
      `${alias} → ${canonical}: разные иероглифы (${field(a, "hanzi")} и ${field(c, "hanzi")})`,
    );
    continue;
  }

  console.log(
    `${field(c, "hanzi")}: оставляю ${canonical} (${field(c, "translation")}), удаляю ${alias} (${field(a, "translation")})` +
      (field(a, "pinyin") !== field(c, "pinyin")
        ? "  ВНИМАНИЕ: пиньинь разный"
        : ""),
  );

  aliasBlock.file.text = aliasBlock.file.text.replace(aliasBlock.block, "");
  removed++;
}

if (problems.length > 0) {
  console.error("\nНЕ СКЛЕЕНО:\n" + problems.join("\n"));
}

for (const file of files) {
  writeFileSync(file.path, file.text);
}

// Наборы: лишние id заменяем на оставшиеся и убираем повторы внутри набора
const definitions = setDefinitions.map((set) => ({
  ...set,
  wordIds: Array.from(new Set(set.wordIds.map((id) => wordAliases[id] ?? id))),
}));

writeFileSync(
  join(root, "src/content/sets/definitions.ts"),
  `// src/content/sets/definitions.ts
//
// Наборы слов: описание набора и список id слов из общей базы (src/content/words).

import type { PracticeSet } from "../flashcards/types";

export type SetDefinition = Omit<PracticeSet, "words"> & { wordIds: string[] };

export const setDefinitions: SetDefinition[] = ${JSON.stringify(definitions, null, 2)};
`,
);

console.log(`\nУдалено слов из базы: ${removed}`);
