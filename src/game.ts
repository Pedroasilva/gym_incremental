import { BALANCE, EXERCISES, JUDGED_MUSCLES, type Muscle, type Exercise } from "./balance";
import { FOODS, type ActiveBuff } from "./nutrition";
import { MARKET, type Modifiers, type MarketItem } from "./market";
import { TREATMENTS } from "./hospital";
import { JOBS, type Job } from "./jobs";
import { ACHIEVEMENTS, type Achievement } from "./achievements";
import { TOURNAMENTS, type Tournament } from "./competition";
import { PRESTIGE_UPGRADES, type PrestigeUpgrade } from "./prestige";

const SAVE_KEY = "gym_incremental_save_v1";

export interface State {
  strength: number; // accumulated strength XP (total)
  level: number;
  xp: number; // xp within the current level
  totalReps: number;
  money: number;
  hunger: number; // 0..100 (100 = full)
  health: number; // 0..100 (drained by anabolic side effects)
  dietCondition: number; // conditioning offset from food (drifts back to 0)
  recovering: number; // forced hospitalization lockout remaining (seconds); 0 = free
  currentExercise: string; // id (what's being trained right now)
  preferredExercise: string; // id the player manually chose; the auto-trainer returns to it
  weight: Record<string, number>; // chosen weight per exercise (kg)
  reps: Record<string, number>;
  setReps: Record<string, number>; // reps done in the current set, per exercise (0..repsPerSet)
  rest: Record<Muscle, number>; // forced rest remaining per muscle (seconds) between sets
  setsCompleted: number; // total sets finished (stat / achievements)
  setCondition: number; // conditioning earned from completing sets (the routine)
  fatigue: Record<Muscle, number>;
  physique: Record<Muscle, number>;
  owned: Record<string, boolean>; // permanent market items owned
  activeItems: Record<string, number>; // timed items (anabolics) → remaining seconds active
  buffs: ActiveBuff[]; // active food buffs
  activeJob: string | null; // job currently being worked
  jobRemaining: number; // seconds left on the active job
  autoLevel: number; // Auto-Trainer level (idle reps)
  autoEnabled: boolean; // Auto-Trainer on/off switch (paused when false)
  agentLevel: number; // Business Agent level (auto-work); 0 = not hired
  agentTimer: number; // seconds until the Business Agent finishes its next job
  jobsDone: number; // total jobs completed
  wonTournaments: Record<string, number>; // win count per tournament (0/undefined = never won)
  chefHired: boolean; // Personal Chef hired (auto-feeds you the marked food)
  markedFood: string | null; // food id the chef buys when hunger runs low
  protein: number; // prestige currency (persists across a New Season reset)
  proteinUpgrades: Record<string, number>; // permanent prestige upgrade levels (persist)
  seasons: number; // New Seasons completed → Olympia division climbed (persists)
  collapses: number; // times the player has collapsed into emergency hospital (stat)
  achievements: Record<string, boolean>; // unlocked achievements (persist across prestige)
  arnoldWon: boolean;
  ronnieWon: boolean; // beat Ronnie Coleman, the final boss (permanent)
  olympiaStage: number; // Endless Olympia: stages cleared this season (next = +1); resets on prestige
  olympiaBest: number; // highest Endless Olympia stage ever cleared (permanent record)
  lastSeen: number; // epoch ms of the last save — used to compute offline progress
}

// Olympia divisions, lightest to the pinnacle. Each New Season promotes the player
// one division, climbing toward the Men's Open ("the Opens") — the top category.
export const OLYMPIA_DIVISIONS = [
  { name: "Men's Physique", emoji: "🩳" },
  { name: "Classic Physique", emoji: "🕺" },
  { name: "212 Bodybuilding", emoji: "💪" },
  { name: "Men's Open", emoji: "🦍" },
] as const;

function initialState(): State {
  return {
    strength: 0,
    level: 0,
    xp: 0,
    totalReps: 0,
    money: 60, // small starting cushion to buy food before the first prize
    hunger: 100,
    health: 100,
    dietCondition: 0,
    recovering: 0,
    currentExercise: "crunch",
    preferredExercise: "crunch",
    weight: {},
    reps: {},
    setReps: {},
    rest: { core: 0, legs: 0, chest: 0, arms: 0, back: 0, fullbody: 0 },
    setsCompleted: 0,
    setCondition: 0,
    fatigue: { core: 0, legs: 0, chest: 0, arms: 0, back: 0, fullbody: 0 },
    physique: { core: 0, legs: 0, chest: 0, arms: 0, back: 0, fullbody: 0 },
    owned: {},
    activeItems: {},
    buffs: [],
    activeJob: null,
    jobRemaining: 0,
    autoLevel: 0,
    autoEnabled: true,
    agentLevel: 0,
    agentTimer: 0,
    jobsDone: 0,
    wonTournaments: {},
    chefHired: false,
    markedFood: null,
    protein: 0,
    proteinUpgrades: {},
    seasons: 0,
    collapses: 0,
    achievements: {},
    arnoldWon: false,
    ronnieWon: false,
    olympiaStage: 0,
    olympiaBest: 0,
    lastSeen: Date.now(),
  };
}

export class Game {
  state: State;
  effort = 0;
  private autoAcc = 0; // fractional auto-clicks carried between ticks
  // jobs finished this tick (drained by the UI to show a toast), name + pay earned
  jobEvents: { name: string; emoji: string; pay: number }[] = [];
  justCollapsed = false; // set when an emergency hospitalization starts (UI toast)
  justRecovered = false; // set when a recovery lockout finishes (UI toast)
  // meals the Personal Chef auto-served this tick (drained by the UI for a toast)
  chefEvents: { name: string; emoji: string; cost: number }[] = [];
  // idle gains accumulated while the player was away (drained by the UI for a summary)
  offlineSummary: { seconds: number; strength: number; money: number; levels: number; reps: number } | null = null;

  constructor() {
    this.state = this.load();
    this.applyOffline();
  }

  // Simulate the time the player was away by replaying tick() in 1-second steps, so
  // the Auto-Trainer / Business Agent / Personal Chef keep working idle. Capped so a
  // long absence can't fast-forward forever; short gaps are ignored.
  private applyOffline() {
    const now = Date.now();
    const elapsed = Math.min(Math.floor((now - this.state.lastSeen) / 1000), BALANCE.offlineCapSeconds);
    this.state.lastSeen = now;
    if (elapsed < 60) return; // ignore brief gaps (page reloads, quick tab switches)
    const before = {
      strength: this.state.strength,
      money: this.state.money,
      level: this.state.level,
      reps: this.state.totalReps,
    };
    for (let i = 0; i < elapsed; i++) this.tick(1);
    // discard the per-tick toast queues built up during the fast-forward
    this.jobEvents.length = 0;
    this.chefEvents.length = 0;
    this.justCollapsed = false;
    this.justRecovered = false;
    this.offlineSummary = {
      seconds: elapsed,
      strength: this.state.strength - before.strength,
      money: this.state.money - before.money,
      levels: this.state.level - before.level,
      reps: this.state.totalReps - before.reps,
    };
  }

  // ---- Queries ----
  exercise(): Exercise {
    return EXERCISES.find((e) => e.id === this.state.currentExercise)!;
  }
  // Heaviest weight the player can currently load, from strength + gear, per lift.
  maxLift(ex = this.exercise()): number {
    if (ex.fixedWeight) return ex.fixedWeight; // locked-weight lift
    const cap = (BALANCE.liftCapBase + Math.sqrt(this.state.strength) * BALANCE.liftCapSlope) *
      ex.liftFactor * this.itemMods().liftMult * this.upgradeLiftMult();
    return Math.max(ex.minWeight, Math.floor(cap / ex.step) * ex.step);
  }
  selectedWeight(ex = this.exercise()): number {
    if (ex.fixedWeight) return ex.fixedWeight; // no selector — always this weight
    const w = this.state.weight[ex.id] ?? ex.minWeight;
    return Math.max(ex.minWeight, Math.min(w, this.maxLift(ex))); // clamp to current cap
  }
  currentReps(ex = this.exercise()): number {
    return this.state.reps[ex.id] ?? 0;
  }
  // Reps completed in the current set (série) for this exercise.
  setReps(ex = this.exercise()): number {
    return this.state.setReps[ex.id] ?? 0;
  }
  // Seconds of forced rest still owed before a muscle can start its next set.
  restRemaining(muscle = this.exercise().muscle): number {
    return this.state.rest[muscle] ?? 0;
  }
  isResting(ex = this.exercise()): boolean {
    return this.restRemaining(ex.muscle) > 0;
  }
  xpForNextLevel(): number {
    return Math.floor(BALANCE.levelBase * Math.pow(BALANCE.levelGrowth, this.state.level));
  }
  muscleFatigue(): number {
    return this.state.fatigue[this.exercise().muscle];
  }
  unlocked(ex: Exercise): boolean {
    if (this.state.level < ex.unlockLevel) return false;
    if (ex.requiresAchievement && !this.state.achievements[ex.requiresAchievement]) return false;
    if (ex.requiresStrength && this.state.strength < ex.requiresStrength) return false;
    return true;
  }
  owns(id: string): boolean {
    return !!this.state.owned[id];
  }
  // Timed items (anabolics): currently active? and how much time is left.
  itemActive(id: string): boolean {
    return (this.state.activeItems[id] ?? 0) > 0;
  }
  itemRemaining(id: string): number {
    return this.state.activeItems[id] ?? 0;
  }
  // Whether an item's effects currently apply: permanent items if owned, timed items
  // (anabolics) only while the cycle is active.
  private effectActive(item: MarketItem): boolean {
    return item.duration ? this.itemActive(item.id) : this.owns(item.id);
  }

  // ---- Aggregated modifiers from owned/active market items ----
  private itemMods(): Required<Modifiers> {
    const acc: Required<Modifiers> = {
      clickAdd: 0,
      xpMult: 1,
      muscleMult: 1,
      fatigueMult: 1,
      conditionMod: 0,
      moneyMult: 1,
      sideEffect: 0,
      liftMult: 1,
      repsPerSetAdd: 0,
    };
    for (const item of MARKET) {
      if (!this.effectActive(item)) continue;
      const m = item.mods;
      acc.clickAdd += m.clickAdd ?? 0;
      acc.xpMult *= m.xpMult ?? 1;
      acc.muscleMult *= m.muscleMult ?? 1;
      acc.fatigueMult *= m.fatigueMult ?? 1;
      acc.conditionMod += m.conditionMod ?? 0;
      acc.moneyMult *= m.moneyMult ?? 1;
      acc.sideEffect += m.sideEffect ?? 0;
      acc.liftMult *= m.liftMult ?? 1;
      acc.repsPerSetAdd += m.repsPerSetAdd ?? 0;
    }
    return acc;
  }
  // Reps that make up one set — base plus any gear (e.g. Amphetamine raises the cap).
  repsPerSet(): number {
    return BALANCE.repsPerSet + this.itemMods().repsPerSetAdd;
  }

  private buffMult(key: "xpMult" | "clickMult" | "muscleMult"): number {
    return this.state.buffs.reduce((a, b) => a * b[key], 1);
  }

  globalMultiplier(): number {
    return (1 + this.state.level * 0.05) * this.prestigeMult();
  }

  // ---- Prestige (New Season / Bulk-Cut) ----
  // ---- Prestige upgrades (bought with Protein, persist across seasons) ----
  upgradeLevel(id: string): number {
    return this.state.proteinUpgrades[id] ?? 0;
  }
  upgradeMaxed(u: PrestigeUpgrade): boolean {
    return this.upgradeLevel(u.id) >= u.maxLevel;
  }
  upgradeCost(u: PrestigeUpgrade): number {
    return u.cost(this.upgradeLevel(u.id));
  }
  canBuyUpgrade(u: PrestigeUpgrade): boolean {
    return !this.upgradeMaxed(u) && this.state.protein >= this.upgradeCost(u);
  }
  buyUpgrade(id: string): boolean {
    const u = PRESTIGE_UPGRADES.find((x) => x.id === id);
    if (!u || !this.canBuyUpgrade(u)) return false;
    this.state.protein -= this.upgradeCost(u);
    this.state.proteinUpgrades[id] = this.upgradeLevel(id) + 1;
    return true;
  }
  // Passive bonus from UNSPENT Protein — leftover banked Protein is never wasted.
  proteinBankBonus(): number {
    return this.state.protein * BALANCE.proteinBonusRate;
  }
  // Permanent global multiplier: Protein Synthesis upgrade (+10%/lvl) plus the
  // banked-Protein bonus (+2% per unspent Protein).
  prestigeMult(): number {
    return 1 + this.upgradeLevel("synthesis") * 0.1 + this.proteinBankBonus();
  }
  // Negative-effect mitigations and bonuses from the other upgrades:
  private upgradeFatigueMult(): number {
    return Math.max(0, 1 - this.upgradeLevel("metabolism") * 0.08);
  }
  private upgradeSideEffectMult(): number {
    return Math.max(0, 1 - this.upgradeLevel("liver") * 0.15);
  }
  hungerDrainMult(): number {
    return Math.max(0, 1 - this.upgradeLevel("stomach") * 0.1);
  }
  upgradeMoneyMult(): number {
    return 1 + this.upgradeLevel("hustle") * 0.12;
  }
  private upgradeClickMult(): number {
    return 1 + this.upgradeLevel("power") * 0.08;
  }
  private upgradeConditionBonus(): number {
    return this.upgradeLevel("showman") * 4;
  }
  private upgradeRestMult(): number {
    return Math.max(0, 1 - this.upgradeLevel("recovery") * 0.08);
  }
  private upgradeLiftMult(): number {
    return 1 + this.upgradeLevel("joints") * 0.06;
  }
  // Protein you'd earn by resetting now, based on accumulated strength.
  proteinGain(): number {
    return Math.floor(Math.sqrt(this.state.strength / 500));
  }
  canPrestige(): boolean {
    return this.proteinGain() >= 1;
  }
  // Current Olympia division (rises one step per New Season, capped at Men's Open).
  divisionIndex(): number {
    return Math.min(this.state.seasons, OLYMPIA_DIVISIONS.length - 1);
  }
  division() {
    return OLYMPIA_DIVISIONS[this.divisionIndex()];
  }
  // The division the next New Season would promote you to, or null if already at the top.
  nextDivision() {
    return this.atTopDivision() ? null : OLYMPIA_DIVISIONS[this.divisionIndex() + 1];
  }
  atTopDivision(): boolean {
    return this.divisionIndex() >= OLYMPIA_DIVISIONS.length - 1;
  }
  prestige(): boolean {
    const gain = this.proteinGain();
    if (gain < 1) return false;
    const keepProtein = this.state.protein + gain;
    const keepUpgrades = this.state.proteinUpgrades;
    const keepSeasons = this.state.seasons + 1;
    const keepCollapses = this.state.collapses;
    const keepArnold = this.state.arnoldWon;
    const keepRonnie = this.state.ronnieWon;
    const keepBest = this.state.olympiaBest;
    const keepAchievements = this.state.achievements;
    this.state = initialState();
    this.state.protein = keepProtein;
    this.state.proteinUpgrades = keepUpgrades;
    this.state.seasons = keepSeasons;
    this.state.collapses = keepCollapses;
    this.state.arnoldWon = keepArnold;
    this.state.ronnieWon = keepRonnie;
    this.state.olympiaBest = keepBest;
    this.state.achievements = keepAchievements;
    // Seed Money upgrade: extra starting cash each New Season
    this.state.money += this.upgradeLevel("seedmoney") * 250;
    this.effort = 0;
    this.autoAcc = 0;
    return true;
  }

  // Hunger factor: training is weak when starving.
  hungerFactor(): number {
    if (this.state.hunger >= 30) return 1;
    return 0.3 + (this.state.hunger / 30) * 0.7;
  }

  // Health factor: training is weak (and eventually impossible) when sick.
  healthFactor(): number {
    if (this.state.health >= 30) return 1;
    return 0.3 + (this.state.health / 30) * 0.7;
  }

  // Fatigue factor: a tired muscle pushes weaker — effort per click drops linearly
  // from 1.0 (fresh) to 1 - fatiguePenaltyMax (exhausted). Below the 100 hard cap
  // this is the gradual penalty; at 100 the muscle is fully blocked (see push()).
  fatigueFactor(): number {
    const f = Math.min(1, this.muscleFatigue() / BALANCE.fatigueMax); // 0..1
    return 1 - f * BALANCE.fatiguePenaltyMax;
  }

  sideEffects(): number {
    return Math.max(0, this.itemMods().sideEffect) * this.upgradeSideEffectMult();
  }

  // Effort added per click, after gear, buffs and hunger.
  effectiveClick(): number {
    const base = BALANCE.clickPower + this.itemMods().clickAdd;
    return (
      Math.max(1, base) *
      this.upgradeClickMult() *
      this.buffMult("clickMult") *
      this.hungerFactor() *
      this.healthFactor() *
      this.fatigueFactor()
    );
  }

  // Stage conditioning shown to the judges (symmetry + diet + gear - side effects).
  conditioning(): number {
    const vals = JUDGED_MUSCLES.map((m) => this.state.physique[m.id]);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length || 1;
    const std = Math.sqrt(vals.reduce((a, v) => a + (v - mean) ** 2, 0) / vals.length);
    const symmetry = mean / (mean + std); // 0..1
    const base = 40 + symmetry * 45;
    const value =
      base +
      this.state.setCondition +
      this.state.dietCondition +
      this.itemMods().conditionMod +
      this.upgradeConditionBonus() -
      this.sideEffects();
    return Math.max(0, Math.min(100, Math.round(value)));
  }

  repCost(ex = this.exercise()): number {
    const n = Math.min(this.currentReps(ex), BALANCE.decayCap);
    return BALANCE.baseCost * this.selectedWeight(ex) * Math.pow(BALANCE.decay, n);
  }

  // ---- Actions ----
  // manual = a deliberate player choice (remembered so the auto-trainer returns to it);
  // the auto-trainer passes manual=false when it temporarily borrows another muscle.
  selectExercise(id: string, manual = true) {
    if (manual) this.state.preferredExercise = id;
    if (this.state.currentExercise === id) return;
    this.state.currentExercise = id;
    this.effort = 0;
  }
  changeWeight(delta: number) {
    const ex = this.exercise();
    const current = this.selectedWeight(ex);
    const next = Math.max(ex.minWeight, Math.min(this.maxLift(ex), current + delta * ex.step));
    if (next === current) return; // already at the cap/floor — keep current effort progress
    this.state.weight[ex.id] = next;
    this.effort = 0; // weight changed → rep cost changed, so reset the partial effort
  }
  // Jump straight to the lightest (min) or heaviest (max-lift) weight for this exercise.
  setWeightExtreme(toMax: boolean) {
    const ex = this.exercise();
    const current = this.selectedWeight(ex);
    const next = toMax ? this.maxLift(ex) : ex.minWeight;
    if (next === current) return;
    this.state.weight[ex.id] = next;
    this.effort = 0;
  }

  push(): boolean {
    const ex = this.exercise();
    if (this.state.recovering > 0) return false; // hospitalized — can't train
    if (this.muscleFatigue() >= BALANCE.fatigueMax) return false;
    if (this.restRemaining(ex.muscle) > 0) return false; // resting between sets
    if (this.state.hunger <= 0) return false; // too hungry to lift
    if (this.state.health <= 0) return false; // too sick to lift

    this.effort += this.effectiveClick();
    if (this.effort < this.repCost(ex)) return false;

    this.effort = 0;
    this.state.reps[ex.id] = this.currentReps(ex) + 1;
    this.state.totalReps++;

    const weight = this.selectedWeight(ex);
    const mods = this.itemMods();
    const exMult = ex.gainMult ?? 1; // some lifts (e.g. Bench the World) just give more

    const xp = (weight * BALANCE.xpPerRepFactor || 1) * exMult * this.globalMultiplier() * mods.xpMult * this.buffMult("xpMult");
    this.state.strength += xp;
    this.state.xp += xp;
    // reps no longer earn money — money comes only from competition prizes

    const muscleMult = mods.muscleMult * this.buffMult("muscleMult") * this.prestigeMult();
    const gain = (weight * 0.1 + 0.2) * exMult * muscleMult;
    if (ex.muscle === "fullbody") {
      // Deadlift is a full-body lift: spread development across the 5 judged groups
      // (it doesn't write to the unjudged "fullbody" slot). Total ≈ 1.8× a normal rep.
      for (const m of JUDGED_MUSCLES) this.state.physique[m.id] += gain * 0.36;
    } else {
      this.state.physique[ex.muscle] += gain;
    }

    this.state.fatigue[ex.muscle] = Math.min(
      BALANCE.fatigueMax,
      this.state.fatigue[ex.muscle] + (weight * BALANCE.fatiguePerRepFactor + 2) * mods.fatigueMult * this.upgradeFatigueMult(),
    );
    this.state.hunger = Math.max(0, this.state.hunger - (weight * 0.015 + 0.8));
    // overtraining: each rep wears down health; rest/eat/work lets it recover
    this.state.health = Math.max(0, this.state.health - (BALANCE.healthDrainBase + weight * BALANCE.healthDrainWeight));

    // Sets (séries): every repsPerSet reps completes a set. Finishing a set is
    // what truly builds the body — it grants a strength bonus, bumps conditioning,
    // and forces a rest pause on that muscle before the next set can begin.
    this.state.setReps[ex.id] = this.setReps(ex) + 1;
    if (this.state.setReps[ex.id] >= this.repsPerSet()) {
      this.state.setReps[ex.id] = 0;
      this.state.rest[ex.muscle] = BALANCE.restSeconds * this.upgradeRestMult();
      this.state.setsCompleted++;
      const setXp =
        (BALANCE.setStrengthBase + weight * BALANCE.setStrengthWeight) *
        this.globalMultiplier() * mods.xpMult * this.buffMult("xpMult");
      this.state.strength += setXp;
      this.state.xp += setXp;
      this.state.setCondition = Math.min(BALANCE.setConditionMax, this.state.setCondition + BALANCE.setConditionGain);
    }

    while (this.state.xp >= this.xpForNextLevel()) {
      this.state.xp -= this.xpForNextLevel();
      this.state.level++;
    }
    return true;
  }

  // ---- Personal Chef (auto-feed) ----
  chefCost(): number {
    return BALANCE.chefCost;
  }
  hireChef(): boolean {
    if (this.state.chefHired || this.state.money < this.chefCost()) return false;
    this.state.money -= this.chefCost();
    this.state.chefHired = true;
    // default to the marked food, or the cheapest food, so it works right away
    if (!this.state.markedFood) {
      this.state.markedFood = [...FOODS].sort((a, b) => a.cost - b.cost)[0].id;
    }
    return true;
  }
  markFood(foodId: string) {
    if (FOODS.some((f) => f.id === foodId)) this.state.markedFood = foodId;
  }

  eat(foodId: string): boolean {
    const food = FOODS.find((f) => f.id === foodId);
    if (!food || this.state.money < food.cost) return false;
    this.state.money -= food.cost;
    this.state.hunger = Math.min(100, this.state.hunger + food.satiety);
    this.state.dietCondition = Math.max(-40, Math.min(40, this.state.dietCondition + food.condition));
    if (food.duration > 0) {
      this.state.buffs = this.state.buffs.filter((b) => b.foodId !== food.id);
      this.state.buffs.push({
        foodId: food.id,
        name: food.name,
        emoji: food.emoji,
        remaining: food.duration,
        xpMult: food.xpMult,
        clickMult: food.clickMult,
        muscleMult: food.muscleMult,
      });
    }
    return true;
  }

  buy(itemId: string): boolean {
    const item = MARKET.find((i) => i.id === itemId);
    if (!item || this.state.money < item.cost) return false;
    if (item.duration) {
      // timed cycle (anabolic): can't re-apply while still active
      if (this.itemActive(itemId)) return false;
      this.state.money -= item.cost;
      this.state.activeItems[itemId] = item.duration;
      return true;
    }
    if (this.owns(itemId)) return false; // permanent items: bought once
    this.state.money -= item.cost;
    this.state.owned[itemId] = true;
    return true;
  }

  hospitalize(treatmentId: string): boolean {
    const t = TREATMENTS.find((x) => x.id === treatmentId);
    if (!t || this.state.money < t.cost) return false;
    this.state.money -= t.cost;
    this.state.health = Math.min(100, this.state.health + t.heal);
    for (const m of Object.keys(this.state.physique) as Muscle[]) {
      this.state.physique[m] *= 1 - t.shapeLoss; // shape suffers while bedridden
    }
    return true;
  }

  // ---- Emergency collapse ----
  // When health bottoms out (≤ collapseHealth) the player is rushed to hospital:
  // locked out of training for collapseSeconds, healed up, and loses collapseLoss
  // (20%) of accumulated gains — strength, level and conditioning (physique + sets).
  isRecovering(): boolean {
    return this.state.recovering > 0;
  }
  private collapse() {
    const keep = 1 - BALANCE.collapseLoss;
    this.state.strength *= keep;
    this.state.xp *= keep;
    this.state.level = Math.floor(this.state.level * keep);
    this.state.setCondition *= keep;
    for (const m of Object.keys(this.state.physique) as Muscle[]) {
      this.state.physique[m] *= keep;
    }
    this.state.recovering = BALANCE.collapseSeconds;
    this.state.health = 100; // treated and stabilized, but locked in recovery
    this.state.activeJob = null; // can't keep working from a hospital bed
    this.state.jobRemaining = 0;
    this.state.collapses++;
    this.justCollapsed = true; // surfaced to the UI for a toast
  }
  // Leaving the hospital: wipe every negative status so the player starts fresh —
  // full health/hunger, no fatigue, no forced rest, no diet/side-effect deficit.
  private clearNegativeStatuses() {
    this.state.health = 100;
    this.state.hunger = 100;
    this.state.dietCondition = Math.max(0, this.state.dietCondition);
    for (const m of Object.keys(this.state.fatigue) as Muscle[]) {
      this.state.fatigue[m] = 0;
      this.state.rest[m] = 0;
    }
    this.effort = 0;
    this.justRecovered = true; // surfaced to the UI for a toast
  }

  // Entry fee: every show charges money to enter, paid win or lose. This (plus the
  // diminishing rematch payouts below) makes farming an easy show a net loss.
  canAffordEntry(t: Tournament): boolean {
    return this.state.money >= t.entryFee;
  }
  payEntry(t: Tournament): boolean {
    if (this.state.money < t.entryFee) return false;
    this.state.money -= t.entryFee;
    return true;
  }

  // Fraction of the prize a win pays given how many times this show was already won:
  // the first rematchFullWins wins pay the FULL prize, then each further win pays
  // steeply less than the last (0.5, 0.35, …) so eventual farming still tends to zero.
  private prizeFactor(priorWins: number): number {
    if (priorWins < BALANCE.rematchFullWins) return 1;
    return BALANCE.rematchBase * Math.pow(BALANCE.rematchDecay, priorWins - BALANCE.rematchFullWins);
  }
  // Payout for a win at a given prior-win count, gross (before the entry fee).
  // Clamped so a (diminished) prize never drops to or below the entry fee — it always
  // pays at least entryFee + 1, so entering and winning is never a guaranteed loss.
  private payout(tournamentId: string, prize: number, priorWins: number): number {
    const raw = Math.round(prize * this.prizeFactor(priorWins) * this.itemMods().moneyMult * this.upgradeMoneyMult());
    const fee = TOURNAMENTS.find((t) => t.id === tournamentId)?.entryFee ?? 0;
    return Math.max(raw, fee + 1);
  }
  // What the next win of this tournament would pay (for display) — gross, before fee.
  nextPrize(tournamentId: string, prize: number): number {
    return this.payout(tournamentId, prize, this.state.wonTournaments[tournamentId] ?? 0);
  }
  timesWon(tournamentId: string): number {
    return this.state.wonTournaments[tournamentId] ?? 0;
  }
  claimPrize(tournamentId: string, prize: number): { amount: number; first: boolean } {
    const priorWins = this.state.wonTournaments[tournamentId] ?? 0;
    // "first" here means a full-prize win (still inside the grace window), used by the
    // UI to label it "Prize" vs a diminished "Rematch payout".
    const first = priorWins < BALANCE.rematchFullWins;
    const amount = this.payout(tournamentId, prize, priorWins);
    this.state.wonTournaments[tournamentId] = priorWins + 1;
    this.state.money += amount;
    return { amount, first };
  }

  // ---- Endless Olympia (post-Arnold infinite endgame) ----
  endlessUnlocked(): boolean {
    return this.state.arnoldWon;
  }
  endlessTarget(): number {
    return this.state.olympiaStage + 1; // the next stage to attempt
  }
  endlessTier(stage: number): number {
    return BALANCE.endlessBaseTier * Math.pow(BALANCE.endlessGrowth, stage - 1);
  }
  endlessEntry(stage: number): number {
    return Math.round(BALANCE.endlessEntryBase * Math.pow(BALANCE.endlessEntryGrowth, stage - 1));
  }
  endlessPrize(stage: number): number {
    const base = BALANCE.endlessPrizeBase * Math.pow(BALANCE.endlessPrizeGrowth, stage - 1);
    return Math.round(base * this.itemMods().moneyMult * this.upgradeMoneyMult());
  }
  canAffordEndless(stage: number): boolean {
    return this.state.money >= this.endlessEntry(stage);
  }
  payEndlessEntry(stage: number): boolean {
    const fee = this.endlessEntry(stage);
    if (this.state.money < fee) return false;
    this.state.money -= fee;
    return true;
  }
  // Clearing a stage: record it, bank the prize, return the amount won.
  clearEndless(stage: number): number {
    this.state.olympiaStage = stage;
    this.state.olympiaBest = Math.max(this.state.olympiaBest, stage);
    const amount = this.endlessPrize(stage);
    this.state.money += amount;
    return amount;
  }

  // ---- Final boss: Beat Ronnie Coleman ----
  // Requires every prior challenge done: Arnold won, Olympian Legend (Endless stage 10),
  // and Beat Goku unlocked (1M strength). The list of still-missing requirements:
  ronnieMissing(): string[] {
    const m: string[] = [];
    if (!this.state.arnoldWon) m.push("win the Arnold Classic");
    if (this.state.olympiaBest < 10) m.push("Olympian Legend (Endless stage 10)");
    if (this.state.strength < 1_000_000) m.push("Sparring Goku (1M strength)");
    return m;
  }
  ronnieUnlocked(): boolean {
    return this.ronnieMissing().length === 0;
  }
  // Beating Ronnie: first win pays a huge purse and earns the title; rematches pay little.
  beatRonnie(): number {
    const first = !this.state.ronnieWon;
    this.state.ronnieWon = true;
    const amount = first ? 500_000 : 1000;
    this.state.money += amount;
    return amount;
  }

  // Latch any achievements whose condition is now met; return newly unlocked ones.
  checkAchievements(): Achievement[] {
    const fresh: Achievement[] = [];
    for (const a of ACHIEVEMENTS) {
      if (!this.state.achievements[a.id] && a.done(this)) {
        this.state.achievements[a.id] = true;
        fresh.push(a);
      }
    }
    return fresh;
  }

  // ---- Jobs ----
  jobUnlocked(job: Job): boolean {
    return this.state.level >= job.unlockLevel;
  }
  activeJobObj(): Job | undefined {
    return JOBS.find((j) => j.id === this.state.activeJob);
  }
  jobProgress(): number {
    const job = this.activeJobObj();
    if (!job) return 0;
    return Math.max(0, Math.min(1, 1 - this.state.jobRemaining / job.duration));
  }
  startJob(id: string): boolean {
    if (this.state.activeJob) return false; // already busy
    const job = JOBS.find((j) => j.id === id);
    if (!job || !this.jobUnlocked(job)) return false;
    if (job.needsFood && this.state.hunger <= 0) return false; // too hungry to work
    this.state.activeJob = id;
    this.state.jobRemaining = job.duration;
    return true;
  }
  canStartJob(job: Job): boolean {
    return this.jobUnlocked(job) && !(job.needsFood && this.state.hunger <= 0);
  }

  // ---- Business Agent (auto-work) ----
  // Hired like the Auto-Trainer; each level shortens the auto-job interval from
  // agentIntervalStart (120s) down to agentIntervalMin (30s).
  agentCost(): number {
    return Math.round(BALANCE.agentBaseCost * Math.pow(BALANCE.agentCostGrowth, this.state.agentLevel));
  }
  agentMaxed(): boolean {
    return this.state.agentLevel >= BALANCE.agentMaxLevel;
  }
  agentInterval(): number {
    return Math.max(
      BALANCE.agentIntervalMin,
      BALANCE.agentIntervalStart - (this.state.agentLevel - 1) * BALANCE.agentIntervalStep,
    );
  }
  // Highest-paying unlocked job the agent can do right now (food permitting); when
  // starving it falls back to a no-food job (begging), so it never soft-locks.
  agentBestJob(): Job | undefined {
    return JOBS.filter((j) => this.jobUnlocked(j) && (!j.needsFood || this.state.hunger > 0))
      .sort((a, b) => b.pay - a.pay)[0];
  }
  hireAgent(): boolean {
    if (this.agentMaxed() || this.state.money < this.agentCost()) return false;
    this.state.money -= this.agentCost();
    this.state.agentLevel++;
    if (this.state.agentTimer <= 0) this.state.agentTimer = this.agentInterval();
    return true;
  }

  // ---- Auto-Trainer (idle reps) ----
  autoCost(): number {
    return Math.round(BALANCE.autoBaseCost * Math.pow(BALANCE.autoCostGrowth, this.state.autoLevel));
  }
  autoMaxed(): boolean {
    return this.state.autoLevel >= BALANCE.autoMaxLevel;
  }
  autoClicksPerSec(): number {
    return this.state.autoLevel * BALANCE.autoClicksPerLevel;
  }
  hireAuto(): boolean {
    if (this.autoMaxed() || this.state.money < this.autoCost()) return false;
    this.state.money -= this.autoCost();
    this.state.autoLevel++;
    return true;
  }
  toggleAuto() {
    this.state.autoEnabled = !this.state.autoEnabled;
  }
  // Switch to an unlocked exercise whose muscle isn't exhausted. Returns false if
  // none is available (or the body can't train at all right now).
  private muscleAvailable(ex: Exercise): boolean {
    return this.unlocked(ex) && this.state.fatigue[ex.muscle] < BALANCE.fatigueMax && this.state.rest[ex.muscle] <= 0;
  }
  private autoSwitch(): boolean {
    if (this.state.hunger <= 0 || this.state.health <= 0) return false;
    // prefer the player's chosen exercise, then fall back to any available one
    const pref = EXERCISES.find((e) => e.id === this.state.preferredExercise);
    const order = pref ? [pref, ...EXERCISES.filter((e) => e.id !== pref.id)] : EXERCISES;
    for (const ex of order) {
      if (this.muscleAvailable(ex)) {
        if (ex.id !== this.state.currentExercise) this.selectExercise(ex.id, false);
        return true;
      }
    }
    return false;
  }

  tick(dt: number) {
    for (const m of Object.keys(this.state.fatigue) as Muscle[]) {
      const active = this.exercise().muscle === m;
      const rate = active ? BALANCE.fatigueRecoverPerSec * 0.4 : BALANCE.fatigueRecoverPerSec;
      this.state.fatigue[m] = Math.max(0, this.state.fatigue[m] - rate * dt);
      // count down the forced rest between sets for each muscle
      if (this.state.rest[m] > 0) this.state.rest[m] = Math.max(0, this.state.rest[m] - dt);
    }
    for (const ex of EXERCISES) {
      if (ex.id !== this.state.currentExercise && (this.state.reps[ex.id] ?? 0) > 0) {
        this.state.reps[ex.id] = Math.max(0, this.state.reps[ex.id] - 2 * dt);
      }
    }
    // forced hospitalization: count down the recovery lockout; when it ends, clear
    // all negative statuses so the player leaves the hospital completely fresh.
    if (this.state.recovering > 0) {
      this.state.recovering = Math.max(0, this.state.recovering - dt);
      if (this.state.recovering <= 0) this.clearNegativeStatuses();
      return; // bedridden: skip training/jobs/automation this tick
    }
    // health: anabolic side effects drain it; recovers slowly when clean
    const se = this.sideEffects();
    this.state.health = Math.max(0, Math.min(100, this.state.health + (0.4 - se * 0.06) * dt));
    // starving (0 hunger) steadily degrades health — can drive you into collapse
    if (this.state.hunger <= 0) this.state.health = Math.max(0, this.state.health - BALANCE.starveHealthDrain * dt);
    // collapse: health bottomed out → emergency hospitalization (20% gains lost)
    if (this.state.health <= BALANCE.collapseHealth) this.collapse();
    // hunger slowly drops over time; diet conditioning drifts back to 0
    this.state.hunger = Math.max(0, this.state.hunger - 0.4 * dt * this.hungerDrainMult());
    if (this.state.dietCondition > 0) this.state.dietCondition = Math.max(0, this.state.dietCondition - 0.6 * dt);
    else if (this.state.dietCondition < 0) this.state.dietCondition = Math.min(0, this.state.dietCondition + 0.6 * dt);
    // Personal Chef: when hunger runs low, auto-buy the marked food (spends money)
    if (this.state.chefHired && this.state.markedFood && this.state.hunger < BALANCE.chefHungerThreshold) {
      const food = FOODS.find((f) => f.id === this.state.markedFood);
      if (food && this.state.money >= food.cost) {
        this.eat(food.id);
        this.chefEvents.push({ name: food.name, emoji: food.emoji, cost: food.cost });
      }
    }
    // tick down food buffs
    if (this.state.buffs.length) {
      for (const b of this.state.buffs) b.remaining -= dt;
      this.state.buffs = this.state.buffs.filter((b) => b.remaining > 0);
    }
    // tick down active anabolic cycles — when one ends, its effects + side effects stop
    for (const id of Object.keys(this.state.activeItems)) {
      const left = this.state.activeItems[id] - dt;
      if (left <= 0) delete this.state.activeItems[id];
      else this.state.activeItems[id] = left;
    }
    // work the active job; food-requiring jobs burn hunger; pay out when finished
    if (this.state.activeJob) {
      const job = this.activeJobObj();
      if (job?.needsFood) {
        this.state.hunger = Math.max(0, this.state.hunger - 0.8 * dt);
        if (this.state.hunger <= 0) {
          // ran out of food — the job is abandoned (no pay)
          this.state.activeJob = null;
          this.state.jobRemaining = 0;
        }
      }
      if (this.state.activeJob) {
        this.state.jobRemaining -= dt;
        if (this.state.jobRemaining <= 0) {
          if (job) {
            const pay = Math.round(job.pay * this.upgradeMoneyMult());
            this.state.money += pay;
            this.jobEvents.push({ name: job.name, emoji: job.emoji, pay });
          }
          this.state.jobsDone++;
          this.state.activeJob = null;
          this.state.jobRemaining = 0;
        }
      }
    }
    // Business Agent: auto-works the best available job every agentInterval seconds
    if (this.state.agentLevel > 0) {
      this.state.agentTimer -= dt;
      if (this.state.agentTimer <= 0) {
        const job = this.agentBestJob();
        if (job) {
          const pay = Math.round(job.pay * this.upgradeMoneyMult());
          this.state.money += pay;
          this.jobEvents.push({ name: job.name, emoji: job.emoji, pay });
          this.state.jobsDone++;
          if (job.needsFood) this.state.hunger = Math.max(0, this.state.hunger - BALANCE.agentFoodCost);
        }
        this.state.agentTimer = this.agentInterval();
      }
    }
    // Auto-Trainer: perform automatic reps over time
    if (this.state.autoLevel > 0 && this.state.autoEnabled) {
      this.autoAcc += this.autoClicksPerSec() * dt;
      let guard = 0;
      while (this.autoAcc >= 1 && guard++ < 300) {
        this.autoAcc -= 1;
        // snap back to the player's chosen exercise as soon as its muscle is free again
        const pref = EXERCISES.find((e) => e.id === this.state.preferredExercise);
        if (pref && this.state.currentExercise !== pref.id && this.muscleAvailable(pref)) {
          this.selectExercise(pref.id, false);
        }
        // exhausted or resting between sets → switch to a fresh muscle, or stop
        if ((this.muscleFatigue() >= BALANCE.fatigueMax || this.restRemaining() > 0) && !this.autoSwitch()) break;
        if (this.state.hunger <= 0 || this.state.health <= 0) break;
        this.push(); // may partial-charge or complete a rep; state handled inside
      }
    }
  }

  // ---- Persistence ----
  save() {
    this.state.lastSeen = Date.now(); // stamp so offline progress is measured from now
    localStorage.setItem(SAVE_KEY, JSON.stringify(this.state));
  }
  load(): State {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return initialState();
      return { ...initialState(), ...JSON.parse(raw) };
    } catch {
      return initialState();
    }
  }
  reset() {
    localStorage.removeItem(SAVE_KEY);
    this.state = initialState();
    this.effort = 0;
  }
}
