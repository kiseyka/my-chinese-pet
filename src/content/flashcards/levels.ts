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
    questions: [
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
    ],
  },

  {
    id: "level-2",
    title: "Basics 2",
    difficulty: 1,
    questions: [
      {
        id: "q2",
        hanzi: "谢谢",
        pinyin: "xièxie",
        correctAnswer: "thank you",
        options: ["thank you", "sorry", "please"],
        // translations: {
        //   en: "thank you",
        //   ru: "спасибо",
        // },
      },
    ],
  },

  {
    id: "3",
    title: "Basics 3",
    difficulty: 1,
    questions: [],
  },
];
