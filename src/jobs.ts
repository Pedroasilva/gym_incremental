// Side jobs the character works to earn money before he can win competitions.
// Each unlocks by level, takes some time, and pays out when finished.
export interface Job {
  id: string;
  name: string;
  emoji: string;
  unlockLevel: number;
  pay: number;
  duration: number; // seconds to complete
}

export const JOBS: Job[] = [
  { id: "clean", name: "Clean the Gym", emoji: "🧹", unlockLevel: 0, pay: 15, duration: 8 },
  { id: "rack", name: "Rack the Weights", emoji: "🏋️", unlockLevel: 1, pay: 25, duration: 10 },
  { id: "supps", name: "Sell Supplements", emoji: "🥤", unlockLevel: 3, pay: 45, duration: 12 },
  { id: "assist", name: "Assist Students", emoji: "🧑‍🏫", unlockLevel: 5, pay: 80, duration: 15 },
  { id: "personal", name: "Personal Trainer", emoji: "💪", unlockLevel: 8, pay: 150, duration: 18 },
  { id: "security", name: "Party Security", emoji: "🛡️", unlockLevel: 11, pay: 280, duration: 22 },
  { id: "dancer", name: "Party Dancer", emoji: "🕺", unlockLevel: 15, pay: 450, duration: 26 },
  { id: "bachelor", name: "Bachelorette Gig", emoji: "🎉", unlockLevel: 20, pay: 800, duration: 30 },
];
