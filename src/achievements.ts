import type { Game } from "./game";
import { MARKET } from "./market";
import { PRESTIGE_UPGRADES } from "./prestige";

const upgradeLevels = (g: Game) => Object.values(g.state.proteinUpgrades).reduce((a, b) => a + b, 0);
const totalWins = (g: Game) => Object.values(g.state.wonTournaments).reduce((a, b) => a + b, 0);

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
  { id: "firstset", name: "First Set", emoji: "✅", desc: "Complete your first full set", done: (g) => g.state.setsCompleted >= 1 },
  { id: "routine", name: "On a Routine", emoji: "📋", desc: "Complete 100 sets", done: (g) => g.state.setsCompleted >= 100 },
  { id: "rising", name: "Rising Star", emoji: "⭐", desc: "Reach level 10", done: (g) => g.state.level >= 10 },
  { id: "strongman", name: "Strongman", emoji: "💪", desc: "Reach 5,000 strength", done: (g) => g.state.strength >= 5000 },
  { id: "beast", name: "Beast", emoji: "🦍", desc: "Reach 25,000 strength", done: (g) => g.state.strength >= 25000 },
  { id: "worker", name: "Hard Worker", emoji: "💼", desc: "Finish 10 jobs", done: (g) => g.state.jobsDone >= 10 },
  { id: "loaded", name: "Loaded", emoji: "💰", desc: "Hold $2,000 at once", done: (g) => g.state.money >= 2000 },
  { id: "localchamp", name: "Local Champ", emoji: "🥉", desc: "Win the Local Gym Show", done: (g) => !!g.state.wonTournaments["local"] },
  { id: "arnold", name: "Arnold Champion", emoji: "🏆", desc: "Win the Arnold Classic", done: (g) => g.state.arnoldWon },
  { id: "enhanced", name: "Enhanced", emoji: "💉", desc: "Own an anabolic", done: (g) => ownsCategory(g, "anabolic") },
  { id: "season", name: "New Season", emoji: "🥤", desc: "Prestige at least once", done: (g) => g.state.seasons >= 1 },
  { id: "burnout", name: "Burnout", emoji: "🤕", desc: "Let your health hit 0", done: (g) => g.state.health <= 0 },
  { id: "collapse", name: "Overtrained", emoji: "🚑", desc: "Survive an emergency collapse", done: (g) => g.state.collapses >= 1 },
  { id: "chef", name: "Fine Dining", emoji: "👨‍🍳", desc: "Hire the Personal Chef", done: (g) => g.state.chefHired },
  { id: "upgraded", name: "Min-Maxer", emoji: "🧪", desc: "Buy a prestige upgrade", done: (g) => Object.values(g.state.proteinUpgrades).some((v) => v > 0) },
  { id: "openclass", name: "Open Class", emoji: "🦍", desc: "Reach the Men's Open division", done: (g) => g.atTopDivision() },
  { id: "millionaire", name: "Big Money", emoji: "💎", desc: "Hold $10,000 at once", done: (g) => g.state.money >= 10000 },
  { id: "veteran", name: "Veteran", emoji: "🎖️", desc: "Do 10,000 total reps", done: (g) => g.state.totalReps >= 10000 },
  { id: "marathon", name: "Marathon", emoji: "🏃", desc: "Do 50,000 total reps", done: (g) => g.state.totalReps >= 50000 },
  { id: "titan", name: "Titan", emoji: "🗿", desc: "Reach 100,000 strength", done: (g) => g.state.strength >= 100000 },
  { id: "prolevel", name: "Seasoned Pro", emoji: "🌟", desc: "Reach level 30", done: (g) => g.state.level >= 30 },
  { id: "dynasty", name: "Dynasty", emoji: "👑", desc: "Win 25 competitions", done: (g) => totalWins(g) >= 25 },
  { id: "addict", name: "Protein Addict", emoji: "🧴", desc: "Buy 10 prestige upgrade levels", done: (g) => upgradeLevels(g) >= 10 },
  { id: "maxedupg", name: "Maxed Out", emoji: "🔝", desc: "Max out a prestige upgrade", done: (g) => PRESTIGE_UPGRADES.some((u) => g.upgradeLevel(u.id) >= u.maxLevel) },
  { id: "endless1", name: "Endless Challenger", emoji: "🔱", desc: "Clear an Endless Olympia stage", done: (g) => g.state.olympiaBest >= 1 },
  { id: "endless10", name: "Olympian Legend", emoji: "🌌", desc: "Reach Endless Olympia stage 10", done: (g) => g.state.olympiaBest >= 10 },
];
