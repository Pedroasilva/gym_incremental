// Permanent prestige upgrades bought with Protein 🥤. They persist across every
// New Season reset (like Protein itself) and stack with gear / food buffs. Several
// of them specifically tame the game's negative effects (fatigue, anabolic side
// effects, hunger drain), so spending Protein is how you smooth out the downsides.
export interface PrestigeUpgrade {
  id: string;
  name: string;
  emoji: string;
  maxLevel: number;
  cost: (level: number) => number; // Protein to go from `level` to `level + 1`
  desc: (level: number) => string; // effect summary at the given (current) level
}

export const PRESTIGE_UPGRADES: PrestigeUpgrade[] = [
  {
    id: "synthesis",
    name: "Protein Synthesis",
    emoji: "🥤",
    maxLevel: 20,
    cost: (l) => l + 1,
    desc: (l) => `+${l * 10}% to all gains`,
  },
  {
    id: "metabolism",
    name: "Iron Metabolism",
    emoji: "🔥",
    maxLevel: 5,
    cost: (l) => 2 + l * 2,
    desc: (l) => `−${l * 8}% fatigue build-up per rep`,
  },
  {
    id: "liver",
    name: "Clean Liver",
    emoji: "🧬",
    maxLevel: 5,
    cost: (l) => 2 + l * 2,
    desc: (l) => `−${l * 15}% anabolic side effects`,
  },
  {
    id: "stomach",
    name: "Cast-Iron Stomach",
    emoji: "🍽️",
    maxLevel: 5,
    cost: (l) => 2 + l * 2,
    desc: (l) => `−${l * 10}% hunger drain over time`,
  },
  {
    id: "hustle",
    name: "Hustle",
    emoji: "💼",
    maxLevel: 5,
    cost: (l) => 3 + l * 2,
    desc: (l) => `+${l * 12}% job & competition money`,
  },
  {
    id: "power",
    name: "Powerlifter",
    emoji: "💪",
    maxLevel: 5,
    cost: (l) => 3 + l * 2,
    desc: (l) => `+${l * 8}% effort per click`,
  },
  {
    id: "showman",
    name: "Showman",
    emoji: "🎤",
    maxLevel: 5,
    cost: (l) => 2 + l * 2,
    desc: (l) => `+${l * 4} stage conditioning`,
  },
  {
    id: "recovery",
    name: "Quick Recovery",
    emoji: "⏱️",
    maxLevel: 5,
    cost: (l) => 2 + l * 2,
    desc: (l) => `−${l * 8}% rest time between sets`,
  },
  {
    id: "joints",
    name: "Titanium Joints",
    emoji: "🦴",
    maxLevel: 5,
    cost: (l) => 3 + l * 2,
    desc: (l) => `+${l * 6}% max lift`,
  },
  {
    id: "seedmoney",
    name: "Seed Money",
    emoji: "💰",
    maxLevel: 5,
    cost: (l) => 3 + l * 2,
    desc: (l) => `start each New Season with +$${l * 250}`,
  },
];
