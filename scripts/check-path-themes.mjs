// scripts/check-path-themes.mjs
//
// Проверяет темы пути (src/content/path/themes.ts):
//   - слова, которых нет на этом уровне HSK (опечатка или слово другого уровня);
//   - слова, которые стоят в двух темах;
//   - слова уровня, которые не попали ни в одну тему (они уйдут в «Ещё слова»).
//
// Запуск: node scripts/check-path-themes.mjs

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(join(root, path), "utf8");

// Уровни HSK по id слова (первый объект в hsk.ts)
const hskSource = read("src/content/words/hsk.ts").split(
  "export const wordFrequency",
)[0];
const levelById = new Map(
  [...hskSource.matchAll(/"([^"]+)": (\d+)/g)].map((m) => [m[1], Number(m[2])]),
);

// Слова базы: id и иероглифы
const wordsSource = read("src/content/words/data/words.ts");
const words = [...wordsSource.matchAll(/id: "([^"]+)",\s*hanzi: "([^"]+)"/g)].map(
  (m) => ({ id: m[1], hanzi: m[2] }),
);

// Темы: уровень и строка слов
const themesSource = read("src/content/path/themes.ts");
const themes = [
  ...themesSource.matchAll(
    /id: "([^"]+)",\s*level: (\d+),\s*title: "([^"]+)",\s*words:\s*"([^"]*)"/g,
  ),
].map((m) => ({
  id: m[1],
  level: Number(m[2]),
  title: m[3],
  words: m[4].split(/\s+/).filter(Boolean),
}));

let problems = 0;

for (const level of [...new Set(themes.map((t) => t.level))].sort()) {
  const levelWords = new Set(
    words.filter((w) => levelById.get(w.id) === level).map((w) => w.hanzi),
  );
  const seen = new Map();

  for (const theme of themes.filter((t) => t.level === level)) {
    for (const hanzi of theme.words) {
      if (!levelWords.has(hanzi)) {
        console.log(`HSK ${level} · ${theme.title}: «${hanzi}» нет на этом уровне`);
        problems++;
      }
      if (seen.has(hanzi)) {
        console.log(
          `HSK ${level}: «${hanzi}» есть и в «${seen.get(hanzi)}», и в «${theme.title}»`,
        );
        problems++;
      }
      seen.set(hanzi, theme.title);
    }
  }

  const missing = [...levelWords].filter((hanzi) => !seen.has(hanzi));
  if (missing.length > 0) {
    console.log(`HSK ${level}: без темы (${missing.length}): ${missing.join(" ")}`);
  }

  const count = themes.filter((t) => t.level === level).length;
  console.log(
    `HSK ${level}: тем ${count}, слов в темах ${seen.size} из ${levelWords.size}`,
  );
}

if (problems > 0) {
  console.log(`Проблем: ${problems}`);
  process.exit(1);
}
console.log("Всё в порядке");
