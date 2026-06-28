import { MUSCLES, type Muscle } from "./balance";

export interface Competitor {
  name: string;
  isPlayer: boolean;
  physique: Record<Muscle, number>;
  conditioning: number;
  score: number;
  eliminated: boolean;
}

interface RivalSpec {
  name: string;
  tier: number; // ~ average muscle development
  imbalance: number;
  conditioning: number;
}

const RIVALS: RivalSpec[] = [
  { name: "Rookie Rick", tier: 40, imbalance: 0.5, conditioning: 55 },
  { name: "Gym Bro Gary", tier: 90, imbalance: 0.45, conditioning: 60 },
  { name: "Tank Tony", tier: 180, imbalance: 0.5, conditioning: 62 },
  { name: "Chad Maximus", tier: 320, imbalance: 0.3, conditioning: 72 },
  { name: "Viktor Iron", tier: 520, imbalance: 0.25, conditioning: 80 },
  { name: "Diego Granite", tier: 760, imbalance: 0.2, conditioning: 86 },
  { name: "Magnus Titan", tier: 1050, imbalance: 0.15, conditioning: 92 },
];

export interface Tournament {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  prize: number; // money awarded for winning
  rivalIdx: number[]; // which rivals show up (fewer = less crowded)
  isArnold?: boolean;
}

// Smaller, less crowded shows give less money; the Arnold is the ultimate goal.
export const TOURNAMENTS: Tournament[] = [
  { id: "local", name: "Local Gym Show", emoji: "🥉", desc: "3 weak rivals", prize: 150, rivalIdx: [0, 1, 2] },
  { id: "city", name: "City Championship", emoji: "🥈", desc: "4 rivals", prize: 500, rivalIdx: [1, 2, 3, 4] },
  { id: "regional", name: "Regional Open", emoji: "🥇", desc: "5 tough rivals", prize: 1500, rivalIdx: [2, 3, 4, 5, 6] },
  { id: "national", name: "National Pro", emoji: "🏅", desc: "6 elite rivals", prize: 4000, rivalIdx: [1, 2, 3, 4, 5, 6] },
  { id: "arnold", name: "Arnold Classic", emoji: "🏆", desc: "all 7 legends", prize: 10000, rivalIdx: [0, 1, 2, 3, 4, 5, 6], isArnold: true },
];

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
  const vals = MUSCLES.map((m) => c.physique[m.id]);
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

  constructor(t: Tournament, playerPhysique: Record<Muscle, number>, playerConditioning: number, seed: number) {
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
    this.competitors = [player, ...t.rivalIdx.map((i) => buildRival(RIVALS[i], rand))];
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
