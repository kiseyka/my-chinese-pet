// src/content/panda/thoughtPhrases.ts
//
// ФРАЗЫ ПАНДЫ — короткие фразы на китайском, которые панда говорит, когда пользователь
// тапает по облачку «…» (см. utils/panda/thoughts.ts).
//
// Как добавить фразу:
//   id     — любой уникальный ключ, после выхода НЕ МЕНЯТЬ (по нему помнится, какие фразы
//            уже были и какие лежат в коллекции профиля);
//   words  — фраза по словам, как в словаре (好看, а не 好 + 看); знаки препинания —
//            отдельными элементами. Склеенные words — это и есть фраза;
//   ru, en — перевод (под кнопкой «Покажи перевод»);
//   pinyin — только если пиньинь слова во фразе отличается от словаря
//            (изменение тона: { "一个": "yí gè" }). Остальное берётся из словаря.
//
// Панда покажет фразу, только когда у пользователя есть хотя бы 1 точка (перевода
// или письма) у каждого её слова. Проверка: node scripts/check-panda-phrases.mjs
// (слова, которых нет в словаре, и склейку).

export interface PandaPhrase {
  id: string;
  words: string[];
  ru: string;
  en: string;
  pinyin?: Record<string, string>;
}

// Тестовые фразы — замени своими
export const pandaPhrases: PandaPhrase[] = [
  {
    id: "flower-pretty",
    words: ["我", "的", "花", "很", "好看", "。"],
    ru: "Мой цветок очень красивый.",
    en: "My flower is very pretty.",
  },
  {
    id: "drank-water",
    words: ["你", "今天", "喝", "水", "了", "吗", "？"],
    ru: "Ты сегодня пил воду?",
    en: "Have you had water today?",
    pinyin: { 吗: "ma" },
  },
  {
    id: "like-rice",
    words: ["我", "喜欢", "吃", "米饭", "。"],
    ru: "Я люблю есть рис.",
    en: "I like eating rice.",
  },
  {
    id: "weather-good",
    words: ["今天", "天气", "很", "好", "。"],
    ru: "Сегодня хорошая погода.",
    en: "The weather is nice today.",
  },
];

const byId = new Map(pandaPhrases.map((phrase) => [phrase.id, phrase]));

export function findPandaPhrase(id: string): PandaPhrase | undefined {
  return byId.get(id);
}
