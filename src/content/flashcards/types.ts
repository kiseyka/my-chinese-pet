import { ImageSourcePropType } from "react-native";

export type Word = {
  id: string;
  hanzi: string;
  pinyin: string;
  translation: string;
};

export type PracticeSet = {
  id: string;
  title: string;
  description?: string;
  words: Word[];
  xpReward: number;
  image: ImageSourcePropType;
};

export type QuizQuestion = {
  id: string;
  hanzi: string;
  pinyin: string;
  correctAnswer: string;
  options: string[];
};
