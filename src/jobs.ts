// Side jobs the character works to earn money before he can win competitions.
// Each unlocks by level, takes some time, and pays out when finished.
export interface Job {
  id: string;
  name: string;
  emoji: string;
  unlockLevel: number;
  pay: number;
  duration: number; // seconds to complete
  needsFood: boolean; // requires (and burns) hunger to work
}

export const JOBS: Job[] = [
  // Last-resort income: pays almost nothing but needs no food (works while starving).
  { id: "beg", name: "Beg by the Gym Door", emoji: "🥺", unlockLevel: 0, pay: 3, duration: 6, needsFood: false },
  { id: "clean", name: "Clean the Gym", emoji: "🧹", unlockLevel: 0, pay: 15, duration: 8, needsFood: true },
  { id: "rack", name: "Rack the Weights", emoji: "🏋️", unlockLevel: 1, pay: 25, duration: 10, needsFood: true },
  { id: "supps", name: "Sell Supplements", emoji: "🥤", unlockLevel: 3, pay: 45, duration: 12, needsFood: true },
  { id: "assist", name: "Assist Students", emoji: "🧑‍🏫", unlockLevel: 5, pay: 80, duration: 15, needsFood: true },
  { id: "personal", name: "Personal Trainer", emoji: "💪", unlockLevel: 8, pay: 150, duration: 18, needsFood: true },
  { id: "security", name: "Party Security", emoji: "🛡️", unlockLevel: 11, pay: 280, duration: 22, needsFood: true },
  { id: "dancer", name: "Party Dancer", emoji: "🕺", unlockLevel: 15, pay: 450, duration: 26, needsFood: true },
  { id: "bachelor", name: "Bachelorette Gig", emoji: "🎉", unlockLevel: 20, pay: 800, duration: 30, needsFood: true },
];
