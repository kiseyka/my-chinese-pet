// src/utils/gender.ts
//
// Русский текст под род пользователя. В тексте формы пишутся в фигурных скобках через
// черту: «Ты сегодня {пил|пила} воду?» — сначала мужская форма, потом женская.
//   male    → «пил»;
//   female  → «пила»;
//   не указан → нейтрально: «пил(а)» (если женская форма — мужская плюс окончание),
//               иначе «пил/пила».
// Род задаётся в профиле (тап по имени), см. store/profileStore.

export type Gender = "male" | "female";

const FORMS = /\{([^{}|]*)\|([^{}|]*)\}/g;

function neutral(male: string, female: string): string {
  if (female.startsWith(male)) return `${male}(${female.slice(male.length)})`;
  return `${male}/${female}`;
}

export function genderize(text: string, gender: Gender | null): string {
  if (!text.includes("{")) return text;
  return text.replace(FORMS, (_, male: string, female: string) =>
    gender === "male" ? male : gender === "female" ? female : neutral(male, female),
  );
}
