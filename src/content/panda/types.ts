// content/panda/types.ts

export type PandaTone = "neutral" | "warm" | "playful" | "calm";

export type PandaPhrase = {
  id: string;
  textKey: string; // ключ перевода, не сам текст
  tone: PandaTone;
  chinese?: { hanzi: string; pinyin: string }; // опционально, если фраза ссылается на конкретное слово
};
