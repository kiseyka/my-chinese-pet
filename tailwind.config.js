/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#F7F4ED",
        backgroundPrimary: "#B54230",

        primary: "#A03927",
        // primary: "#7D2619",
        primaryDark: "#5E1D13",

        text: "#3C3730",
        textSecondary: "#E2D9CD",

        border: "#B5AD9F",

        progress: {
          active: "#B54230",
          inactive: "#BDB4A0",
        },

        // success: "#4A7C59",
        // error: "#B54230",
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
