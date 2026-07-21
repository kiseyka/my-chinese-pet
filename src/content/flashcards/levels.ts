export type Question = {
  id: string;

  hanzi: string; // 你好
  pinyin: string; // nǐ hǎo

  correctAnswer: string; // "hello"

  options: string[]; // ["hello", "bye", "thanks"]

  //   translations: {
  //     en: string;
  //     ru: string;
  //     nl?: string;
  //   };
};
export type Level = {
  id: string;

  title: string; // "Level 1"
  description?: string;

  difficulty: 1 | 2 | 3 | 4 | 5;
  xpReward: number;
  questions: Question[];

  requiredToUnlock?: {
    levelId: string;
    minScore: number; // например 70%
  };
};

export const levels: Level[] = [
  {
    id: "level-1",
    title: "Basics 1",
    difficulty: 1,
    xpReward: 50,
    questions: [
      // приветствие + основы
      {
        id: "1",
        hanzi: "你好",
        pinyin: "nǐ hǎo",
        correctAnswer: "games.quiz.hello",
        options: [
          "games.quiz.hello",
          "games.quiz.goodbye",
          "games.quiz.thanks",
          "games.quiz.please",
        ],
      },
      {
        id: "2",
        hanzi: "谢谢",
        pinyin: "xièxie",
        correctAnswer: "games.quiz.thanks",
        options: [
          "games.quiz.thanks",
          "games.quiz.goodbye",
          "games.quiz.please",
          "games.quiz.sorry",
        ],
      },
      {
        id: "3",
        hanzi: "再见",
        pinyin: "zàijiàn",
        correctAnswer: "games.quiz.goodbye",
        options: [
          "games.quiz.goodbye",
          "games.quiz.hello",
          "games.quiz.yes",
          "games.quiz.no",
        ],
      },
      {
        id: "4",
        hanzi: "对不起",
        pinyin: "duìbuqǐ",
        correctAnswer: "games.quiz.sorry",
        options: [
          "games.quiz.sorry",
          "games.quiz.please",
          "games.quiz.thanks",
          "games.quiz.hello",
        ],
      },
      {
        id: "5",
        hanzi: "一",
        pinyin: "yī",
        correctAnswer: "games.quiz.one",
        options: [
          "games.quiz.one",
          "games.quiz.two",
          "games.quiz.three",
          "games.quiz.no",
        ],
      },
    ],
  },

  {
    id: "level-2",
    title: "Basics 1 (Part 2)",
    difficulty: 1,
    xpReward: 50,
    questions: [
      {
        id: "6",
        hanzi: "二",
        pinyin: "èr",
        correctAnswer: "games.quiz.two",
        options: [
          "games.quiz.one",
          "games.quiz.two",
          "games.quiz.three",
          "games.quiz.hello",
        ],
      },
      {
        id: "7",
        hanzi: "三",
        pinyin: "sān",
        correctAnswer: "games.quiz.three",
        options: [
          "games.quiz.two",
          "games.quiz.three",
          "games.quiz.one",
          "games.quiz.goodbye",
        ],
      },
      {
        id: "8",
        hanzi: "妈妈",
        pinyin: "māma",
        correctAnswer: "games.quiz.mom",
        options: [
          "games.quiz.mom",
          "games.quiz.dad",
          "games.quiz.hello",
          "games.quiz.sorry",
        ],
      },
      {
        id: "9",
        hanzi: "爸爸",
        pinyin: "bàba",
        correctAnswer: "games.quiz.dad",
        options: [
          "games.quiz.mom",
          "games.quiz.dad",
          "games.quiz.please",
          "games.quiz.thanks",
        ],
      },
      {
        id: "10",
        hanzi: "不",
        pinyin: "bù",
        correctAnswer: "games.quiz.no",
        options: [
          "games.quiz.yes",
          "games.quiz.no",
          "games.quiz.one",
          "games.quiz.goodbye",
        ],
      },
    ],
  },

  {
    id: "level-3",
    title: "Basics 2",
    difficulty: 1,
    xpReward: 50,
    questions: [
      {
        id: "1",
        hanzi: "看",
        pinyin: "kàn",
        correctAnswer: "games.quiz.see",
        options: [
          "games.quiz.see",
          "games.quiz.listen",
          "games.quiz.speak",
          "games.quiz.sit",
        ],
      },
      {
        id: "2",
        hanzi: "听",
        pinyin: "tīng",
        correctAnswer: "games.quiz.listen",
        options: [
          "games.quiz.see",
          "games.quiz.listen",
          "games.quiz.speak",
          "games.quiz.come",
        ],
      },
      {
        id: "3",
        hanzi: "说",
        pinyin: "shuō",
        correctAnswer: "games.quiz.speak",
        options: [
          "games.quiz.speak",
          "games.quiz.cook",
          "games.quiz.open",
          "games.quiz.buy",
        ],
      },
      {
        id: "4",
        hanzi: "做饭",
        pinyin: "zuòfàn",
        correctAnswer: "games.quiz.cook",
        options: [
          "games.quiz.cook",
          "games.quiz.sit",
          "games.quiz.sell",
          "games.quiz.can",
        ],
      },
      {
        id: "5",
        hanzi: "坐",
        pinyin: "zuò",
        correctAnswer: "games.quiz.sit",
        options: [
          "games.quiz.sit",
          "games.quiz.come",
          "games.quiz.open",
          "games.quiz.see",
        ],
      },
    ],
  },
  {
    id: "level-4",
    title: "Basics 2 (Part 2)",
    difficulty: 1,
    xpReward: 50,
    questions: [
      {
        id: "6",
        hanzi: "会",
        pinyin: "huì",
        correctAnswer: "games.quiz.can",
        options: [
          "games.quiz.can",
          "games.quiz.speak",
          "games.quiz.buy",
          "games.quiz.listen",
        ],
      },
      {
        id: "7",
        hanzi: "开",
        pinyin: "kāi",
        correctAnswer: "games.quiz.open",
        options: [
          "games.quiz.open",
          "games.quiz.sell",
          "games.quiz.cook",
          "games.quiz.sit",
        ],
      },
      {
        id: "8",
        hanzi: "来",
        pinyin: "lái",
        correctAnswer: "games.quiz.come",
        options: [
          "games.quiz.come",
          "games.quiz.see",
          "games.quiz.speak",
          "games.quiz.can",
        ],
      },
      {
        id: "9",
        hanzi: "买",
        pinyin: "mǎi",
        correctAnswer: "games.quiz.buy",
        options: [
          "games.quiz.buy",
          "games.quiz.sell",
          "games.quiz.open",
          "games.quiz.listen",
        ],
      },
      {
        id: "10",
        hanzi: "卖",
        pinyin: "mài",
        correctAnswer: "games.quiz.sell",
        options: [
          "games.quiz.buy",
          "games.quiz.sell",
          "games.quiz.cook",
          "games.quiz.come",
        ],
      },
    ],
  },
  {
    id: "level-5",
    title: "Family",
    difficulty: 2,
    xpReward: 50,
    questions: [
      {
        id: "1",
        hanzi: "妈妈",
        pinyin: "māma",
        correctAnswer: "games.quiz.mom",
        options: [
          "games.quiz.mom",
          "games.quiz.dad",
          "games.quiz.elderBrother",
          "games.quiz.elderSister",
        ],
      },
      {
        id: "2",
        hanzi: "爸爸",
        pinyin: "bàba",
        correctAnswer: "games.quiz.dad",
        options: [
          "games.quiz.mom",
          "games.quiz.dad",
          "games.quiz.son",
          "games.quiz.daughter",
        ],
      },
      {
        id: "3",
        hanzi: "哥哥",
        pinyin: "gēge",
        correctAnswer: "games.quiz.elderBrother",
        options: [
          "games.quiz.elderBrother",
          "games.quiz.youngerBrother",
          "games.quiz.son",
          "games.quiz.friend",
        ],
      },
      {
        id: "4",
        hanzi: "弟弟",
        pinyin: "dìdi",
        correctAnswer: "games.quiz.youngerBrother",
        options: [
          "games.quiz.elderBrother",
          "games.quiz.youngerBrother",
          "games.quiz.daughter",
          "games.quiz.dad",
        ],
      },
      {
        id: "5",
        hanzi: "姐姐",
        pinyin: "jiějie",
        correctAnswer: "games.quiz.elderSister",
        options: [
          "games.quiz.elderSister",
          "games.quiz.youngerSister",
          "games.quiz.mom",
          "games.quiz.people",
        ],
      },
    ],
  },
  {
    id: "level-6",
    title: "Family (Part 2)",
    difficulty: 2,
    xpReward: 50,
    questions: [
      {
        id: "6",
        hanzi: "妹妹",
        pinyin: "mèimei",
        correctAnswer: "games.quiz.youngerSister",
        options: [
          "games.quiz.elderSister",
          "games.quiz.youngerSister",
          "games.quiz.son",
          "games.quiz.friend",
        ],
      },
      {
        id: "7",
        hanzi: "儿子",
        pinyin: "érzi",
        correctAnswer: "games.quiz.son",
        options: [
          "games.quiz.son",
          "games.quiz.daughter",
          "games.quiz.dad",
          "games.quiz.youngerBrother",
        ],
      },
      {
        id: "8",
        hanzi: "女儿",
        pinyin: "nǚ'ér",
        correctAnswer: "games.quiz.daughter",
        options: [
          "games.quiz.son",
          "games.quiz.daughter",
          "games.quiz.mom",
          "games.quiz.elderSister",
        ],
      },
      {
        id: "9",
        hanzi: "朋友",
        pinyin: "péngyou",
        correctAnswer: "games.quiz.friend",
        options: [
          "games.quiz.friend",
          "games.quiz.people",
          "games.quiz.elderBrother",
          "games.quiz.dad",
        ],
      },
      {
        id: "10",
        hanzi: "人",
        pinyin: "rén",
        correctAnswer: "games.quiz.people",
        options: [
          "games.quiz.friend",
          "games.quiz.people",
          "games.quiz.youngerSister",
          "games.quiz.mom",
        ],
      },
    ],
  },
  {
    id: "level-7",
    title: "Numbers",
    difficulty: 1,
    xpReward: 50,
    questions: [
      {
        id: "1",
        hanzi: "四",
        pinyin: "sì",
        correctAnswer: "games.quiz.four",
        options: [
          "games.quiz.four",
          "games.quiz.five",
          "games.quiz.six",
          "games.quiz.three",
        ],
      },
      {
        id: "2",
        hanzi: "五",
        pinyin: "wǔ",
        correctAnswer: "games.quiz.five",
        options: [
          "games.quiz.four",
          "games.quiz.five",
          "games.quiz.nine",
          "games.quiz.two",
        ],
      },
      {
        id: "3",
        hanzi: "六",
        pinyin: "liù",
        correctAnswer: "games.quiz.six",
        options: [
          "games.quiz.seven",
          "games.quiz.six",
          "games.quiz.eight",
          "games.quiz.five",
        ],
      },
      {
        id: "4",
        hanzi: "七",
        pinyin: "qī",
        correctAnswer: "games.quiz.seven",
        options: [
          "games.quiz.one",
          "games.quiz.two",
          "games.quiz.seven",
          "games.quiz.nine",
        ],
      },
      {
        id: "5",
        hanzi: "八",
        pinyin: "bā",
        correctAnswer: "games.quiz.eight",
        options: [
          "games.quiz.eight",
          "games.quiz.six",
          "games.quiz.four",
          "games.quiz.three",
        ],
      },
    ],
  },
  {
    id: "level-8",
    title: "Numbers (Part 2)",
    difficulty: 1,
    xpReward: 50,
    questions: [
      {
        id: "6",
        hanzi: "九",
        pinyin: "jiǔ",
        correctAnswer: "games.quiz.nine",
        options: [
          "games.quiz.five",
          "games.quiz.seven",
          "games.quiz.eight",
          "games.quiz.nine",
        ],
      },
      {
        id: "7",
        hanzi: "个",
        pinyin: "gè",
        correctAnswer: "games.quiz.measureWord",
        options: [
          "games.quiz.measureWord",
          "games.quiz.one",
          "games.quiz.people",
          "games.quiz.three",
        ],
      },
      {
        id: "8",
        hanzi: "一个人",
        pinyin: "yí gè rén",
        correctAnswer: "games.quiz.onePerson",
        options: [
          "games.quiz.onePerson",
          "games.quiz.threePeople",
          "games.quiz.mom",
          "games.quiz.four",
        ],
      },
      {
        id: "9",
        hanzi: "三个",
        pinyin: "sān gè",
        correctAnswer: "games.quiz.threePieces",
        options: [
          "games.quiz.onePerson",
          "games.quiz.threePieces",
          "games.quiz.two",
          "games.quiz.five",
        ],
      },
      {
        id: "10",
        hanzi: "四个",
        pinyin: "sì gè",
        correctAnswer: "games.quiz.fourPieces",
        options: [
          "games.quiz.fourPieces",
          "games.quiz.threePieces",
          "games.quiz.eight",
          "games.quiz.six",
        ],
      },
    ],
  },
];
