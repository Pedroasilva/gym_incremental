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
  { id: "gloves", name: "Lifting Gloves", emoji: "🧤", category: "equipment", cost: 60, desc: "+8 effort per click", mods: { clickAdd: 8 } },
  { id: "shoes", name: "Lifting Shoes", emoji: "👟", category: "equipment", cost: 90, desc: "+6 effort per click", mods: { clickAdd: 6 } },
  { id: "belt", name: "Lifting Belt", emoji: "🥋", category: "equipment", cost: 140, desc: "-20% fatigue per rep", mods: { fatigueMult: 0.8 } },
  { id: "straps", name: "Wrist Straps", emoji: "🎗️", category: "equipment", cost: 220, desc: "+10% muscle development", mods: { muscleMult: 1.1 } },
  { id: "premium", name: "Premium Gym Pass", emoji: "🏛️", category: "equipment", cost: 600, desc: "+25% strength XP, +20% money", mods: { xpMult: 1.25, moneyMult: 1.2 } },

  // ---- Vitamins (mild, all-upside) ----
  { id: "multi", name: "Multivitamin", emoji: "💊", category: "vitamin", cost: 110, desc: "+6 conditioning", mods: { conditionMod: 6 } },
  { id: "omega3", name: "Omega-3", emoji: "🐟", category: "vitamin", cost: 160, desc: "+4 conditioning, -10% fatigue", mods: { conditionMod: 4, fatigueMult: 0.9 } },
  { id: "vitd", name: "Vitamin D", emoji: "☀️", category: "vitamin", cost: 150, desc: "+3 conditioning, +5% XP", mods: { conditionMod: 3, xpMult: 1.05 } },
  { id: "zma", name: "ZMA", emoji: "😴", category: "vitamin", cost: 190, desc: "-15% fatigue (better recovery)", mods: { fatigueMult: 0.85 } },

  // ---- Compounded meds (manipulados: bigger effects, small downsides) ----
  { id: "preworkout", name: "Pre-Workout", emoji: "⚡", category: "compound", cost: 260, desc: "+16 click, but -5 conditioning", mods: { clickAdd: 16, conditionMod: -5 } },
  { id: "fatburner", name: "Fat Burner", emoji: "🔥", category: "compound", cost: 320, desc: "+12 conditioning, -4 click", mods: { conditionMod: 12, clickAdd: -4 } },
  { id: "nootropic", name: "Nootropic Stack", emoji: "🧠", category: "compound", cost: 300, desc: "+15% XP, +15% money", mods: { xpMult: 1.15, moneyMult: 1.15 } },
  { id: "liver", name: "Liver Support", emoji: "🛡️", category: "compound", cost: 420, desc: "-18 side effects", mods: { sideEffect: -18 } },

  // ---- Anabolics (anabolisantes: huge gains, heavy side effects) ----
  { id: "test", name: "Testosterone", emoji: "💉", category: "anabolic", cost: 900, desc: "+50% muscle, +20% XP, +12 side effects", mods: { muscleMult: 1.5, xpMult: 1.2, sideEffect: 12 } },
  { id: "dbol", name: "Dianabol", emoji: "🔴", category: "anabolic", cost: 1400, desc: "+80% muscle, +10 click, +22 side effects", mods: { muscleMult: 1.8, clickAdd: 10, sideEffect: 22 } },
  { id: "hgh", name: "HGH", emoji: "🧬", category: "anabolic", cost: 2600, desc: "+60% muscle, +40% XP, +10 side effects", mods: { muscleMult: 1.6, xpMult: 1.4, sideEffect: 10 } },
  { id: "tren", name: "Trenbolone", emoji: "☠️", category: "anabolic", cost: 3200, desc: "+120% muscle, +30% XP, +32 side effects", mods: { muscleMult: 2.2, xpMult: 1.3, sideEffect: 32 } },
];

export const CATEGORY_LABEL: Record<Category, string> = {
  equipment: "🏋️ Equipment",
  vitamin: "💊 Vitamins",
  compound: "⚗️ Compounded Meds",
  anabolic: "💉 Anabolics",
};
