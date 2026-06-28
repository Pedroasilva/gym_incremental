// Game balancing parameters — fine-tuning lives here.
export const BALANCE = {
  clickPower: 10, // effort added per click
  baseCost: 5, // multiplies weight to define the cost of the 1st rep
  decay: 0.92, // each rep gets ~8% easier (the core mechanic)
  decayCap: 28, // warm-up rep limit (cost never reaches zero)
  fatiguePerRepFactor: 0.35, // fatigue per rep = weight * factor
  fatigueMax: 100,
  fatigueRecoverPerSec: 6, // fatigue recovery (idle) per second
  xpPerRepFactor: 1.0, // xp per rep = weight * factor * globalMultiplier
  levelBase: 100, // xp needed at level 0
  levelGrowth: 1.15, // nextXp = levelBase * growth^level
  autoBaseCost: 200, // cost to hire the first Auto-Trainer level
  autoCostGrowth: 2, // each level doubles the cost
  autoMaxLevel: 8, // cap on Auto-Trainer levels
  autoClicksPerLevel: 2, // automatic pushes per second per level
};

export type Muscle =
  | "core"
  | "legs"
  | "chest"
  | "arms"
  | "back"
  | "fullbody";

export interface Exercise {
  id: string;
  name: string;
  muscle: Muscle;
  unlockLevel: number;
  weights: number[]; // available weights (kg)
}

export const EXERCISES: Exercise[] = [
  { id: "crunch", name: "Crunch", muscle: "core", unlockLevel: 0, weights: [0, 5, 10, 15] },
  { id: "squat", name: "Squat", muscle: "legs", unlockLevel: 0, weights: [10, 20, 30, 40] },
  { id: "benchpress", name: "Bench Press", muscle: "chest", unlockLevel: 3, weights: [20, 30, 40, 60] },
  { id: "triceps", name: "Triceps", muscle: "arms", unlockLevel: 5, weights: [10, 15, 20, 30] },
  { id: "legpress", name: "Leg Press", muscle: "legs", unlockLevel: 7, weights: [60, 100, 140, 200] },
  { id: "curl", name: "Biceps Curl", muscle: "arms", unlockLevel: 8, weights: [12, 18, 26, 36] },
  { id: "row", name: "Row", muscle: "back", unlockLevel: 10, weights: [30, 45, 60, 80] },
  { id: "deadlift", name: "Deadlift", muscle: "fullbody", unlockLevel: 15, weights: [60, 100, 160, 240] },
];

export const MUSCLES: { id: Muscle; name: string }[] = [
  { id: "core", name: "Core" },
  { id: "legs", name: "Legs" },
  { id: "chest", name: "Chest" },
  { id: "arms", name: "Arms" },
  { id: "back", name: "Back" },
  { id: "fullbody", name: "Full Body" },
];
