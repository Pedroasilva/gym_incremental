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
  liftCapBase: 20, // base of the strength-derived max-lift cap
  liftCapSlope: 2, // cap grows with sqrt(strength): base + sqrt(strength)*slope
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
  minWeight: number; // lightest selectable weight (kg)
  step: number; // − / + increment (kg)
  liftFactor: number; // scales the strength-derived max-lift cap for this lift
}

// Weight is continuous: − / + adjust by `step`, capped at the strength-derived
// max lift (see Game.maxLift). Heavier-capable lifts have a bigger liftFactor.
export const EXERCISES: Exercise[] = [
  { id: "crunch", name: "Crunch", muscle: "core", unlockLevel: 0, minWeight: 0, step: 5, liftFactor: 0.5 },
  { id: "squat", name: "Squat", muscle: "legs", unlockLevel: 0, minWeight: 10, step: 5, liftFactor: 1.0 },
  { id: "benchpress", name: "Bench Press", muscle: "chest", unlockLevel: 3, minWeight: 20, step: 5, liftFactor: 0.9 },
  { id: "triceps", name: "Triceps", muscle: "arms", unlockLevel: 5, minWeight: 10, step: 5, liftFactor: 0.6 },
  { id: "legpress", name: "Leg Press", muscle: "legs", unlockLevel: 7, minWeight: 40, step: 10, liftFactor: 3.0 },
  { id: "curl", name: "Biceps Curl", muscle: "arms", unlockLevel: 8, minWeight: 10, step: 5, liftFactor: 0.55 },
  { id: "row", name: "Row", muscle: "back", unlockLevel: 10, minWeight: 20, step: 5, liftFactor: 1.0 },
  { id: "deadlift", name: "Deadlift", muscle: "fullbody", unlockLevel: 15, minWeight: 40, step: 10, liftFactor: 2.2 },
];

export const MUSCLES: { id: Muscle; name: string }[] = [
  { id: "core", name: "Core" },
  { id: "legs", name: "Legs" },
  { id: "chest", name: "Chest" },
  { id: "arms", name: "Arms" },
  { id: "back", name: "Back" },
  { id: "fullbody", name: "Full Body" },
];
