interface ToneInfo {
  base: string;
  tone: number;
}

const TONE_MARKS: Record<string, ToneInfo> = {
  ā: { base: "a", tone: 1 },
  á: { base: "a", tone: 2 },
  ǎ: { base: "a", tone: 3 },
  à: { base: "a", tone: 4 },
  ē: { base: "e", tone: 1 },
  é: { base: "e", tone: 2 },
  ě: { base: "e", tone: 3 },
  è: { base: "e", tone: 4 },
  ī: { base: "i", tone: 1 },
  í: { base: "i", tone: 2 },
  ǐ: { base: "i", tone: 3 },
  ì: { base: "i", tone: 4 },
  ō: { base: "o", tone: 1 },
  ó: { base: "o", tone: 2 },
  ǒ: { base: "o", tone: 3 },
  ò: { base: "o", tone: 4 },
  ū: { base: "u", tone: 1 },
  ú: { base: "u", tone: 2 },
  ǔ: { base: "u", tone: 3 },
  ù: { base: "u", tone: 4 },
  ǖ: { base: "ü", tone: 1 },
  ǘ: { base: "ü", tone: 2 },
  ǚ: { base: "ü", tone: 3 },
  ǜ: { base: "ü", tone: 4 },
};

export function getSyllableCount(pinyin: string): number {
  return pinyin.trim().split(/\s+/).length;
}

function parseSyllable(syllable: string): { tone: number; blanked: string } {
  for (const char of syllable) {
    const match = TONE_MARKS[char];
    if (match) {
      return { tone: match.tone, blanked: syllable.replace(char, "_") };
    }
  }
  return { tone: 5, blanked: syllable }; // нейтральный тон
}

export function parsePinyin(pinyin: string) {
  const syllables = pinyin.trim().split(/\s+/);
  const parsed = syllables.map(parseSyllable);

  return {
    tones: parsed.map((p) => p.tone),
    blankedPinyin: parsed.map((p) => p.blanked).join(" "),
  };
}
