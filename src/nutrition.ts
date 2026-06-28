// Foods the player can eat. Each restores hunger and applies effects —
// some good (clean foods boost gains/conditioning), some bad (junk food
// fills you fast but wrecks your stage conditioning).
export interface Food {
  id: string;
  name: string;
  emoji: string;
  satiety: number; // hunger restored (0..100)
  condition: number; // immediate change to diet conditioning (+ clean, - junk)
  // temporary buff applied while active (duration in seconds; 0 = no timed buff)
  duration: number;
  xpMult: number; // 1 = neutral
  clickMult: number; // affects effort per click (energy)
  muscleMult: number; // affects muscle development (competition physique)
}

export const FOODS: Food[] = [
  { id: "chicken", name: "Chicken Breast", emoji: "🍗", satiety: 28, condition: 6, duration: 30, xpMult: 1.2, clickMult: 1.0, muscleMult: 1.2 },
  { id: "rice", name: "Rice Bowl", emoji: "🍚", satiety: 35, condition: 0, duration: 25, xpMult: 1.0, clickMult: 1.25, muscleMult: 1.0 },
  { id: "eggs", name: "Eggs", emoji: "🥚", satiety: 20, condition: 4, duration: 30, xpMult: 1.0, clickMult: 1.0, muscleMult: 1.25 },
  { id: "broccoli", name: "Broccoli", emoji: "🥦", satiety: 12, condition: 10, duration: 35, xpMult: 1.0, clickMult: 1.0, muscleMult: 1.0 },
  { id: "shake", name: "Protein Shake", emoji: "🥤", satiety: 16, condition: 3, duration: 30, xpMult: 1.3, clickMult: 1.0, muscleMult: 1.3 },
  { id: "banana", name: "Banana", emoji: "🍌", satiety: 14, condition: 2, duration: 20, xpMult: 1.0, clickMult: 1.2, muscleMult: 1.0 },
  { id: "steak", name: "Steak", emoji: "🥩", satiety: 34, condition: 2, duration: 35, xpMult: 1.15, clickMult: 1.1, muscleMult: 1.35 },
  { id: "burger", name: "Burger", emoji: "🍔", satiety: 45, condition: -12, duration: 20, xpMult: 1.0, clickMult: 1.4, muscleMult: 0.9 },
  { id: "donut", name: "Donut", emoji: "🍩", satiety: 26, condition: -16, duration: 12, xpMult: 1.0, clickMult: 1.6, muscleMult: 0.8 },
  { id: "pizza", name: "Pizza Slice", emoji: "🍕", satiety: 40, condition: -10, duration: 18, xpMult: 1.0, clickMult: 1.3, muscleMult: 0.9 },
];

export interface ActiveBuff {
  foodId: string;
  name: string;
  emoji: string;
  remaining: number;
  xpMult: number;
  clickMult: number;
  muscleMult: number;
}
