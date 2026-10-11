// scripts/migrate-words.ts
//
// Разовая миграция: превращает «слова, зашитые в наборах» в общую базу слов + наборы-списки.
//
// Что делает:
//   1. Читает текущие practiceSets (импортирует src/content/flashcards/sets.ts).
//   2. Сохраняет снимок для проверки: scripts/practiceSets.snapshot.json.
//   3. Создаёт базу слов: src/content/words/data/<набор>.ts, types.ts, index.ts.
//   4. Создаёт описания наборов: src/content/sets/definitions.ts (id слов вместо самих слов).
//   5. Печатает отчёт о повторах: одно и то же слово под разными id.
//
// Ключ слова (id) = прежний vocabularyId, поэтому прогресс пользователей не теряется.
//
// Запуск: npx tsx scripts/migrate-words.ts
// Новый sets.ts (из инструкции) нужно положить вручную после запуска.

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { practiceSets } from "../src/content/flashcards/sets";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

type AnyWord = {
  id: string;
  vocabularyId: string;
  hanzi: string;
  pinyin: string;
  translation: string;
  colloquial?: { hanzi: string; pinyin: string; note: string };
  [key: string]: unknown;
};

// 1. Снимок текущих данных для последующей проверки
const snapshot = practiceSets.map((set) => ({
  ...set,
  words: (set.words as AnyWord[]).map((word) => ({ ...word })),
}));

writeFileSync(
  join(root, "scripts/practiceSets.snapshot.json"),
  JSON.stringify(snapshot, null, 2),
);

// 2. Собираем уникальные слова. Ключ — vocabularyId. Категория — первый набор, где слово встретилось
interface Entry {
  id: string;
  hanzi: string;
  pinyin: string;
  translation: string;
  colloquial?: AnyWord["colloquial"];
  category: string;
}

const entries = new Map<string, Entry>();
const conflicts: string[] = [];

for (const set of practiceSets) {
  for (const word of set.words as AnyWord[]) {
    const known = entries.get(word.vocabularyId);

    if (known) {
      const same =
        known.hanzi === word.hanzi &&
        known.pinyin === word.pinyin &&
        known.translation === word.translation;

      if (!same) {
        conflicts.push(
          `${word.vocabularyId}: в наборе «${known.category}» это ${known.hanzi} (${known.pinyin}), а в «${set.id}» — ${word.hanzi} (${word.pinyin})`,
        );
      }
      continue;
    }

    entries.set(word.vocabularyId, {
      id: word.vocabularyId,
      hanzi: word.hanzi,
      pinyin: word.pinyin,
      translation: word.translation,
      ...(word.colloquial && { colloquial: word.colloquial }),
      category: set.id,
    });
  }
}

if (conflicts.length > 0) {
  console.error(
    "ОШИБКА: один vocabularyId у разных слов:\n" + conflicts.join("\n"),
  );
  process.exit(1);
}

// 3. Файлы базы слов: по одному на категорию (по имени исходного набора)
const toCamel = (value: string) =>
  value.replace(/[-_ ]+([a-zA-Z0-9])/g, (_, c: string) => c.toUpperCase());

const q = (value: string) => JSON.stringify(value);

function serialize(entry: Entry): string {
  const lines = [
    `    id: ${q(entry.id)},`,
    `    hanzi: ${q(entry.hanzi)},`,
    `    pinyin: ${q(entry.pinyin)},`,
    `    translation: ${q(entry.translation)},`,
  ];

  if (entry.colloquial) {
    lines.push(
      `    colloquial: {`,
      `      hanzi: ${q(entry.colloquial.hanzi)},`,
      `      pinyin: ${q(entry.colloquial.pinyin)},`,
      `      note: ${q(entry.colloquial.note)},`,
      `    },`,
    );
  }

  return `  {\n${lines.join("\n")}\n  },`;
}

const byCategory = new Map<string, Entry[]>();
for (const entry of entries.values()) {
  byCategory.set(entry.category, [
    ...(byCategory.get(entry.category) ?? []),
    entry,
  ]);
}

const wordsDir = join(root, "src/content/words");
mkdirSync(join(wordsDir, "data"), { recursive: true });

const imports: string[] = [];
const spreads: string[] = [];

for (const [category, list] of byCategory) {
  const name = `${toCamel(category)}Words`;

  writeFileSync(
    join(wordsDir, "data", `${category}.ts`),
    `import type { WordEntry } from "../types";\n\nexport const ${name}: WordEntry[] = [\n${list.map(serialize).join("\n")}\n];\n`,
  );

  imports.push(`import { ${name} } from "./data/${category}";`);
  spreads.push(`  ...${name},`);
}

writeFileSync(
  join(wordsDir, "types.ts"),
  `// src/content/words/types.ts

export type WordEntry = {
  /**
   * Стабильный ключ слова. Под ним хранится весь прогресс пользователя,
   * поэтому после создания id менять нельзя.
   */
  id: string;
  hanzi: string;
  /** Пиньинь с тоновыми знаками. */
  pinyin: string;
  /** Ключ перевода (i18n). */
  translation: string;
  /** Разговорный вариант слова (необязательно). */
  colloquial?: {
    hanzi: string;
    pinyin: string;
    /** Ключ пояснения (i18n). */
    note: string;
  };
  /** Уровень HSK (необязательно, на будущее). */
  hsk?: number;
};
`,
);

writeFileSync(
  join(wordsDir, "index.ts"),
  `// src/content/words/index.ts
//
// Общая база слов. Новое слово добавляется в один из файлов data/ (или в новый файл,
// который нужно подключить здесь). Наборы ссылаются на слова по id.

import type { WordEntry } from "./types";
${imports.join("\n")}

export const allWords: WordEntry[] = [
${spreads.join("\n")}
];

export const wordsById: Record<string, WordEntry> = {};

for (const word of allWords) {
  if (wordsById[word.id]) {
    throw new Error(\`Повторяющийся id слова в базе: \${word.id}\`);
  }
  wordsById[word.id] = word;
}

export function getWordEntry(id: string): WordEntry {
  const word = wordsById[id];
  if (!word) {
    throw new Error(\`В базе слов нет слова с id: \${id}\`);
  }
  return word;
}

/** Количество слогов (в китайском один слог — один иероглиф). */
export function getSyllableCount(word: WordEntry): number {
  return Array.from(word.hanzi).length;
}
`,
);

// 4. Описания наборов: всё, кроме слов, плюс список id
const definitions = practiceSets.map((set) => {
  const { words, ...rest } = set as unknown as { words: AnyWord[] } & Record<
    string,
    unknown
  >;
  return { ...rest, wordIds: words.map((word) => word.vocabularyId) };
});

mkdirSync(join(root, "src/content/sets"), { recursive: true });

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

// 5. Отчёт
console.log(`Наборов: ${practiceSets.length}`);
console.log(`Уникальных слов в базе: ${entries.size}`);
for (const [category, list] of byCategory) {
  console.log(`  data/${category}.ts — ${list.length}`);
}

const byHanzi = new Map<string, Entry[]>();
for (const entry of entries.values()) {
  byHanzi.set(entry.hanzi, [...(byHanzi.get(entry.hanzi) ?? []), entry]);
}

const duplicates = [...byHanzi.values()].filter((list) => list.length > 1);

if (duplicates.length > 0) {
  console.log(
    "\nОДИН И ТОТ ЖЕ ИЕРОГЛИФ ПОД РАЗНЫМИ id (прогресс по ним хранится отдельно):",
  );
  for (const list of duplicates) {
    console.log(
      `  ${list[0].hanzi}: ${list.map((entry) => `${entry.id} (${entry.pinyin})`).join(", ")}`,
    );
  }
  console.log(
    "Часть из них может быть омонимами с разными значениями — это нормально.",
  );
}

console.log(
  "\nДальше: положи новый src/content/flashcards/sets.ts и запусти scripts/verify-words.ts",
);
