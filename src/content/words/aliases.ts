// src/content/words/aliases.ts
//
// Слова, которые раньше были заведены дважды под разными id.
// Ключ — старый (лишний) id, значение — id, который остаётся.
// Прогресс по старому id переносится на новый при запуске приложения.

export const wordAliases: Record<string, string> = {
  food_fish_food: "animals_fish",
  transportation_measure_ci: "time_measure_ci",
  hobbies_television: "house_television",
  hobbies_computer: "house_computer",
  hobbies_book: "house_book",
  body_hospital: "places_hospital",
  body_doctor: "professions_doctor",
};
