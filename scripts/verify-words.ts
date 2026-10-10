// scripts/verify-words.ts
//
// Проверка после миграции: наборы, собранные из базы слов, должны совпадать
// с тем, что было раньше (снимок scripts/practiceSets.snapshot.json).
//
// Запуск: npx tsx scripts/verify-words.ts

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { practiceSets } from "../src/content/flashcards/sets";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const snapshot = JSON.parse(
  readFileSync(join(root, "scripts/practiceSets.snapshot.json"), "utf8"),
) as typeof practiceSets;

const problems: string[] = [];
const FIELDS = ["vocabularyId", "hanzi", "pinyin", "translation"] as const;

if (practiceSets.length !== snapshot.length) {
  problems.push(
    `Число наборов: было ${snapshot.length}, стало ${practiceSets.length}`,
  );
}

for (const before of snapshot) {
  const after = practiceSets.find((set) => set.id === before.id);

  if (!after) {
    problems.push(`Пропал набор ${before.id}`);
    continue;
  }

  for (const key of Object.keys(before)) {
    if (key === "words") continue;
    if (
      JSON.stringify((before as any)[key]) !==
      JSON.stringify((after as any)[key])
    ) {
      problems.push(`${before.id}: поле ${key} изменилось`);
    }
  }

  if (before.words.length !== after.words.length) {
    problems.push(
      `${before.id}: слов было ${before.words.length}, стало ${after.words.length}`,
    );
    continue;
  }

  before.words.forEach((oldWord, index) => {
    const newWord = after.words[index];

    for (const field of FIELDS) {
      if (oldWord[field] !== newWord[field]) {
        problems.push(
          `${before.id}[${index}] ${field}: было ${oldWord[field]}, стало ${newWord[field]}`,
        );
      }
    }

    if (
      JSON.stringify(oldWord.colloquial) !== JSON.stringify(newWord.colloquial)
    ) {
      problems.push(
        `${before.id}[${index}] ${oldWord.hanzi}: colloquial изменился`,
      );
    }
  });
}

if (problems.length > 0) {
  console.error("НАЙДЕНЫ РАЗЛИЧИЯ:\n" + problems.join("\n"));
  process.exit(1);
}

const totalWords = practiceSets.reduce((sum, set) => sum + set.words.length, 0);
console.log(
  `Всё совпадает: ${practiceSets.length} наборов, ${totalWords} слов.`,
);
