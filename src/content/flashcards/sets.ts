import { animals } from "./data/animals";
import { body } from "./data/body";
import { clothing } from "./data/clothing";
import { colors } from "./data/colors";
import { directions } from "./data/directions";
import { family } from "./data/family";
import { food } from "./data/food";
import { greetings } from "./data/greetings";
import { hobbies } from "./data/hobbies";
import { house } from "./data/house";
import { numbers } from "./data/numbers";
import { places } from "./data/places";
import { professions } from "./data/professions";
import { time } from "./data/time";
import { transportation } from "./data/transportation";
import { weather } from "./data/weather";
import { PracticeSet } from "./types";

export const practiceSets: PracticeSet[] = [
  {
    id: "greetings",
    title: "title.greetings",
    description: "description.greetings",
    xpReward: 10,
    words: greetings,
    image: require("@/assets/images/sets/greetings.png"),
  },
  {
    id: "numbers",
    title: "title.numbers",
    description: "description.numbers",
    xpReward: 10,
    words: numbers,
    image: require("@/assets/images/sets/numbers.png"),
  },
  {
    id: "family",
    title: "title.family",
    description: "description.family",
    xpReward: 10,
    words: family,
    image: require("@/assets/images/sets/family.png"),
  },
  {
    id: "animals",
    title: "title.animals",
    description: "description.animals",
    xpReward: 10,
    words: animals,
    image: require("@/assets/images/sets/animals.png"),
  },
  {
    id: "food",
    title: "title.food",
    description: "description.food",
    xpReward: 10,
    words: food,
    image: require("@/assets/images/sets/food.png"),
  },
  {
    id: "clothing",
    title: "title.clothing",
    description: "description.clothing",
    xpReward: 10,
    words: clothing,
    image: require("@/assets/images/sets/clothing.png"),
  },
  {
    id: "weather",
    title: "title.weather",
    description: "description.weather",
    xpReward: 10,
    words: weather,
    image: require("@/assets/images/sets/clothing.png"),
  },
  {
    id: "colors",
    title: "title.colors",
    description: "description.colors",
    xpReward: 10,
    words: colors,
    image: require("@/assets/images/sets/clothing.png"),
  },
  {
    id: "transportation",
    title: "title.transportation",
    description: "description.transportation",
    xpReward: 10,
    words: transportation,
    image: require("@/assets/images/sets/clothing.png"),
  },
  {
    id: "house",
    title: "title.house",
    description: "description.house",
    xpReward: 10,
    words: house,
    image: require("@/assets/images/sets/clothing.png"),
  },
  {
    id: "body",
    title: "title.body",
    description: "description.body",
    xpReward: 10,
    words: body,
    image: require("@/assets/images/sets/clothing.png"),
  },
  {
    id: "hobbies",
    title: "title.hobbies",
    description: "description.hobbies",
    xpReward: 10,
    words: hobbies,
    image: require("@/assets/images/sets/clothing.png"),
  },
  {
    id: "time",
    title: "title.time",
    description: "description.time",
    xpReward: 10,
    words: time,
    image: require("@/assets/images/sets/clothing.png"),
  },
  {
    id: "professions",
    title: "title.professions",
    description: "description.professions",
    xpReward: 10,
    words: professions,
    image: require("@/assets/images/sets/clothing.png"),
  },
  {
    id: "places",
    title: "title.places",
    description: "description.places",
    xpReward: 10,
    words: places,
    image: require("@/assets/images/sets/clothing.png"),
  },
  {
    id: "directions",
    title: "title.directions",
    description: "description.directions",
    xpReward: 10,
    words: directions,
    image: require("@/assets/images/sets/clothing.png"),
  },
];
