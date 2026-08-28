import { animals } from "./animals";
import { body } from "./body";
import { clothing } from "./clothing";
import { colors } from "./colors";
import { directions } from "./directions";
import { family } from "./family";
import { food } from "./food";
import { greetings } from "./greetings";
import { hobbies } from "./hobbies";
import { house } from "./house";
import { numbers } from "./numbers";
import { places } from "./places";
import { professions } from "./professions";
import { time } from "./time";
import { transportation } from "./transportation";
import { weather } from "./weather";

const addVocabularyId = <T extends { id: string }>(
  words: T[],
  setId: string,
) => {
  return words.map((word) => ({
    ...word,
    vocabularyId: `${setId}_${word.id}`,
  }));
};

export const allWords = [
  ...addVocabularyId(animals, "animals"),
  ...addVocabularyId(body, "body"),
  ...addVocabularyId(clothing, "clothing"),
  ...addVocabularyId(colors, "colors"),
  ...addVocabularyId(directions, "directions"),
  ...addVocabularyId(family, "family"),
  ...addVocabularyId(food, "food"),
  ...addVocabularyId(greetings, "greetings"),
  ...addVocabularyId(hobbies, "hobbies"),
  ...addVocabularyId(house, "house"),
  ...addVocabularyId(numbers, "numbers"),
  ...addVocabularyId(places, "places"),
  ...addVocabularyId(professions, "professions"),
  ...addVocabularyId(time, "time"),
  ...addVocabularyId(transportation, "transportation"),
  ...addVocabularyId(weather, "weather"),
];
