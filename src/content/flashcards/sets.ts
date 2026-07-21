import { family } from "./data/family";
import { greetings } from "./data/greetings";
import { numbers } from "./data/numbers";
import { PracticeSet } from "./types";

export const practiceSets: PracticeSet[] = [
  {
    id: "greetings",
    title: "Greetings",
    description: "Common greetings and polite expressions.",
    xpReward: 50,
    words: greetings,
  },

  {
    id: "numbers",
    title: "Numbers",
    description: "Learn basic Chinese numbers.",
    xpReward: 50,
    words: numbers,
  },

  {
    id: "family",
    title: "Family",
    description: "Family members and relationships.",
    xpReward: 75,
    words: family,
  },
];
