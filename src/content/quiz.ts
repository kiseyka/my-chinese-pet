type QuizQuestion = {
  id: string;
  question: string; // 你好
  pinyin: string; // nǐ hǎo
  correctAnswer: string; // "hello"
  options: string[];
};

export const quizData: QuizQuestion[] = [
  {
    id: "1",
    question: "你好",
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
    question: "谢谢",
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
    question: "再见",
    pinyin: "zàijiàn",
    correctAnswer: "games.quiz.goodbye",
    options: [
      "games.quiz.goodbye",
      "games.quiz.hello",
      "games.quiz.yes",
      "games.quiz.no",
    ],
  },
];
