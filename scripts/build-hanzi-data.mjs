// scripts/build-hanzi-data.mjs
//
// Собирает данные для режима «Написание»: берёт все слова из одного иероглифа
// из наборов карточек и сохраняет их черты в один небольшой JSON.
//
// Подготовка (один раз):
//   npm i -D hanzi-writer-data
//   скачать dictionary.txt из https://github.com/skishore/makemeahanzi
//   и положить в scripts/dictionary.txt (добавь его в .gitignore, ~2.5 МБ)
//
// Запуск:
//   node scripts/build-hanzi-data.mjs
//
// Результат: src/content/writing/hanziData.json (его можно коммитить)

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

const SETS_DIR = join(root, "src/content/flashcards/data");
const DICTIONARY_PATH = join(root, "scripts/dictionary.txt");
const DATA_DIR = join(root, "node_modules/hanzi-writer-data");
const OUTPUT_PATH = join(root, "src/content/writing/hanziData.json");

// Ось Y в исходных данных направлена вверх, а в SVG вниз, поэтому y' = 900 - y.
// После этого иероглиф лежит в квадрате 1024×1024.
const FLIP = 900;

// 1. Собираем иероглифы из наборов: только слова из одного иероглифа
const characters = new Set();

for (const file of readdirSync(SETS_DIR).filter((f) => f.endsWith(".ts"))) {
  const source = readFileSync(join(SETS_DIR, file), "utf8");

  for (const match of source.matchAll(/hanzi:\s*["']([^"']+)["']/g)) {
    for (const char of Array.from(match[1])) {
      // Только иероглифы, без знаков препинания
      if (/\p{Script=Han}/u.test(char)) {
        characters.add(char);
      }
    }
  }
}

console.log(`Найдено уникальных иероглифов: ${characters.size}`);

// 2. Словарь Make Me a Hanzi: ключ, разбиение на компоненты, этимология
const dictionary = new Map();

if (existsSync(DICTIONARY_PATH)) {
  for (const line of readFileSync(DICTIONARY_PATH, "utf8").split("\n")) {
    if (!line.trim()) continue;
    const entry = JSON.parse(line);
    dictionary.set(entry.character, entry);
  }
} else {
  console.warn(
    "scripts/dictionary.txt не найден — компоненты и подсказки не будут добавлены",
  );
}

// 3. Переворот координат в строке SVG-пути (в данных только M, L, Q, C, Z)
function flipPath(path) {
  const tokens = path.match(/[A-Za-z]|-?\d+(?:\.\d+)?/g) ?? [];
  const out = [];
  let isY = false;

  for (const token of tokens) {
    if (/[A-Za-z]/.test(token)) {
      if (!"MLQCZ".includes(token)) {
        throw new Error(`Неожиданная команда пути: ${token}`);
      }
      out.push(token);
      isY = false;
    } else {
      const value = Number(token);
      out.push(String(isY ? Math.round(FLIP - value) : Math.round(value)));
      isY = !isY;
    }
  }

  return out.join(" ");
}

const result = {};
const missing = [];

for (const character of [...characters].sort()) {
  const filePath = join(DATA_DIR, `${character}.json`);

  if (!existsSync(filePath)) {
    missing.push(character);
    continue;
  }

  const data = JSON.parse(readFileSync(filePath, "utf8"));
  const info = dictionary.get(character);

  result[character] = {
    strokes: data.strokes.map(flipPath),
    medians: data.medians.map((median) =>
      median.map(([x, y]) => [Math.round(x), Math.round(FLIP - y)]),
    ),
    ...(info && {
      radical: info.radical,
      decomposition: info.decomposition,
      // matches[i] — путь компонента, к которому относится черта i (null — не разбивается)
      matches: info.matches,
      etymology: info.etymology,
    }),
  };
}

mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
writeFileSync(OUTPUT_PATH, JSON.stringify(result));

console.log(
  `Записано иероглифов: ${Object.keys(result).length} → ${OUTPUT_PATH}`,
);
if (missing.length > 0) {
  console.warn(`Нет данных для: ${missing.join(" ")}`);
}
