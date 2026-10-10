// scripts/build-hanzi-data.mjs
//
// Собирает данные для режима «Написание»: берёт все иероглифы из всех слов базы
// (твои слова в src/content/words/data и слова HSK в src/content/words/generated)
// и сохраняет их черты и части в один JSON.
//
// Подготовка (один раз):
//   npm i -D hanzi-writer-data
//   скачать dictionary.txt из https://github.com/skishore/makemeahanzi
//   (файл dictionary.txt в корне репозитория) и положить в scripts/dictionary.txt
//   — добавь scripts/dictionary.txt в .gitignore, он весит около 2.5 МБ
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

// Папки со словами: твои слова и слова HSK из build-hsk-words.mjs (её может не быть)
const WORD_DIRS = [
  join(root, "src/content/words/data"),
  join(root, "src/content/words/generated"),
];
const DICTIONARY_PATH = join(root, "scripts/dictionary.txt");
const DATA_DIR = join(root, "node_modules/hanzi-writer-data");
const OUTPUT_PATH = join(root, "src/content/writing/hanziData.json");

// Высота «рабочей» области в исходных данных: ось Y у них направлена вверх,
// а у SVG вниз, поэтому y' = 900 - y. После этого иероглиф лежит в квадрате 1024×1024.
const FLIP = 900;

// 1. Собираем иероглифы из всех слов базы
const characters = new Set();

for (const dir of WORD_DIRS.filter((path) => existsSync(path))) {
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".ts"))) {
    const source = readFileSync(join(dir, file), "utf8");

    for (const match of source.matchAll(/hanzi:\s*["']([^"']+)["']/g)) {
      for (const char of Array.from(match[1])) {
        // Только иероглифы, без знаков препинания
        if (/\p{Script=Han}/u.test(char)) {
          characters.add(char);
        }
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
    "scripts/dictionary.txt не найден — части и подсказки не будут добавлены",
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

// 4. Части иероглифа для поэтапного изучения.
//    Иероглиф делится по разбиению Make Me a Hanzi; крупные части (больше PART_LIMIT черт)
//    делятся дальше по словарной статье самой части; мелкие соседние части объединяются,
//    чтобы частей было не больше MAX_PARTS.
const PART_LIMIT = 6;
const MAX_PARTS = 4;

const BINARY = new Set(Array.from("⿰⿱⿴⿵⿶⿷⿸⿹⿺⿻"));
const TERNARY = new Set(Array.from("⿲⿳"));

function parseIds(chars, pos) {
  const char = chars[pos];
  if (char === undefined) return null;

  const arity = BINARY.has(char) ? 2 : TERNARY.has(char) ? 3 : 0;
  if (arity === 0) return { node: { text: char, children: [] }, next: pos + 1 };

  const children = [];
  let next = pos + 1;

  for (let i = 0; i < arity; i++) {
    const parsed = parseIds(chars, next);
    if (!parsed) return null;
    children.push(parsed.node);
    next = parsed.next;
  }

  return {
    node: { text: children.map((c) => c.text).join(""), children },
    next,
  };
}

/** Части иероглифа: [{ label, strokes: [индексы черт] }] или null, если не делится. */
function splitChar(char, depth = 0) {
  const entry = dictionary.get(char);

  if (
    !entry ||
    !entry.decomposition ||
    !entry.matches ||
    entry.matches.some((m) => !m)
  ) {
    return null;
  }

  const parsed = parseIds(Array.from(entry.decomposition), 0);
  if (!parsed || parsed.node.children.length < 2) return null;

  const strokesUnder = (path) =>
    entry.matches
      .map((match, index) =>
        path.every((step, d) => match[d] === step) ? index : -1,
      )
      .filter((index) => index >= 0);

  const walk = (node, path) => {
    const strokes = strokesUnder(path);
    if (strokes.length === 0) return [];
    if (strokes.length <= PART_LIMIT) return [{ label: node.text, strokes }];

    if (node.children.length > 0) {
      return node.children.flatMap((child, index) =>
        walk(child, [...path, index]),
      );
    }

    // Лист разбиения: пробуем разложить сам компонент по его словарной статье
    if (Array.from(node.text).length === 1 && depth < 3) {
      const sub = splitChar(node.text, depth + 1);
      const subEntry = dictionary.get(node.text);

      if (sub && subEntry && subEntry.matches.length === strokes.length) {
        return sub.map((part) => ({
          label: part.label,
          strokes: part.strokes.map((j) => strokes[j]),
        }));
      }
    }

    return [{ label: node.text, strokes }];
  };

  const leaves = parsed.node.children
    .flatMap((child, index) => walk(child, [index]))
    .sort((a, b) => a.strokes[0] - b.strokes[0]);

  // Все черты должны попасть в какую-то часть
  const covered = new Set(leaves.flatMap((leaf) => leaf.strokes));
  if (covered.size !== entry.matches.length) return null;

  return leaves.length >= 2 ? leaves : null;
}

function mergeSmallest(parts, maxParts) {
  const result = [...parts];

  while (result.length > maxParts) {
    let best = 0;
    let bestSize = Infinity;

    for (let i = 0; i < result.length - 1; i++) {
      const size = result[i].strokes.length + result[i + 1].strokes.length;
      if (size < bestSize) {
        bestSize = size;
        best = i;
      }
    }

    result.splice(best, 2, {
      label: result[best].label + result[best + 1].label,
      strokes: [...result[best].strokes, ...result[best + 1].strokes].sort(
        (a, b) => a - b,
      ),
    });
  }

  return result;
}

/** Одночерточные части присоединяем к меньшему соседу: этапы на одну черту ни к чему. */
function absorbTiny(parts) {
  const result = [...parts];

  while (result.length > 2) {
    const index = result.findIndex((part) => part.strokes.length < 2);
    if (index === -1) break;

    const left = result[index - 1];
    const right = result[index + 1];
    const mergeWith =
      left && (!right || left.strokes.length <= right.strokes.length)
        ? index - 1
        : index;

    const first = result[mergeWith];
    const second = result[mergeWith + 1];

    result.splice(mergeWith, 2, {
      label: first.label + second.label,
      strokes: [...first.strokes, ...second.strokes].sort((a, b) => a - b),
    });
  }

  return result;
}

/** Иероглифы из трёх черт и меньше на части не делим. */
const MIN_STROKES_FOR_PARTS = 4;

function getParts(char) {
  const entry = dictionary.get(char);
  if (!entry || entry.matches.length < MIN_STROKES_FOR_PARTS) return undefined;

  const leaves = splitChar(char);
  if (!leaves) return undefined;

  const parts = mergeSmallest(absorbTiny(leaves), MAX_PARTS);

  // Этап на одну черту ни к чему: такой иероглиф лучше не делить
  if (parts.length < 2 || parts.some((part) => part.strokes.length < 2)) {
    return undefined;
  }

  return parts;
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
  const parts = getParts(character);

  result[character] = {
    strokes: data.strokes.map(flipPath),
    medians: data.medians.map((median) =>
      median.map(([x, y]) => [Math.round(x), Math.round(FLIP - y)]),
    ),
    ...(info && {
      radical: info.radical,
      decomposition: info.decomposition,
      etymology: info.etymology,
    }),
    // Части для поэтапного изучения (нет у иероглифов, которые не делятся)
    ...(parts && { parts }),
  };
}

mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
writeFileSync(OUTPUT_PATH, JSON.stringify(result));

const sizeMb = (Buffer.byteLength(JSON.stringify(result)) / 1024 / 1024).toFixed(1);
console.log(
  `Записано иероглифов: ${Object.keys(result).length} (${sizeMb} МБ) → ${OUTPUT_PATH}`,
);
if (missing.length > 0) {
  console.warn(`Нет данных для: ${missing.join(" ")}`);
}
