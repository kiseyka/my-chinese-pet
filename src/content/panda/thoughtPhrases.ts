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
  // Черновик от Claude — проверь, поправь или замени
  {
    id: "hungry",
    words: ["我", "饿", "了", "。"],
    ru: "Я проголодалась.",
    en: "I'm hungry.",
  },
  {
    id: "tea-together",
    words: ["我们", "一起", "喝", "茶", "吧", "！"],
    ru: "Давай вместе попьём чаю!",
    en: "Let's have some tea together!",
    pinyin: { 一起: "yì qǐ" },
  },
  {
    id: "rain-outside",
    words: ["外面", "下雨", "了", "。"],
    ru: "На улице пошёл дождь.",
    en: "It started raining outside.",
  },
  {
    id: "dress-warm",
    words: ["今天", "很", "冷", "，", "多", "穿", "衣服", "！"],
    ru: "Сегодня холодно, оденься потеплее!",
    en: "It's cold today, dress warmly!",
  },
  {
    id: "moon",
    words: ["我", "喜欢", "看", "月亮", "。"],
    ru: "Я люблю смотреть на луну.",
    en: "I like looking at the moon.",
  },
  {
    id: "rest",
    words: ["我们", "休息", "一会儿", "吧", "。"],
    ru: "Давай немного отдохнём.",
    en: "Let's rest for a bit.",
    pinyin: { 一会儿: "yí huìr" },
  },
  {
    id: "flower-smell",
    words: ["我", "的", "花", "很", "香", "。"],
    ru: "Мой цветок так приятно пахнет.",
    en: "My flower smells so nice.",
  },
  {
    id: "dumplings",
    words: ["我", "想", "吃", "饺子", "。"],
    ru: "Хочу пельменей.",
    en: "I want some dumplings.",
  },
  {
    id: "happy-today",
    words: ["我", "今天", "很", "高兴", "！"],
    ru: "Мне сегодня так радостно!",
    en: "I'm so happy today!",
  },
  {
    id: "thanks-study",
    words: ["谢谢", "你", "和", "我", "一起", "学习", "！"],
    ru: "Спасибо, что учишься вместе со мной!",
    en: "Thank you for studying with me!",
    pinyin: { 一起: "yì qǐ" },
  },
  {
    id: "no-rain",
    words: ["我", "不", "喜欢", "下雨", "。"],
    ru: "Я не люблю дождь.",
    en: "I don't like rain.",
  },
  {
    id: "what-color",
    words: ["你", "喜欢", "什么", "颜色", "？"],
    ru: "Какой цвет тебе нравится?",
    en: "What color do you like?",
  },
  {
    id: "green",
    words: ["我", "最", "喜欢", "绿色", "。"],
    ru: "Больше всего я люблю зелёный.",
    en: "Green is my favorite color.",
  },
  {
    id: "stars",
    words: ["晚上", "我们", "看", "星星", "吧", "。"],
    ru: "Вечером давай посмотрим на звёзды.",
    en: "Let's look at the stars tonight.",
  },
  {
    id: "cake",
    words: ["蛋糕", "很", "甜", "，", "我", "很", "喜欢", "！"],
    ru: "Торт сладкий, обожаю!",
    en: "Cake is sweet, I love it!",
  },
  {
    id: "not-hard",
    words: ["汉语", "不", "难", "！"],
    ru: "Китайский — это не сложно!",
    en: "Chinese isn't hard!",
  },
  {
    id: "reading-room",
    words: ["我", "在", "房间", "里", "看", "书", "。"],
    ru: "Я читаю книжку в комнате.",
    en: "I'm reading a book in my room.",
  },
  {
    id: "what-today",
    words: ["你", "今天", "想", "做", "什么", "？"],
    ru: "Что ты хочешь сегодня делать?",
    en: "What do you want to do today?",
  },
  {
    id: "write-name",
    words: ["我", "会", "写", "我", "的", "名字", "！"],
    ru: "Я умею писать своё имя!",
    en: "I can write my name!",
  },
  {
    id: "know-name",
    words: ["你", "知道", "我", "的", "名字", "吗", "？"],
    ru: "Ты знаешь, как меня зовут?",
    en: "Do you know my name?",
    pinyin: { 吗: "ma" },
  },
  {
    id: "our-room",
    words: ["我", "很", "喜欢", "我们", "的", "房间", "。"],
    ru: "Мне очень нравится наша комната.",
    en: "I really like our room.",
  },
  {
    id: "park-walk",
    words: ["我", "想", "去", "公园", "散步", "。"],
    ru: "Хочу погулять в парке.",
    en: "I want to go for a walk in the park.",
  },
  {
    id: "fruit",
    words: ["苹果", "好吃", "，", "香蕉", "也", "好吃", "！"],
    ru: "Яблоки вкусные, и бананы тоже!",
    en: "Apples are tasty, and bananas too!",
  },
  {
    id: "sunny",
    words: ["今天", "的", "太阳", "真", "好", "。"],
    ru: "Сегодня такое хорошее солнышко.",
    en: "The sun is so nice today.",
  },
  {
    id: "hanzi-pretty",
    words: ["汉字", "很", "漂亮", "。"],
    ru: "Иероглифы такие красивые.",
    en: "Chinese characters are so beautiful.",
  },
  {
    id: "cute-sleeping",
    words: ["我", "睡觉", "的", "时候", "很", "可爱", "吗", "？"],
    ru: "Я милая, когда сплю?",
    en: "Am I cute when I sleep?",
    pinyin: { 吗: "ma" },
  },
  {
    id: "good-friend",
    words: ["你", "是", "我", "的", "好", "朋友", "。"],
    ru: "Ты мой хороший друг.",
    en: "You're my good friend.",
  },
  {
    id: "see-tomorrow",
    words: ["明天见", "！"],
    ru: "До завтра!",
    en: "See you tomorrow!",
  },
  {
    id: "snow-outside",
    words: ["下雪", "了", "！", "我们", "出去", "吧", "！"],
    ru: "Пошёл снег! Пойдём на улицу!",
    en: "It's snowing! Let's go outside!",
  },
];

const byId = new Map(pandaPhrases.map((phrase) => [phrase.id, phrase]));

export function findPandaPhrase(id: string): PandaPhrase | undefined {
  return byId.get(id);
}
