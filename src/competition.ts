import { MUSCLES, JUDGED_MUSCLES, type Muscle } from "./balance";

export interface Competitor {
  name: string;
  isPlayer: boolean;
  physique: Record<Muscle, number>;
  conditioning: number;
  score: number;
  eliminated: boolean;
}

export interface RivalSpec {
  name: string;
  tier: number; // ~ average muscle development
  imbalance: number;
  conditioning: number;
}

// Smoothly escalating field, retuned via Monte-Carlo so each show is a steady step
// up (no flat top): the last shows introduce two new legends above the old cap so
// the Olympia Qualifier and Arnold are genuinely harder, with Zeus the final boss.
const RIVALS: RivalSpec[] = [
  { name: "Rookie Rick", tier: 40, imbalance: 0.5, conditioning: 55 },
  { name: "Gym Bro Gary", tier: 85, imbalance: 0.45, conditioning: 60 },
  { name: "Tank Tony", tier: 165, imbalance: 0.5, conditioning: 64 },
  { name: "Chad Maximus", tier: 300, imbalance: 0.3, conditioning: 72 },
  { name: "Viktor Iron", tier: 480, imbalance: 0.25, conditioning: 80 },
  { name: "Diego Granite", tier: 720, imbalance: 0.2, conditioning: 86 },
  { name: "Magnus Titan", tier: 1020, imbalance: 0.15, conditioning: 90 },
  { name: "Goliath Stone", tier: 1380, imbalance: 0.13, conditioning: 93 },
  { name: "Atlas Prime", tier: 1820, imbalance: 0.12, conditioning: 95 },
  { name: "Kratos Vael", tier: 2360, imbalance: 0.11, conditioning: 96 },
  { name: "Helios Rex", tier: 3050, imbalance: 0.1, conditioning: 98 },
  { name: "Zeus Apex", tier: 3900, imbalance: 0.08, conditioning: 99 },
];

export interface Tournament {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  prize: number; // money awarded for winning
  entryFee: number; // money required (and spent) to enter — paid win or lose
  rivalIdx: number[]; // which rivals show up (fewer = less crowded)
  isArnold?: boolean;
}

// A smooth ladder of shows: each is a modest step up in prize and rival strength,
// with the Arnold (the toughest field) as the summit. Every show charges an entry
// fee (paid win or lose), so entering is a real bet — combined with the steeply
// diminishing rematch payouts, farming an easy show quickly becomes a net loss.
export const TOURNAMENTS: Tournament[] = [
  { id: "local", name: "Local Gym Show", emoji: "🥉", desc: "3 weak rivals", prize: 150, entryFee: 15, rivalIdx: [0, 1, 2] },
  { id: "charity", name: "Charity Showdown", emoji: "🎗️", desc: "3 rivals", prize: 300, entryFee: 30, rivalIdx: [1, 2, 3] },
  { id: "city", name: "City Championship", emoji: "🥈", desc: "3 rivals", prize: 550, entryFee: 50, rivalIdx: [2, 3, 4] },
  { id: "state", name: "State Cup", emoji: "🏵️", desc: "4 rivals", prize: 950, entryFee: 90, rivalIdx: [2, 3, 4, 5] },
  { id: "regional", name: "Regional Open", emoji: "🥇", desc: "4 tough rivals", prize: 1600, entryFee: 150, rivalIdx: [3, 4, 5, 6] },
  { id: "qualifier", name: "Pro Qualifier", emoji: "🎫", desc: "4 tough rivals", prize: 2600, entryFee: 250, rivalIdx: [4, 5, 6, 7] },
  { id: "national", name: "National Pro", emoji: "🏅", desc: "5 elite rivals", prize: 4200, entryFee: 400, rivalIdx: [4, 5, 6, 7, 8] },
  { id: "international", name: "International Invitational", emoji: "🌍", desc: "5 elite rivals", prize: 6500, entryFee: 600, rivalIdx: [5, 6, 7, 8, 9] },
  { id: "olympiaq", name: "Olympia Qualifier", emoji: "🎟️", desc: "6 elite rivals", prize: 8200, entryFee: 800, rivalIdx: [5, 6, 7, 8, 9, 10] },
  { id: "arnold", name: "Arnold Classic", emoji: "🏆", desc: "all 7 legends", prize: 11000, entryFee: 1000, rivalIdx: [5, 6, 7, 8, 9, 10, 11], isArnold: true },
];

// Endless Olympia: a synthetic field of elite rivals all near a stage-scaled tier.
const ENDLESS_NAMES = ["Titan", "Colossus", "Hyperion", "Maximus", "Nemesis", "Vortex", "Onyx", "Spartan"];
export function endlessField(tier: number, size: number): RivalSpec[] {
  return Array.from({ length: size }, (_, i) => ({
    name: `${ENDLESS_NAMES[i % ENDLESS_NAMES.length]} ${String.fromCharCode(65 + (i % 26))}`,
    tier: Math.round(tier * (0.9 + 0.2 * (i / Math.max(1, size - 1)))), // spread around the tier
    imbalance: 0.08,
    conditioning: 97 + (i % 3),
  }));
}

function rng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function buildRival(spec: RivalSpec, rand: () => number): Competitor {
  const physique = {} as Record<Muscle, number>;
  for (const m of MUSCLES) {
    const wobble = 1 - spec.imbalance + rand() * spec.imbalance * 2;
    physique[m.id] = Math.round(spec.tier * wobble);
  }
  return {
    name: spec.name,
    isPlayer: false,
    physique,
    conditioning: spec.conditioning + (rand() * 6 - 3),
    score: 0,
    eliminated: false,
  };
}

export function judgeScore(c: Competitor, rand: () => number): number {
  const vals = JUDGED_MUSCLES.map((m) => c.physique[m.id]);
  const mass = vals.reduce((a, b) => a + b, 0) / vals.length;
  const mean = mass || 1;
  const std = Math.sqrt(vals.reduce((a, v) => a + (v - mean) ** 2, 0) / vals.length);
  const symmetry = (mean / (mean + std)) * 100;
  const massPts = Math.log10(mass + 1) * 30;
  return massPts * 0.5 + symmetry * 0.3 + c.conditioning * 0.2 + (rand() * 4 - 2);
}

export interface RoundResult {
  roundName: string;
  ranking: Competitor[];
  cut: Competitor[];
  finished: boolean;
  winner?: Competitor;
}

export class Competition {
  competitors: Competitor[];
  tournament: Tournament;
  roundNo = 0;
  finished = false;
  winner?: Competitor;

  // customRivals overrides the tournament's fixed roster (used by the Endless Olympia).
  constructor(
    t: Tournament,
    playerPhysique: Record<Muscle, number>,
    playerConditioning: number,
    seed: number,
    customRivals?: RivalSpec[],
  ) {
    this.tournament = t;
    const rand = rng(seed);
    const player: Competitor = {
      name: "You",
      isPlayer: true,
      physique: { ...playerPhysique },
      conditioning: playerConditioning,
      score: 0,
      eliminated: false,
    };
    const specs = customRivals ?? t.rivalIdx.map((i) => RIVALS[i]);
    this.competitors = [player, ...specs.map((s) => buildRival(s, rand))];
  }

  get currentRoundName(): string {
    const alive = this.competitors.filter((c) => !c.eliminated).length;
    if (alive <= 2) return "Finals";
    if (this.roundNo === 0) return "Prejudging";
    return `Round ${this.roundNo + 1}`;
  }

  playerEliminated(): boolean {
    return this.competitors.find((c) => c.isPlayer)!.eliminated;
  }

  playerWon(): boolean {
    return this.finished && !!this.winner?.isPlayer;
  }

  nextRound(seed: number): RoundResult {
    const rand = rng(seed + this.roundNo * 7919);
    const roundName = this.currentRoundName;
    const alive = this.competitors.filter((c) => !c.eliminated);

    for (const c of alive) c.score = judgeScore(c, rand);
    const ranking = [...alive].sort((a, b) => b.score - a.score);

    const keep = alive.length <= 2 ? 1 : Math.max(1, Math.ceil(alive.length / 2));
    const advancing = ranking.slice(0, keep);
    const cut = ranking.slice(keep);
    for (const c of cut) c.eliminated = true;
    this.roundNo++;

    if (keep <= 1) {
      this.finished = true;
      this.winner = advancing[0];
      return { roundName, ranking, cut, finished: true, winner: this.winner };
    }
    return { roundName, ranking, cut, finished: false };
  }
}
