// src/utils/pinyinVariants.ts
//
// Неверные варианты пиньиня для вопроса «как читается 买?»: то же слово с другими
// тонами (mǎi → māi, mái, mài). Так вопрос проверяет именно тоны, а не знакомство
// со звучанием. У слова из нескольких слогов меняется тон одного слога за раз
// (nǐ hǎo → ní hǎo, nǐ hāo…), если таких мало — двух.
//
// Пиньинь в базе разный: «nǐ hǎo» (слоги через пробел), «Zhōng guó» (с заглавной),
// «diàndòngchē» (слитно). Слитный не разобрать на слоги надёжно — для него вопроса
// нет (null), тренировка спросит слово по-другому.

import { shuffle } from "@/utils/shuffle";

const MARKS: Record<string, string[]> = {
  // индекс = тон: 0 — без знака (лёгкий тон), 1–4 — со знаком
  a: ["a", "ā", "á", "ǎ", "à"],
  e: ["e", "ē", "é", "ě", "è"],
  i: ["i", "ī", "í", "ǐ", "ì"],
  o: ["o", "ō", "ó", "ǒ", "ò"],
  u: ["u", "ū", "ú", "ǔ", "ù"],
  ü: ["ü", "ǖ", "ǘ", "ǚ", "ǜ"],
};

/** Гласная со знаком → [гласная без знака, тон]. */
const UNMARK = new Map<string, [string, number]>();
for (const [base, forms] of Object.entries(MARKS)) {
  forms.forEach((form, tone) => {
    if (tone > 0) UNMARK.set(form, [base, tone]);
  });
}

interface Syllable {
  /** Слог без знака тона, как в базе (с заглавной, если была). */
  base: string;
  /** 1–4, 0 — лёгкий тон. */
  tone: number;
}

function parseSyllable(syllable: string): Syllable | null {
  let tone = 0;
  let base = "";
  for (const char of syllable) {
    const mark = UNMARK.get(char);
    if (mark) {
      if (tone) return null; // два знака в слоге — это слитный пиньинь
      [base, tone] = [base + mark[0], mark[1]];
    } else {
      base += char;
    }
  }
  return /^[a-zA-Zü]+$/.test(base) ? { base, tone } : null;
}

/** Слог с нужным тоном. Знак — по правилам: a/e, иначе o в «ou», иначе последняя гласная. */
function withTone(base: string, tone: number): string {
  if (tone === 0) return base;
  const lower = base.toLowerCase();
  let index = lower.search(/[ae]/);
  if (index < 0) index = lower.indexOf("ou");
  if (index < 0) {
    for (let i = lower.length - 1; i >= 0; i--) {
      if ("iouü".includes(lower[i])) {
        index = i;
        break;
      }
    }
  }
  if (index < 0) return base;
  const vowel = lower[index];
  const marked = MARKS[vowel]?.[tone];
  if (!marked) return base;
  return base.slice(0, index) + marked + base.slice(index + 1);
}

/**
 * Неверные варианты чтения слова (count штук, все разные и не равные верному)
 * или null, если пиньинь не разобрать или вариантов не хватает.
 */
export function buildPinyinVariants(
  pinyin: string,
  hanzi: string,
  count = 3,
): string[] | null {
  const parts = pinyin.trim().split(/\s+/);
  if (parts.length !== Array.from(hanzi).length) return null;

  const syllables = parts.map(parseSyllable);
  if (syllables.some((s) => !s)) return null;
  const parsed = syllables as Syllable[];

  const render = (tones: number[]) =>
    parsed.map((s, i) => withTone(s.base, tones[i])).join(" ");
  const correct = render(parsed.map((s) => s.tone));

  // Тоны, на которые меняем слог: 1–4 кроме своего. Лёгкий тон — только не в первом
  // слоге (в начале слова он не бывает, такой вариант отгадывался бы сразу)
  const toneChoices = (i: number) =>
    [1, 2, 3, 4, ...(i > 0 ? [0] : [])].filter((t) => t !== parsed[i].tone);

  const seen = new Set([correct]);
  const variants: string[] = [];
  const add = (tones: number[]) => {
    const text = render(tones);
    if (seen.has(text)) return;
    seen.add(text);
    variants.push(text);
  };

  // Сначала — один слог с другим тоном
  const single: number[][] = [];
  parsed.forEach((_, i) => {
    for (const tone of toneChoices(i)) {
      const tones = parsed.map((s) => s.tone);
      tones[i] = tone;
      single.push(tones);
    }
  });
  for (const tones of shuffle(single)) {
    if (variants.length >= count) break;
    add(tones);
  }

  // Не хватило — два слога сразу
  if (variants.length < count && parsed.length > 1) {
    const double: number[][] = [];
    for (let i = 0; i < parsed.length; i++) {
      for (let j = i + 1; j < parsed.length; j++) {
        for (const a of toneChoices(i)) {
          for (const b of toneChoices(j)) {
            const tones = parsed.map((s) => s.tone);
            tones[i] = a;
            tones[j] = b;
            double.push(tones);
          }
        }
      }
    }
    for (const tones of shuffle(double)) {
      if (variants.length >= count) break;
      add(tones);
    }
  }

  return variants.length >= count ? variants : null;
}
