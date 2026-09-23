// src/content/pandaGreetings.ts
type GreetingContext = {
  hoursSinceLastVisit: number | null; // null = первый запуск приложения
  timeOfDay: "morning" | "day" | "evening" | "night";
};
const GREETINGS = [
  {
    title: "Привет",
  },
  {
    title: "Здравствуй!",
  },
];

const pick = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

export function getPandaGreeting(ctx: GreetingContext) {
  return pick(GREETINGS);
}
