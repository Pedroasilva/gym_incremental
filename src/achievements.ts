import type { Game } from "./game";
import { MARKET } from "./market";

// Achievements are pure checks over the live game state — evaluated each tick and
// latched once true (see Game.checkAchievements).
export interface Achievement {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  done: (g: Game) => boolean;
}

const ownsCategory = (g: Game, cat: string) =>
  MARKET.some((i) => i.category === cat && g.owns(i.id));

export const ACHIEVEMENTS: Achievement[] = [
  { id: "firstrep", name: "First Rep", emoji: "🔰", desc: "Complete your first repetition", done: (g) => g.state.totalReps >= 1 },
  { id: "heavy", name: "Heavy Lifter", emoji: "🏋️", desc: "Load 100 kg on a lift", done: (g) => g.selectedWeight() >= 100 },
  { id: "grinder", name: "Grinder", emoji: "🔁", desc: "Do 1,000 total reps", done: (g) => g.state.totalReps >= 1000 },
  { id: "rising", name: "Rising Star", emoji: "⭐", desc: "Reach level 10", done: (g) => g.state.level >= 10 },
  { id: "strongman", name: "Strongman", emoji: "💪", desc: "Reach 5,000 strength", done: (g) => g.state.strength >= 5000 },
  { id: "beast", name: "Beast", emoji: "🦍", desc: "Reach 25,000 strength", done: (g) => g.state.strength >= 25000 },
  { id: "worker", name: "Hard Worker", emoji: "💼", desc: "Finish 10 jobs", done: (g) => g.state.jobsDone >= 10 },
  { id: "loaded", name: "Loaded", emoji: "💰", desc: "Hold $2,000 at once", done: (g) => g.state.money >= 2000 },
  { id: "localchamp", name: "Local Champ", emoji: "🥉", desc: "Win the Local Gym Show", done: (g) => !!g.state.wonTournaments["local"] },
  { id: "arnold", name: "Arnold Champion", emoji: "🏆", desc: "Win the Arnold Classic", done: (g) => g.state.arnoldWon },
  { id: "enhanced", name: "Enhanced", emoji: "💉", desc: "Own an anabolic", done: (g) => ownsCategory(g, "anabolic") },
  { id: "season", name: "New Season", emoji: "🥤", desc: "Prestige at least once", done: (g) => g.state.protein >= 1 },
  { id: "burnout", name: "Burnout", emoji: "🤕", desc: "Let your health hit 0", done: (g) => g.state.health <= 0 },
];
