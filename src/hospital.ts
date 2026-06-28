// Hospital treatments. Used when health gets too low (mostly from anabolics'
// side effects). Each restores health but burns muscle/shape while bedridden.
export interface Treatment {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  heal: number; // health points restored
  shapeLoss: number; // fraction of physique lost (0.1 = -10%)
  desc: string;
}

export const TREATMENTS: Treatment[] = [
  { id: "checkup", name: "Checkup & Rest", emoji: "🩺", cost: 150, heal: 30, shapeLoss: 0.08, desc: "+30 health, -8% shape" },
  { id: "iv", name: "IV Therapy", emoji: "💧", cost: 400, heal: 60, shapeLoss: 0.18, desc: "+60 health, -18% shape" },
  { id: "admit", name: "Full Hospitalization", emoji: "🏥", cost: 1000, heal: 100, shapeLoss: 0.32, desc: "Full health, -32% shape" },
];
