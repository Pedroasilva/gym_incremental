// Game balancing parameters — fine-tuning lives here.
export const BALANCE = {
  clickPower: 10, // effort added per click
  baseCost: 5, // multiplies weight to define the cost of the 1st rep
  decay: 0.92, // each rep gets ~8% easier (the core mechanic)
  decayCap: 28, // warm-up rep limit (cost never reaches zero)
  fatiguePerRepFactor: 0.35, // fatigue per rep = weight * factor
  fatigueMax: 100,
  fatiguePenaltyMax: 0.5, // max effort-per-click penalty at full fatigue (0.5 = -50%)
  fatigueRecoverPerSec: 6, // fatigue recovery (idle) per second
  repsPerSet: 12, // reps that make up one set (série) — like a real routine
  restSeconds: 20, // forced rest between sets, per muscle (the pause)
  setStrengthBase: 30, // bonus strength XP per completed set (+ weight scaling)
  setStrengthWeight: 4, // extra set-bonus XP per kg lifted
  setConditionGain: 1.5, // conditioning earned per completed set (the routine pays off)
  setConditionMax: 30, // cap on conditioning earned from doing sets
  healthDrainBase: 0.06, // health lost per rep (overtraining)
  healthDrainWeight: 0.003, // extra health lost per rep, scaled by weight
  starveHealthDrain: 2, // health lost per second while hunger is at 0 (starving)
  collapseHealth: 10, // health at/below this forces an emergency hospitalization
  collapseSeconds: 60, // forced recovery lockout (no training) while hospitalized
  collapseLoss: 0.2, // fraction of gains (strength, level, conditioning) lost on collapse
  xpPerRepFactor: 1.0, // xp per rep = weight * factor * globalMultiplier
  levelBase: 100, // xp needed at level 0
  levelGrowth: 1.15, // nextXp = levelBase * growth^level
  liftCapBase: 20, // base of the strength-derived max-lift cap
  liftCapSlope: 2, // cap grows with sqrt(strength): base + sqrt(strength)*slope
  autoBaseCost: 200, // cost to hire the first Auto-Trainer level
  autoCostGrowth: 2, // each level doubles the cost
  autoMaxLevel: 8, // cap on Auto-Trainer levels
  autoClicksPerLevel: 2, // automatic pushes per second per level
  agentBaseCost: 500, // cost to hire the first Business Agent level (auto-work)
  agentCostGrowth: 1.8, // each level multiplies the cost
  agentMaxLevel: 7, // cap on Business Agent levels (interval reaches the minimum here)
  agentIntervalStart: 120, // seconds between auto-jobs at level 1
  agentIntervalStep: 15, // each level shortens the interval by this many seconds
  agentIntervalMin: 30, // floor on the auto-job interval
  agentFoodCost: 6, // hunger burned per auto-job when the chosen job needs food
  offlineCapSeconds: 8 * 3600, // max idle time simulated on return (8h) — "welcome back"
  chefCost: 450, // one-time cost to hire the Personal Chef (auto-feeds you)
  chefHungerThreshold: 10, // chef auto-buys the marked food when hunger drops below this
  // Endless Olympia (post-Arnold infinite endgame): each stage is a tougher field
  // and a bigger purse. Numbers picked to start just above the Arnold and scale up.
  endlessFieldSize: 5, // elite rivals per endless stage
  endlessBaseTier: 4300, // rival mass tier at stage 1 (Arnold's Zeus is ~3900)
  endlessGrowth: 1.16, // rival tier ×this per stage
  endlessPrizeBase: 12000, // prize for clearing stage 1
  endlessPrizeGrowth: 1.22, // prize ×this per stage
  endlessEntryBase: 1200, // entry fee at stage 1
  endlessEntryGrowth: 1.18, // entry fee ×this per stage
  rematchFullWins: 5, // this many wins per show pay the FULL prize before any decay
  rematchBase: 0.5, // first diminished win (after the grace window) pays this fraction
  rematchDecay: 0.7, // each further win pays this fraction of the previous one
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
  requiresAchievement?: string; // also gated behind this achievement id (beyond level)
  requiresStrength?: number; // also gated behind reaching this much accumulated strength
  gainMult?: number; // multiplies XP + physique per rep (1 = normal)
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
  // Ultimate lift — unlocked only by the "Olympian Legend" achievement (Endless stage 10).
  // Full-body, huge cap, and a big gain multiplier so it out-earns every other exercise.
  { id: "benchworld", name: "Bench the World", muscle: "fullbody", unlockLevel: 0, minWeight: 100, step: 25, liftFactor: 4, requiresAchievement: "endless10", gainMult: 2.5 },
  // Mythic lifts — gated by raw accumulated strength, each out-earning the last.
  { id: "beatsuperman", name: "Beat Superman", muscle: "fullbody", unlockLevel: 0, minWeight: 150, step: 50, liftFactor: 6, requiresStrength: 250000, gainMult: 4 },
  { id: "beatgoku", name: "Beat Goku", muscle: "fullbody", unlockLevel: 0, minWeight: 250, step: 100, liftFactor: 9, requiresStrength: 1000000, gainMult: 6 },
];

export const MUSCLES: { id: Muscle; name: string }[] = [
  { id: "core", name: "Core" },
  { id: "legs", name: "Legs" },
  { id: "chest", name: "Chest" },
  { id: "arms", name: "Arms" },
  { id: "back", name: "Back" },
  { id: "fullbody", name: "Full Body" },
];

// Muscles the judges actually score (mass + symmetry). "fullbody" is NOT a real
// display group — it only exists so Deadlift can spread development to the others —
// so judging/conditioning ignore it, otherwise it would be a permanent empty slot
// that tanks symmetry until Deadlift unlocks (Lv 15).
export const JUDGED_MUSCLES = MUSCLES.filter((m) => m.id !== "fullbody");
