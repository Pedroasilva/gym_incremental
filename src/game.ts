import { BALANCE, EXERCISES, MUSCLES, type Muscle, type Exercise } from "./balance";
import { FOODS, type ActiveBuff } from "./nutrition";
import { MARKET, type Modifiers } from "./market";
import { TREATMENTS } from "./hospital";
import { JOBS, type Job } from "./jobs";
import { ACHIEVEMENTS, type Achievement } from "./achievements";

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
  currentExercise: string; // id
  weight: Record<string, number>; // chosen weight per exercise (kg)
  reps: Record<string, number>;
  setReps: Record<string, number>; // reps done in the current set, per exercise (0..repsPerSet)
  rest: Record<Muscle, number>; // forced rest remaining per muscle (seconds) between sets
  setsCompleted: number; // total sets finished (stat / achievements)
  setCondition: number; // conditioning earned from completing sets (the routine)
  fatigue: Record<Muscle, number>;
  physique: Record<Muscle, number>;
  owned: Record<string, boolean>; // market items owned
  buffs: ActiveBuff[]; // active food buffs
  activeJob: string | null; // job currently being worked
  jobRemaining: number; // seconds left on the active job
  autoLevel: number; // Auto-Trainer level (idle reps)
  jobsDone: number; // total jobs completed
  wonTournaments: Record<string, boolean>; // tournaments already won (first-win bonus)
  protein: number; // prestige currency (persists across a New Season reset)
  achievements: Record<string, boolean>; // unlocked achievements (persist across prestige)
  arnoldWon: boolean;
}

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
    currentExercise: "crunch",
    weight: {},
    reps: {},
    setReps: {},
    rest: { core: 0, legs: 0, chest: 0, arms: 0, back: 0, fullbody: 0 },
    setsCompleted: 0,
    setCondition: 0,
    fatigue: { core: 0, legs: 0, chest: 0, arms: 0, back: 0, fullbody: 0 },
    physique: { core: 0, legs: 0, chest: 0, arms: 0, back: 0, fullbody: 0 },
    owned: {},
    buffs: [],
    activeJob: null,
    jobRemaining: 0,
    autoLevel: 0,
    jobsDone: 0,
    wonTournaments: {},
    protein: 0,
    achievements: {},
    arnoldWon: false,
  };
}

export class Game {
  state: State;
  effort = 0;
  private autoAcc = 0; // fractional auto-clicks carried between ticks

  constructor() {
    this.state = this.load();
  }

  // ---- Queries ----
  exercise(): Exercise {
    return EXERCISES.find((e) => e.id === this.state.currentExercise)!;
  }
  // Heaviest weight the player can currently load, from strength + gear, per lift.
  maxLift(ex = this.exercise()): number {
    const cap = (BALANCE.liftCapBase + Math.sqrt(this.state.strength) * BALANCE.liftCapSlope) *
      ex.liftFactor * this.itemMods().liftMult;
    return Math.max(ex.minWeight, Math.floor(cap / ex.step) * ex.step);
  }
  selectedWeight(ex = this.exercise()): number {
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
    return this.state.level >= ex.unlockLevel;
  }
  owns(id: string): boolean {
    return !!this.state.owned[id];
  }

  // ---- Aggregated modifiers from owned market items ----
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
    };
    for (const item of MARKET) {
      if (!this.owns(item.id)) continue;
      const m = item.mods;
      acc.clickAdd += m.clickAdd ?? 0;
      acc.xpMult *= m.xpMult ?? 1;
      acc.muscleMult *= m.muscleMult ?? 1;
      acc.fatigueMult *= m.fatigueMult ?? 1;
      acc.conditionMod += m.conditionMod ?? 0;
      acc.moneyMult *= m.moneyMult ?? 1;
      acc.sideEffect += m.sideEffect ?? 0;
      acc.liftMult *= m.liftMult ?? 1;
    }
    return acc;
  }

  private buffMult(key: "xpMult" | "clickMult" | "muscleMult"): number {
    return this.state.buffs.reduce((a, b) => a * b[key], 1);
  }

  globalMultiplier(): number {
    return (1 + this.state.level * 0.05) * this.prestigeMult();
  }

  // ---- Prestige (New Season / Bulk-Cut) ----
  // Permanent multiplier from accumulated Protein: +10% to all gains each.
  prestigeMult(): number {
    return 1 + this.state.protein * 0.1;
  }
  // Protein you'd earn by resetting now, based on accumulated strength.
  proteinGain(): number {
    return Math.floor(Math.sqrt(this.state.strength / 500));
  }
  canPrestige(): boolean {
    return this.proteinGain() >= 1;
  }
  prestige(): boolean {
    const gain = this.proteinGain();
    if (gain < 1) return false;
    const keepProtein = this.state.protein + gain;
    const keepArnold = this.state.arnoldWon;
    const keepAchievements = this.state.achievements;
    this.state = initialState();
    this.state.protein = keepProtein;
    this.state.arnoldWon = keepArnold;
    this.state.achievements = keepAchievements;
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
    return Math.max(0, this.itemMods().sideEffect);
  }

  // Effort added per click, after gear, buffs and hunger.
  effectiveClick(): number {
    const base = BALANCE.clickPower + this.itemMods().clickAdd;
    return Math.max(1, base) * this.buffMult("clickMult") * this.hungerFactor() * this.healthFactor() * this.fatigueFactor();
  }

  // Stage conditioning shown to the judges (symmetry + diet + gear - side effects).
  conditioning(): number {
    const vals = MUSCLES.map((m) => this.state.physique[m.id]);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length || 1;
    const std = Math.sqrt(vals.reduce((a, v) => a + (v - mean) ** 2, 0) / vals.length);
    const symmetry = mean / (mean + std); // 0..1
    const base = 40 + symmetry * 45;
    const value =
      base + this.state.setCondition + this.state.dietCondition + this.itemMods().conditionMod - this.sideEffects();
    return Math.max(0, Math.min(100, Math.round(value)));
  }

  repCost(ex = this.exercise()): number {
    const n = Math.min(this.currentReps(ex), BALANCE.decayCap);
    return BALANCE.baseCost * this.selectedWeight(ex) * Math.pow(BALANCE.decay, n);
  }

  // ---- Actions ----
  selectExercise(id: string) {
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

  push(): boolean {
    const ex = this.exercise();
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

    const xp = (weight * BALANCE.xpPerRepFactor || 1) * this.globalMultiplier() * mods.xpMult * this.buffMult("xpMult");
    this.state.strength += xp;
    this.state.xp += xp;
    // reps no longer earn money — money comes only from competition prizes

    const muscleMult = mods.muscleMult * this.buffMult("muscleMult") * this.prestigeMult();
    const gain = (weight * 0.1 + 0.2) * muscleMult;
    if (ex.muscle === "fullbody") {
      for (const m of Object.keys(this.state.physique) as Muscle[]) this.state.physique[m] += gain * 0.3;
    } else {
      this.state.physique[ex.muscle] += gain;
    }

    this.state.fatigue[ex.muscle] = Math.min(
      BALANCE.fatigueMax,
      this.state.fatigue[ex.muscle] + (weight * BALANCE.fatiguePerRepFactor + 2) * mods.fatigueMult,
    );
    this.state.hunger = Math.max(0, this.state.hunger - (weight * 0.015 + 0.8));
    // overtraining: each rep wears down health; rest/eat/work lets it recover
    this.state.health = Math.max(0, this.state.health - (BALANCE.healthDrainBase + weight * BALANCE.healthDrainWeight));

    // Sets (séries): every repsPerSet reps completes a set. Finishing a set is
    // what truly builds the body — it grants a strength bonus, bumps conditioning,
    // and forces a rest pause on that muscle before the next set can begin.
    this.state.setReps[ex.id] = this.setReps(ex) + 1;
    if (this.state.setReps[ex.id] >= BALANCE.repsPerSet) {
      this.state.setReps[ex.id] = 0;
      this.state.rest[ex.muscle] = BALANCE.restSeconds;
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
    if (!item || this.owns(itemId) || this.state.money < item.cost) return false;
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

  // First win of a tournament pays the full prize; rematches pay 20% (exhibition),
  // so jobs stay relevant and shows can't be farmed for trivial infinite money.
  claimPrize(tournamentId: string, prize: number): { amount: number; first: boolean } {
    const first = !this.state.wonTournaments[tournamentId];
    this.state.wonTournaments[tournamentId] = true;
    const amount = Math.round((first ? prize : prize * 0.2) * this.itemMods().moneyMult);
    this.state.money += amount;
    return { amount, first };
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
  // Switch to an unlocked exercise whose muscle isn't exhausted. Returns false if
  // none is available (or the body can't train at all right now).
  private autoSwitch(): boolean {
    if (this.state.hunger <= 0 || this.state.health <= 0) return false;
    for (const ex of EXERCISES) {
      if (this.unlocked(ex) && this.state.fatigue[ex.muscle] < BALANCE.fatigueMax && this.state.rest[ex.muscle] <= 0) {
        if (ex.id !== this.state.currentExercise) this.selectExercise(ex.id);
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
    // health: anabolic side effects drain it; recovers slowly when clean
    const se = this.sideEffects();
    this.state.health = Math.max(0, Math.min(100, this.state.health + (0.4 - se * 0.06) * dt));
    if (this.state.hunger <= 0) this.state.health = Math.max(0, this.state.health - 0.5 * dt);
    // hunger slowly drops over time; diet conditioning drifts back to 0
    this.state.hunger = Math.max(0, this.state.hunger - 0.4 * dt);
    if (this.state.dietCondition > 0) this.state.dietCondition = Math.max(0, this.state.dietCondition - 0.6 * dt);
    else if (this.state.dietCondition < 0) this.state.dietCondition = Math.min(0, this.state.dietCondition + 0.6 * dt);
    // tick down food buffs
    if (this.state.buffs.length) {
      for (const b of this.state.buffs) b.remaining -= dt;
      this.state.buffs = this.state.buffs.filter((b) => b.remaining > 0);
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
          if (job) this.state.money += job.pay;
          this.state.jobsDone++;
          this.state.activeJob = null;
          this.state.jobRemaining = 0;
        }
      }
    }
    // Auto-Trainer: perform automatic reps over time
    if (this.state.autoLevel > 0) {
      this.autoAcc += this.autoClicksPerSec() * dt;
      let guard = 0;
      while (this.autoAcc >= 1 && guard++ < 300) {
        this.autoAcc -= 1;
        // exhausted or resting between sets → switch to a fresh muscle, or stop
        if ((this.muscleFatigue() >= BALANCE.fatigueMax || this.restRemaining() > 0) && !this.autoSwitch()) break;
        if (this.state.hunger <= 0 || this.state.health <= 0) break;
        this.push(); // may partial-charge or complete a rep; state handled inside
      }
    }
  }

  // ---- Persistence ----
  save() {
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
