/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Основной фон (светло-бежевый/кремовый)
        background: "#F4F0E9",

        // Фон подложек (карточки, модалки) — чистый белый
        surface: "#FFFFFF",

        // Основной оливково-серый цвет (используется для активных кнопок, прогресс-бара, активных иконок)
        primary: "#9EA792",
        primaryDark: "#78826D", // Для нажатых состояний

        // Текстовые цвета
        text: "#4A4A4A", // Основной текст (темно-серый, почти черный)
        textSecondary: "#A3A3A3", // Вторичный текст (серый, для подписей и неактивных элементов)

        // Цвета границ и разделителей (очень светлый бежевый)
        border: "#E5E0D8",

        // Акценты (цвета кнопок внизу)
        accentOlive: "#B2B8A5", // Кнопка "ТРЕНИРОВКИ" (оливковая)
        accentBeige: "#EBDCC5", // Кнопка "МАГАЗИН" (бежевая)

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
    },
  },
  plugins: [],
};
