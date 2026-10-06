// src/content/panda/phrases.ts
//
// Персональные фразы панды. Ключ — hanzi слова, к которому фраза относится.
// Перевод — ключ i18n (namespace "panda"). Добавлять фразы можно по одной.

export type PandaPhrase = {
  hanzi: string;
  pinyin: string;
  translationKey: string;
  distractorKeys?: string[];
};

export const pandaPhrases: Record<string, PandaPhrase> = {
  // greetings
  谢谢: {
    hanzi: "谢谢你今天来！",
    pinyin: "Xièxie nǐ jīntiān lái!",
    translationKey: "greetings.thanks",
  },
  对不起: {
    hanzi: "对不起，我睡着了。",
    pinyin: "Duìbuqǐ, wǒ shuìzháo le.",
    translationKey: "greetings.sorry",
  },
  早上好: {
    hanzi: "早上好！你睡得好吗？",
    pinyin: "Zǎoshang hǎo! Nǐ shuì de hǎo ma?",
    translationKey: "greetings.good_morning",
  },
  晚安: {
    hanzi: "晚安，明天见！",
    pinyin: "Wǎn'ān, míngtiān jiàn!",
    translationKey: "greetings.good_night",
  },
  你好吗: {
    hanzi: "你好吗？我今天很好！",
    pinyin: "Nǐ hǎo ma? Wǒ jīntiān hěn hǎo!",
    translationKey: "greetings.how_are_you",
  },
  好久不见: {
    hanzi: "好久不见！我想你了。",
    pinyin: "Hǎojiǔ bújiàn! Wǒ xiǎng nǐ le.",
    translationKey: "greetings.long_time",
  },
  很高兴认识你: {
    hanzi: "很高兴认识你！我们一起学习吧！",
    pinyin: "Hěn gāoxìng rènshi nǐ! Wǒmen yìqǐ xuéxí ba!",
    translationKey: "greetings.nice_to_meet",
  },
  辛苦了: {
    hanzi: "今天辛苦了！",
    pinyin: "Jīntiān xīnkǔ le!",
    translationKey: "greetings.well_done",
  },

  // animals
  猫: {
    hanzi: "我喜欢猫，你呢？",
    pinyin: "Wǒ xǐhuan māo, nǐ ne?",
    translationKey: "animals.cat",
  },
  狗: {
    hanzi: "你有狗吗？",
    pinyin: "Nǐ yǒu gǒu ma?",
    translationKey: "animals.dog",
  },
  熊猫: {
    hanzi: "我是熊猫，我是你的朋友！",
    pinyin: "Wǒ shì xióngmāo, wǒ shì nǐ de péngyou!",
    translationKey: "animals.panda",
  },
  兔子: {
    hanzi: "兔子很可爱！",
    pinyin: "Tùzi hěn kě'ài!",
    translationKey: "s.animals.rabbit",
  },
  老虎: {
    hanzi: "老虎很大！我有点怕。",
    pinyin: "Lǎohǔ hěn dà! Wǒ yǒudiǎn pà.",
    translationKey: "animals.tiger",
  },
};
