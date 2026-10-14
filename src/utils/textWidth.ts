// src/utils/textWidth.ts
//
// Ширина пиньиня без отрисовки: по ширинам букв шрифта Nunito Regular
// (измерены по файлу шрифта, доля от размера шрифта). Нужна, чтобы заранее
// решить, сколько колонок сетки займёт слово, — без onLayout и авто-подгонки.
// Знаки тонов на ширину не влияют: буква с тоном шириной как без него.

const WIDTHS: Record<string, number> = {
  a: 0.53,
  b: 0.583,
  c: 0.463,
  d: 0.583,
  e: 0.532,
  f: 0.333,
  g: 0.586,
  h: 0.568,
  i: 0.232,
  j: 0.236,
  k: 0.5,
  l: 0.296,
  m: 0.856,
  n: 0.568,
  o: 0.556,
  p: 0.583,
  q: 0.583,
  r: 0.358,
  s: 0.481,
  t: 0.35,
  u: 0.561,
  v: 0.515,
  w: 0.841,
  x: 0.525,
  y: 0.514,
  z: 0.463,
  " ": 0.258,
  "'": 0.221,
  "’": 0.221,
  "·": 0.228,
  "-": 0.424,
};

/** Для заглавных и прочих символов — с запасом. */
const FALLBACK = 0.65;

/** Ширина пиньиня в pt при данном размере шрифта. */
export function pinyinWidth(pinyin: string, fontSize: number): number {
  const plain = pinyin.normalize("NFD").replace(/[̀-ͯ]/g, "");
  let em = 0;
  for (const char of plain) em += WIDTHS[char] ?? FALLBACK;
  return em * fontSize;
}
