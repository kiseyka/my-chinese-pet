import { animals } from "./data/animals";
import { clothing } from "./data/clothing";
import { family } from "./data/family";
import { food } from "./data/food";
import { greetings } from "./data/greetings";
import { numbers } from "./data/numbers";
import { PracticeSet } from "./types";

export const practiceSets: PracticeSet[] = [
  {
    id: "greetings",
    title: "games.flashcards.categories.greetings",
    description: "Learn basic Chinese greetings.",
    xpReward: 50,
    words: greetings,
    image: require("@/assets/images/sets/greetings.png"),
  },

  {
    id: "numbers",
    title: "games.flashcards.categories.numbers",
    description: "Learn basic Chinese numbers.",
    xpReward: 50,
    words: numbers,
    image: require("@/assets/images/sets/numbers.png"),
  },

  {
    id: "family",
    title: "games.flashcards.categories.family",
    description: "Family members and relationships.",
    xpReward: 75,
    words: family,
    image: require("@/assets/images/sets/family.png"),
  },
  {
    id: "animals",
    title: "games.flashcards.categories.animals",
    description: "Family members and relationships.",
    xpReward: 75,
    words: animals,
    image: require("@/assets/images/sets/animals.png"),
  },
  {
    id: "food",
    title: "games.flashcards.categories.food",
    description: "Family members and relationships.",
    xpReward: 75,
    words: food,
    image: require("@/assets/images/sets/food.png"),
  },
  {
    id: "clothing",
    title: "games.flashcards.categories.clothing",
    description: "Family members and relationships.",
    xpReward: 75,
    words: clothing,
    image: require("@/assets/images/sets/clothing.png"),
  },
];
