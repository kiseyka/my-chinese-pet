/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        parchment: "#F3EFE2",
        card: "#ECE5D5",
        cardBorder: "#B7AB97",
        textPrimary: "#2C241E",
        accent: "#7D2619",
      },
    },
  },
  plugins: [],
};
