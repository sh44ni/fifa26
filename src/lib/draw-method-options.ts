export interface DrawMethodOption {
  id: number;
  name: string;
  description: string;
  emoji: string;
}

export const DRAW_METHOD_OPTIONS: DrawMethodOption[] = [
  {
    id: 1,
    name: "Red & Blue Balls",
    description:
      "Teams are drawn using both red and blue balls for group placement and matchup determination.",
    emoji: "🔴🔵",
  },
  {
    id: 2,
    name: "Red Balls Only",
    description:
      "Teams are drawn using only red balls for a simpler, single-colour draw process.",
    emoji: "🔴",
  },
];
