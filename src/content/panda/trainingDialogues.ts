export type PandaDialogueOption = {
  id: string;
  text: string;
  pandaReply: string;
};

export type PandaDialogue = {
  id: string;
  title: string;
  subtitle: string;
  options: PandaDialogueOption[];
};

export const trainingDialogues: Record<string, PandaDialogue> = {
  toneTrainingFirst: {
    id: "toneTrainingFirst",
    title: "О, ты только что потренировалась с тонами!",
    subtitle: "Как тебе показалось?",
    options: [
      {
        id: "easy",
        text: "Было легко!",
        pandaReply:
          "Правда? Тогда в следующий раз я дам тебе задачку посложнее! 🐼",
      },
      {
        id: "hard",
        text: "Было сложно...",
        pandaReply:
          "Не расстраивайся. Тоны поначалу действительно могут путаться. Давай попробуем ещё раз вместе!",
      },
    ],
  },

  characterWritingFirst: {
    id: "characterWritingFirst",
    title: "Ты потренировалась писать иероглифы!",
    subtitle: "Мне понравилось смотреть, как ты стараешься.",
    options: [
      {
        id: "good",
        text: "Мне тоже понравилось!",
        pandaReply:
          "Тогда мы обязательно будем писать ещё! Мне нравится, когда ты не боишься ошибок.",
      },
      {
        id: "difficult",
        text: "Получалось не очень...",
        pandaReply:
          "Это нормально. Иероглифы не обязаны получаться идеально с первого раза.",
      },
    ],
  },
};
