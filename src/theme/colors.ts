// src/theme/colors.ts
const tailwindConfig = require("../../tailwind.config.js");

export const colors = tailwindConfig.theme.extend.colors as {
  background: string;
  surface: string;
  primary: string;
  primaryDark: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  accentOlive: string;
  accentBeige: string;
  progress: { active: string; inactive: string };
};
