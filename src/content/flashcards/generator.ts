import { shuffle } from "./shuffle";
import { QuizQuestion, Word } from "./types";

const QUESTIONS_PER_SESSION = 10;

export function generateQuiz(words: Word[]): QuizQuestion[] {
  if (words.length < 4) {
    throw new Error(
      "A Practice Set must contain at least 4 words to generate a quiz.",
    );
  }

  // Если слов больше 10 — берём 10 случайных.
  // Если слов 10 или меньше — берём все.
  const selectedWords = shuffle(words).slice(0, QUESTIONS_PER_SESSION);

  return selectedWords.map((word) => {
    // Неправильные ответы берём из всего сета,
    // чтобы варианты были разнообразнее.
    const otherWords = words.filter((otherWord) => otherWord.id !== word.id);

    const wrongAnswers = shuffle(otherWords)
      .slice(0, 3)
      .map((otherWord) => otherWord.translation);

    const options = shuffle([word.translation, ...wrongAnswers]);

    return {
      id: word.id,
      hanzi: word.hanzi,
      pinyin: word.pinyin,
      correctAnswer: word.translation,
      options,
    };
  });
}
