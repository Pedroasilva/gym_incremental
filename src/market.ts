// Market items. Each is bought once with money and applies its modifiers
// permanently. Anabolics give huge gains but raise "side effects", which
// drain stage conditioning — offset them with vitamins / liver support.
export type Category = "equipment" | "vitamin" | "compound" | "anabolic";

export interface Modifiers {
  clickAdd?: number; // flat effort per click
  xpMult?: number; // strength xp gained
  muscleMult?: number; // muscle development (competition physique)
  fatigueMult?: number; // multiplies fatigue per rep (<1 is better)
  conditionMod?: number; // flat conditioning bonus/penalty
  moneyMult?: number; // money per rep
  sideEffect?: number; // raises health side effects (lowers conditioning)
  liftMult?: number; // raises the max-lift cap
  repsPerSetAdd?: number; // extra reps per set before the forced rest (sum across items)
}

export interface MarketItem {
  id: string;
  name: string;
  emoji: string;
  category: Category;
  cost: number;
  desc: string;
  mods: Modifiers;
}

export const MARKET: MarketItem[] = [
  // ---- Equipment (clean, permanent gear) ----
  { id: "chalk", name: "Chalk Bag", emoji: "🧴", category: "equipment", cost: 40, desc: "+5 effort per click", mods: { clickAdd: 5 } },
  { id: "gloves", name: "Lifting Gloves", emoji: "🧤", category: "equipment", cost: 60, desc: "+8 effort per click", mods: { clickAdd: 8 } },
  { id: "shoes", name: "Lifting Shoes", emoji: "👟", category: "equipment", cost: 90, desc: "+6 effort per click", mods: { clickAdd: 6 } },
  { id: "belt", name: "Lifting Belt", emoji: "🥋", category: "equipment", cost: 140, desc: "-20% fatigue, +10% max lift", mods: { fatigueMult: 0.8, liftMult: 1.1 } },
  { id: "sleeves", name: "Knee Sleeves", emoji: "🦵", category: "equipment", cost: 180, desc: "-15% fatigue, +8% max lift", mods: { fatigueMult: 0.85, liftMult: 1.08 } },
  { id: "straps", name: "Wrist Straps", emoji: "🎗️", category: "equipment", cost: 220, desc: "+10% muscle, +15% max lift", mods: { muscleMult: 1.1, liftMult: 1.15 } },
  { id: "headphones", name: "Headphones", emoji: "🎧", category: "equipment", cost: 260, desc: "+12 effort per click (in the zone)", mods: { clickAdd: 12 } },
  { id: "premium", name: "Premium Gym Pass", emoji: "🏛️", category: "equipment", cost: 600, desc: "+25% strength XP, +20% money", mods: { xpMult: 1.25, moneyMult: 1.2 } },
  { id: "homerack", name: "Home Power Rack", emoji: "🏗️", category: "equipment", cost: 1000, desc: "+20% XP, +25% max lift", mods: { xpMult: 1.2, liftMult: 1.25 } },

  // ---- Vitamins (mild, all-upside) ----
  { id: "multi", name: "Multivitamin", emoji: "💊", category: "vitamin", cost: 110, desc: "+6 conditioning", mods: { conditionMod: 6 } },
  { id: "electrolytes", name: "Electrolytes", emoji: "🧊", category: "vitamin", cost: 140, desc: "+4 conditioning, -8% fatigue", mods: { conditionMod: 4, fatigueMult: 0.92 } },
  { id: "vitd", name: "Vitamin D", emoji: "☀️", category: "vitamin", cost: 150, desc: "+3 conditioning, +5% XP", mods: { conditionMod: 3, xpMult: 1.05 } },
  { id: "omega3", name: "Omega-3", emoji: "🐟", category: "vitamin", cost: 160, desc: "+4 conditioning, -10% fatigue", mods: { conditionMod: 4, fatigueMult: 0.9 } },
  { id: "greens", name: "Greens Powder", emoji: "🥬", category: "vitamin", cost: 180, desc: "+7 conditioning", mods: { conditionMod: 7 } },
  { id: "zma", name: "ZMA", emoji: "😴", category: "vitamin", cost: 190, desc: "-15% fatigue (better recovery)", mods: { fatigueMult: 0.85 } },
  { id: "creatine", name: "Creatine", emoji: "🥄", category: "vitamin", cost: 200, desc: "+10% max lift, +5% XP", mods: { liftMult: 1.1, xpMult: 1.05 } },
  { id: "whey", name: "Whey Protein", emoji: "🥛", category: "vitamin", cost: 230, desc: "+8% muscle, +4 conditioning", mods: { muscleMult: 1.08, conditionMod: 4 } },

  // ---- Compounded meds (manipulados: bigger effects, small downsides) ----
  { id: "preworkout", name: "Pre-Workout", emoji: "⚡", category: "compound", cost: 260, desc: "+16 click, but -5 conditioning", mods: { clickAdd: 16, conditionMod: -5 } },
  { id: "nootropic", name: "Nootropic Stack", emoji: "🧠", category: "compound", cost: 300, desc: "+15% XP, +15% money", mods: { xpMult: 1.15, moneyMult: 1.15 } },
  { id: "fatburner", name: "Fat Burner", emoji: "🔥", category: "compound", cost: 320, desc: "+12 conditioning, -4 click", mods: { conditionMod: 12, clickAdd: -4 } },
  { id: "cortisol", name: "Cortisol Blocker", emoji: "🧯", category: "compound", cost: 360, desc: "+5 conditioning, -10 side effects", mods: { conditionMod: 5, sideEffect: -10 } },
  { id: "testbooster", name: "Natural Test Booster", emoji: "🌿", category: "compound", cost: 380, desc: "+10% XP, +8% lift, -3 conditioning", mods: { xpMult: 1.1, liftMult: 1.08, conditionMod: -3 } },
  { id: "liver", name: "Liver Support", emoji: "🛡️", category: "compound", cost: 420, desc: "-18 side effects", mods: { sideEffect: -18 } },
  { id: "diuretic", name: "Diuretic", emoji: "🚰", category: "compound", cost: 480, desc: "+15 conditioning (dry look), -6 click", mods: { conditionMod: 15, clickAdd: -6 } },
  { id: "peptide", name: "Peptide Stack", emoji: "🧫", category: "compound", cost: 560, desc: "+15% XP, +10% muscle, +6 side effects", mods: { xpMult: 1.15, muscleMult: 1.1, sideEffect: 6 } },
  { id: "amphetamine", name: "Amphetamine", emoji: "💥", category: "compound", cost: 5000, desc: "+30 click (faster reps), +6 reps per set, but −8 conditioning & +16 side effects", mods: { clickAdd: 30, repsPerSetAdd: 6, conditionMod: -8, sideEffect: 16 } },

  // ---- Anabolics (anabolisantes: huge gains, heavy side effects) ----
  { id: "test", name: "Testosterone", emoji: "💉", category: "anabolic", cost: 900, desc: "+50% muscle, +20% lift, +12 side effects", mods: { muscleMult: 1.5, xpMult: 1.2, liftMult: 1.2, sideEffect: 12 } },
  { id: "anavar", name: "Anavar", emoji: "🟡", category: "anabolic", cost: 1100, desc: "+40% muscle, +25% lift, +8 side effects (mild)", mods: { muscleMult: 1.4, liftMult: 1.25, sideEffect: 8 } },
  { id: "dbol", name: "Dianabol", emoji: "🔴", category: "anabolic", cost: 1400, desc: "+80% muscle, +35% lift, +22 side effects", mods: { muscleMult: 1.8, clickAdd: 10, liftMult: 1.35, sideEffect: 22 } },
  { id: "winstrol", name: "Winstrol", emoji: "⚪", category: "anabolic", cost: 1800, desc: "+30% muscle, +18 conditioning, +14 side effects", mods: { muscleMult: 1.3, conditionMod: 18, liftMult: 1.2, sideEffect: 14 } },
  { id: "deca", name: "Deca Durabolin", emoji: "🔵", category: "anabolic", cost: 2200, desc: "+90% muscle, +30% lift, +18 side effects", mods: { muscleMult: 1.9, xpMult: 1.2, liftMult: 1.3, sideEffect: 18 } },
  { id: "synthol", name: "Synthol", emoji: "🎈", category: "anabolic", cost: 2400, desc: "+100% muscle, but -20 conditioning, +10 side effects", mods: { muscleMult: 2.0, conditionMod: -20, sideEffect: 10 } },
  { id: "hgh", name: "HGH", emoji: "🧬", category: "anabolic", cost: 2600, desc: "+60% muscle, +40% XP, +20% lift, +10 side effects", mods: { muscleMult: 1.6, xpMult: 1.4, liftMult: 1.2, sideEffect: 10 } },
  { id: "tren", name: "Trenbolone", emoji: "☠️", category: "anabolic", cost: 3200, desc: "+120% muscle, +50% lift, +32 side effects", mods: { muscleMult: 2.2, xpMult: 1.3, liftMult: 1.5, sideEffect: 32 } },
];

export const CATEGORY_LABEL: Record<Category, string> = {
  equipment: "🏋️ Equipment",
  vitamin: "💊 Vitamins",
  compound: "⚗️ Compounded Meds",
  anabolic: "💉 Anabolics",
};
