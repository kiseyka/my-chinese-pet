// scripts/tts/export_words.ts
//
// Выгрузить слова пути одного уровня HSK для озвучки (scripts/tts/generate_zh.py).
//   npx tsx scripts/tts/export_words.ts 1 > /tmp/hsk1.json
// Печатает JSON: [{ id, hanzi, pinyin }] в порядке этапов пути, без повторов.

import { getPathStages } from "@/utils/path/stages";

const level = Number(process.argv[2] ?? 1);
const seen = new Set<string>();
const words: { id: string; hanzi: string; pinyin: string }[] = [];

for (const stage of getPathStages()) {
  if (stage.level !== level) continue;
  for (const word of stage.words) {
    if (seen.has(word.vocabularyId)) continue;
    seen.add(word.vocabularyId);
    words.push({ id: word.vocabularyId, hanzi: word.hanzi, pinyin: word.pinyin });
  }
}

console.log(JSON.stringify(words));
