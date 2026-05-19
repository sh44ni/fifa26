export interface VotingOption {
  id: number;
  name: string;
  first: number;
  second: number;
  third: number;
  fourth: number;
}

export const VOTING_OPTIONS: VotingOption[] = [
  { id: 1,  name: "Champion Takes Most", first: 3600, second: 700,  third: 300, fourth: 200 },
  { id: 2,  name: "Champion Heavy",      first: 3400, second: 800,  third: 400, fourth: 200 },
  { id: 3,  name: "Top Prize Power",     first: 3300, second: 1000, third: 300, fourth: 200 },
  { id: 4,  name: "Champion First",      first: 3200, second: 1000, third: 400, fourth: 200 },
  { id: 5,  name: "Strong Champion",     first: 3100, second: 1100, third: 400, fourth: 200 },
  { id: 6,  name: "Strong Runner-Up",    first: 3000, second: 1200, third: 400, fourth: 200 },
  { id: 7,  name: "Clean Split",         first: 3000, second: 1000, third: 500, fourth: 300 },
  { id: 8,  name: "Third Place Boost",   first: 3000, second: 900,  third: 600, fourth: 300 },
  { id: 9,  name: "Balanced Top Two",    first: 2900, second: 1200, third: 500, fourth: 200 },
  { id: 10, name: "Fair Final Four",     first: 2800, second: 1200, third: 500, fourth: 300 },
];

export const TOTAL_POT = 4800;
