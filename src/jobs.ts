// Side jobs the character works to earn money before he can win competitions.
// Each unlocks by level, takes some time, and pays out when finished.
export interface Job {
  id: string;
  name: string;
  emoji: string;
  unlockLevel: number;
  pay: number;
  duration: number; // seconds to complete
  needsFood: boolean; // requires (and burns) hunger to work
}

// A smooth ladder: small, gentle steps in pay, time and unlock level so each new
// job is a modest upgrade over the last (never a sudden jump). Pay-per-second still
// climbs steadily, so unlocking the next job is always worth it.
export const JOBS: Job[] = [
  // Last-resort income: pays almost nothing but needs no food (works while starving).
  { id: "beg", name: "Beg by the Gym Door", emoji: "🥺", unlockLevel: 0, pay: 3, duration: 6, needsFood: false },
  { id: "clean", name: "Clean the Gym", emoji: "🧹", unlockLevel: 0, pay: 12, duration: 7, needsFood: true },
  { id: "rack", name: "Rack the Weights", emoji: "🏋️", unlockLevel: 1, pay: 18, duration: 8, needsFood: true },
  { id: "towels", name: "Fold the Towels", emoji: "🧺", unlockLevel: 2, pay: 26, duration: 9, needsFood: true },
  { id: "supps", name: "Sell Supplements", emoji: "🥤", unlockLevel: 3, pay: 36, duration: 10, needsFood: true },
  { id: "smoothie", name: "Blend Protein Shakes", emoji: "🧃", unlockLevel: 4, pay: 48, duration: 11, needsFood: true },
  { id: "reception", name: "Work the Reception", emoji: "🛎️", unlockLevel: 5, pay: 62, duration: 12, needsFood: true },
  { id: "assist", name: "Assist Students", emoji: "🧑‍🏫", unlockLevel: 6, pay: 80, duration: 13, needsFood: true },
  { id: "warmup", name: "Lead a Warm-up", emoji: "🤸", unlockLevel: 7, pay: 90, duration: 13, needsFood: true },
  { id: "spotter", name: "Spot Lifters", emoji: "🤝", unlockLevel: 8, pay: 100, duration: 14, needsFood: true },
  { id: "bootcamp", name: "Run a Bootcamp", emoji: "🪖", unlockLevel: 9, pay: 112, duration: 15, needsFood: true },
  { id: "personal", name: "Personal Trainer", emoji: "💪", unlockLevel: 10, pay: 125, duration: 16, needsFood: true },
  { id: "judge", name: "Judge a Local Show", emoji: "🧑‍⚖️", unlockLevel: 11, pay: 140, duration: 17, needsFood: true },
  { id: "classes", name: "Teach a Class", emoji: "📣", unlockLevel: 12, pay: 155, duration: 18, needsFood: true },
  { id: "host", name: "Host an Open Day", emoji: "🎪", unlockLevel: 13, pay: 172, duration: 19, needsFood: true },
  { id: "security", name: "Party Security", emoji: "🛡️", unlockLevel: 14, pay: 190, duration: 20, needsFood: true },
  { id: "brandpose", name: "Pose for a Brand", emoji: "🧢", unlockLevel: 15, pay: 210, duration: 21, needsFood: true },
  { id: "photo", name: "Fitness Photoshoot", emoji: "📸", unlockLevel: 16, pay: 230, duration: 22, needsFood: true },
  { id: "cover", name: "Magazine Cover", emoji: "📰", unlockLevel: 17, pay: 255, duration: 23, needsFood: true },
  { id: "dancer", name: "Party Dancer", emoji: "🕺", unlockLevel: 18, pay: 280, duration: 24, needsFood: true },
  { id: "ambassador", name: "Brand Ambassador", emoji: "🏷️", unlockLevel: 19, pay: 310, duration: 25, needsFood: true },
  { id: "influencer", name: "Sponsored Post", emoji: "📱", unlockLevel: 20, pay: 340, duration: 26, needsFood: true },
  { id: "cameo", name: "Reality TV Cameo", emoji: "🎬", unlockLevel: 21, pay: 375, duration: 27, needsFood: true },
  { id: "bachelor", name: "Bachelorette Gig", emoji: "🎉", unlockLevel: 22, pay: 410, duration: 28, needsFood: true },
  { id: "expo", name: "Fitness Expo Star", emoji: "🏟️", unlockLevel: 23, pay: 455, duration: 29, needsFood: true },
  { id: "commercial", name: "TV Commercial", emoji: "📺", unlockLevel: 25, pay: 500, duration: 30, needsFood: true },
  // High tier — bigger paychecks once you're an established physique star
  { id: "franchise", name: "Gym Franchise Promo", emoji: "🏢", unlockLevel: 27, pay: 600, duration: 32, needsFood: true },
  { id: "stunt", name: "Movie Stunt Double", emoji: "🤾", unlockLevel: 30, pay: 720, duration: 34, needsFood: true },
  { id: "suppdeal", name: "Supplement Brand Deal", emoji: "🧪", unlockLevel: 33, pay: 860, duration: 36, needsFood: true },
  { id: "national", name: "National Ad Campaign", emoji: "🗞️", unlockLevel: 36, pay: 1020, duration: 38, needsFood: true },
  { id: "celebrity", name: "Celebrity Trainer", emoji: "🌟", unlockLevel: 40, pay: 1200, duration: 40, needsFood: true },
];
