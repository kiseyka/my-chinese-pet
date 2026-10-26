/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Основной фон (светло-бежевый/кремовый)
        background: "#EEE4D8",

        // Фон подложек (карточки, модалки) — чистый белый
        surface: "#FCF7F3",

        // Основной оливково-серый цвет (используется для активных кнопок, прогресс-бара, активных иконок)
        primary: "#78826D",
        primaryDark: "#78826D", // Для нажатых состояний

        // Текстовые цвета
        text: "#4A4A4A", // Основной текст (темно-серый, почти черный)
        textSecondary: "#6E675E", // Вторичный текст (тёплый серый, для подписей и неактивных элементов); был #A3A3A3 — плохо читался на бежевом

        // Цвета границ и разделителей (очень светлый бежевый)
        border: "#E5E0D8",
        error: "#B54230", // неверный ответ
        // Акценты (цвета кнопок внизу)
        accentOlive: "#B2B8A5", // Кнопка "ТРЕНИРОВКИ" (оливковая)
        accentBeige: "#EBDCC5", // Кнопка "МАГАЗИН" (бежевая)
        // Изученное слово: шалфей — оливковый тон в одной гамме с primary,
        // заметный на бежевом фоне (песочный #F3E6CF сливался с background)
        learned: "#DFE5D3",
        // Рамка изученного: тот же шалфей темнее. Не primary — иначе изученное
        // и «Повторение» (рамка primary) отличались бы только фоном
        learnedBorder: "#B9C4A8",
        // Прогресс-бар
        progress: {
          active: "#9EA792", // Заливка (оливковый)
          inactive: "#DCD6CC", // Пустая часть
        },
      },
      fontFamily: {
        nunito: ["NunitoRegular"],
        nunitoMedium: ["NunitoMedium"],
        nunitoBold: ["NunitoBold"],
        chinese: ["NotoSansSC"],
        chineseMedium: ["NotoSansSCMedium"],
        chineseBold: ["NotoSansSCBold"],
      },
      // Шкала размеров текста. Ориентиры: основной текст iOS — 17, Android — 16;
      // мельче 12 не используем. Иероглифы и пиньинь — компоненты Hanzi и Pinyin
      // (src/components/ui), у них свои размеры.
      fontSize: {
        caption: ["12px", { lineHeight: "16px" }], // служебное: «3/10», бейджи
        small: ["14px", { lineHeight: "20px" }], // вторичные подписи
        body: ["16px", { lineHeight: "24px" }], // основной текст, пояснения, кнопки
        lead: ["18px", { lineHeight: "26px" }], // крупный текст: перевод слова, важные фразы
        title: ["22px", { lineHeight: "28px" }], // заголовки блоков
        heading: ["28px", { lineHeight: "34px" }], // заголовки экранов
      },
    },
  },
  plugins: [],
};
