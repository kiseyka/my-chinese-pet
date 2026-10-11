// scripts/build-hsk-words.mjs
//
// Дописывает в src/content/words/data/words.ts слова HSK (HSK 3.0, уровни 1–MAX_LEVEL),
// которых там ещё нет (сравнение по иероглифам). Существующие строки НЕ трогает:
// твои правки пиньиня, переводы и разговорные варианты сохраняются.
// У новых слов английский из словаря, русский пустой — допишешь сама.
//
// Источник: Complete HSK Vocabulary (MIT), https://github.com/drkameleon/complete-hsk-vocabulary
// Тот же файл, что использует tag-hsk.mjs (scripts/.cache/complete.json), скачивается при первом запуске.
//
// Подготовка: npm i -D hanzi-writer-data (уже установлен для build-hanzi-data.mjs)
//
// Запуск:                        node scripts/build-hsk-words.mjs
// Другой максимальный уровень:   node scripts/build-hsk-words.mjs 6
//   (4 — около 1950 слов; 6 — около 5200; 7 означает «HSK 7–9», это ещё почти 5000 слов)
//
// После запуска выполни по порядку:
//   node scripts/build-hanzi-data.mjs
//   node scripts/tag-hsk.mjs
//   node scripts/check-hsk-translations.mjs — какие слова ещё без русского

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  ID_PREFIX,
  WORDS_RELATIVE_PATH,
  formatWordLine,
  getEntryLevel,
  loadHskList,
  makeTranslation,
  parseWords,
  pickForm,
} from "./lib/hskList.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const MAX_LEVEL = Number(process.argv[2] ?? 4);
if (!Number.isInteger(MAX_LEVEL) || MAX_LEVEL < 1 || MAX_LEVEL > 7) {
  console.error("Уровень должен быть числом от 1 до 7");
  process.exit(1);
}

const WORDS_PATH = join(root, WORDS_RELATIVE_PATH);
const STROKES_DIR = join(root, "node_modules/hanzi-writer-data");

if (!existsSync(WORDS_PATH)) {
  console.error(
    `Нет ${WORDS_RELATIVE_PATH}. Если переход ещё не сделан: node scripts/migrate-to-words-file.mjs`,
  );
  process.exit(1);
}

const source = readFileSync(WORDS_PATH, "utf8");
const existing = parseWords(source);
const existingHanzi = new Set(existing.map((word) => word.hanzi));
const existingIds = new Set(existing.map((word) => word.id));

const list = await loadHskList(root);

// Новые слова
const added = [];
const skippedNoStrokes = [];

for (const entry of list) {
  const level = getEntryLevel(entry);
  if (level === undefined || level > MAX_LEVEL) continue;

  const hanzi = entry.simplified;
  if (existingHanzi.has(hanzi)) continue;

  const characters = Array.from(hanzi);
  if (!characters.every((char) => /\p{Script=Han}/u.test(char))) continue;

  if (!characters.every((char) => existsSync(join(STROKES_DIR, `${char}.json`)))) {
    skippedNoStrokes.push(hanzi);
    continue;
  }

  const id = `${ID_PREFIX}${hanzi}`;
  if (existingIds.has(id)) continue;

  const form = pickForm(entry.forms, hanzi);

  added.push({
    id,
    hanzi,
    pinyin: form.transcriptions.pinyin,
    en: makeTranslation(form.meanings),
    ru: "",
    level,
    frequency: entry.frequency,
  });
  existingHanzi.add(hanzi);
}

if (added.length === 0) {
  console.log(`Новых слов HSK 1–${MAX_LEVEL} нет: все уже в ${WORDS_RELATIVE_PATH}`);
  process.exit(0);
}

// По уровню, внутри уровня — от частых к редким; дописываем перед закрывающей «];»
added.sort((a, b) => a.level - b.level || a.frequency - b.frequency);

const closing = source.lastIndexOf("\n];");
if (closing === -1) {
  console.error(`Не нашёл конец массива слов («];») в ${WORDS_RELATIVE_PATH}`);
  process.exit(1);
}

const block = [
  `  // ── Добавлено build-hsk-words.mjs (HSK 1–${MAX_LEVEL}) ──`,
  ...added.map(formatWordLine),
].join("\n");

writeFileSync(
  WORDS_PATH,
  `${source.slice(0, closing)}\n${block}${source.slice(closing)}`,
);

// Отчёт
const counts = {};
for (const word of added) counts[word.level] = (counts[word.level] ?? 0) + 1;

console.log(`Добавлено слов: ${added.length} → ${WORDS_RELATIVE_PATH}`);
console.log("По уровням:", JSON.stringify(counts));
if (skippedNoStrokes.length > 0) {
  console.warn(`Нет данных черт, пропущено: ${skippedNoStrokes.join(" ")}`);
}
console.log(
  "\nДальше: node scripts/build-hanzi-data.mjs, затем node scripts/tag-hsk.mjs,\n" +
    "затем node scripts/check-hsk-translations.mjs",
);
