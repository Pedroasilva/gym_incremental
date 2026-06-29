import "./style.css";
import { Game } from "./game";
import { BALANCE, EXERCISES, JUDGED_MUSCLES, MUSCLES } from "./balance";
import { FOODS } from "./nutrition";
import { MARKET, CATEGORY_LABEL, type Category } from "./market";
import { TREATMENTS } from "./hospital";
import { JOBS } from "./jobs";
import { Competition, TOURNAMENTS, endlessField, type RoundResult, type Tournament } from "./competition";
import { ACHIEVEMENTS } from "./achievements";
import { PRESTIGE_UPGRADES } from "./prestige";
import { playSound, isMuted, toggleMute } from "./sound";
import { initWakeLock, wakeLockSupported, isWakeLockOn, setWakeLock } from "./wakelock";

const game = new Game();
const app = document.querySelector<HTMLDivElement>("#app")!;

app.innerHTML = `
  <header class="stats">
    <div class="stat"><span class="sicon">💪</span><span class="sval" id="strength">0</span><span class="slbl">Strength</span></div>
    <div class="stat"><span class="sicon">⭐</span><span class="sval" id="level">0</span><span class="slbl">Level</span></div>
    <div class="stat"><span class="sicon">💵</span><span class="sval" id="money">60</span><span class="slbl">Money</span></div>
    <div class="stat"><span class="sicon">🎽</span><span class="sval" id="condhdr">40</span><span class="slbl">Condition</span></div>
  </header>
  <div class="xpbar"><span id="xpfill" class="xpfill"></span><b id="xptxt"></b></div>
  <div class="meters">
    <div class="meter">
      <span class="mlbl">🍽️ Hunger</span>
      <div class="mbar"><span id="hungerfill"></span></div>
      <b id="hungerval">100</b>
    </div>
    <div class="meter">
      <span class="mlbl">❤️ Health</span>
      <div class="mbar"><span id="healthfill"></span></div>
      <b id="healthval">100</b>
    </div>
  </div>

  <nav class="tabs">
    <button id="tab-gym" class="tab active">🏋️</button>
    <button id="tab-work" class="tab">💼</button>
    <button id="tab-food" class="tab">🍽️</button>
    <button id="tab-market" class="tab">🛒</button>
    <button id="tab-hospital" class="tab">🏥</button>
    <button id="tab-arnold" class="tab">🏆</button>
    <button id="tab-prestige" class="tab">🥤</button>
    <button id="tab-achv" class="tab">🏅</button>
  </nav>

  <div class="content">
  <div id="view-gym">
    <main class="stage">
      <section class="avatar-box">
        <div id="avatar" class="avatar">🧍</div>
        <div id="avatarlbl" class="avatarlbl">Scrawny</div>
      </section>
      <section class="workout">
        <h2 id="exname">Crunch</h2>
        <div class="weight">
          <button id="weightMin" class="wextreme">MIN</button>
          <button id="weightDown">−</button>
          <span>Weight: <b id="weightval">0</b> / <span id="weightmax">0</span> kg</span>
          <button id="weightUp">+</button>
          <button id="weightMax" class="wextreme">MAX</button>
        </div>
        <div class="settrack">
          <span class="setlbl">Set · <b id="setreps">0</b>/<span id="setper">12</span> reps · <b id="setsdone">0</b> done · <b id="totalreps">0</b> total reps</span>
          <div id="setdots" class="setdots"></div>
        </div>
        <button id="bar" class="bar" aria-label="Do a rep">
          <span id="effort" class="effort"></span>
          <span id="barlbl" class="barlbl">CLICK TO PUSH</span>
        </button>
        <p class="reptxt">Warm-up reps: <b id="warmup">0</b> — <span id="hint">starts hard…</span></p>
        <div class="fatigue">
          <span>Fatigue <b id="fatname">core</b><span id="fatpen" class="muted"></span></span>
          <div class="fatbar"><span id="fatfill" class="fatfill"></span></div>
        </div>
        <div id="buffs" class="buffs"></div>
      </section>
    </main>
    <div class="autobox">
      <span class="autolbl">🤖 Auto-Trainer <b id="autolvl">0</b><span id="autorate" class="muted"></span></span>
      <span class="autoctrl">
        <button id="autotoggle" class="autotoggle hidden">⏸ Pause</button>
        <button id="autobuy" class="autobuy">Hire</button>
      </span>
    </div>
    <nav id="exlist" class="exlist"></nav>
  </div>

  <div id="view-work" class="hidden">
    <section class="panel">
      <h2>💼 Work</h2>
      <p class="muted">Earn money on the side while you build toward competitions. Each job takes time and pays when it's done — you can keep training meanwhile.</p>
      <p id="jobstatus" class="cond"></p>
      <div class="autobox">
        <span class="autolbl">🧑‍💼 Business Agent <b id="agentlvl">0</b><span id="agentrate" class="muted"></span></span>
        <button id="agentbuy" class="autobuy">Hire</button>
      </div>
      <div id="joblist" class="grid"></div>
    </section>
  </div>

  <div id="view-food" class="hidden">
    <section class="panel">
      <h2>🍽️ Food</h2>
      <p class="muted">Eat to restore hunger. Clean food boosts gains & conditioning; junk fills you fast but wrecks your stage look.</p>
      <div class="autobox">
        <span class="autolbl">👨‍🍳 Personal Chef<span id="chefrate" class="muted"></span>
          <span class="chefpick">Buys: <select id="cheffood"></select></span>
        </span>
        <button id="chefbuy" class="autobuy">Hire</button>
      </div>
      <div id="foodlist" class="grid"></div>
    </section>
  </div>

  <div id="view-market" class="hidden">
    <section class="panel">
      <h2>🛒 Market</h2>
      <p class="muted">Buy gear & supplements. Anabolics give huge gains but raise side effects that drain health & conditioning — offset with vitamins & liver support.</p>
      <div id="marketlist"></div>
    </section>
  </div>

  <div id="view-hospital" class="hidden">
    <section class="panel">
      <h2>🏥 Hospital</h2>
      <p class="muted">When health gets too low (usually from anabolics), get treated. Treatments restore health but you lose shape while bedridden.</p>
      <p class="cond">Health: <b id="hosphealth">100</b>/100 · side effects: <b id="hospside">0</b>/turn</p>
      <div id="hospitallist" class="grid"></div>
    </section>
  </div>

  <div id="view-arnold" class="hidden">
    <section class="panel">
      <h2>🏆 Competitions</h2>
      <p class="muted">Win smaller shows for cash, then chase the Arnold Classic. Judges score mass, symmetry & conditioning.</p>
      <div id="physique" class="physique"></div>
      <p class="cond">Stage conditioning: <b id="condval">0</b>/100 · side effects: <b id="sideval">0</b></p>
      <div id="arnold-body"></div>
      <p id="arnold-msg" class="arnold-msg"></p>
    </section>
  </div>

  <div id="view-prestige" class="hidden">
    <section class="panel">
      <h2>🥤 New Season (Prestige)</h2>
      <p class="muted">Cut down and restart your prep. You lose all current progress (strength, level, money, gear, physique) but earn permanent <b>Protein</b> that boosts every future gain. Arnold Champion status is kept.</p>
      <p class="cond">Division: <b id="prestdiv">🩳 Men's Physique</b> <span id="prestnext" class="muted"></span></p>
      <p class="cond">Protein: <b id="proteinval">0</b> 🥤 · permanent bonus: <b id="prestmult">+0%</b> to all gains</p>
      <p class="cond">Reset now to earn: <b id="proteingain">0</b> 🥤</p>
      <div class="arow"><button id="prestige-btn" class="primary">Start New Season</button></div>
      <p id="prestige-msg" class="arnold-msg"></p>
    </section>
    <section class="panel">
      <h2>🧬 Protein Upgrades</h2>
      <p class="muted">Spend <b>Protein</b> 🥤 on permanent upgrades — they persist across every New Season. Several tame the downsides (fatigue, side effects, hunger).</p>
      <div id="upgradelist" class="grid"></div>
    </section>
  </div>

  <div id="view-achv" class="hidden">
    <section class="panel">
      <h2>🏅 Achievements</h2>
      <p class="muted">Milestones you've unlocked. They persist across a New Season reset.</p>
      <p class="cond">Unlocked: <b id="achvcount">0</b> / <b id="achvtotal">0</b></p>
      <div id="achvlist" class="grid"></div>
    </section>
  </div>

  <footer class="footer">
    <button id="reset" class="reset">Reset progress</button>
    <button id="mute" class="reset">🔊 Sound</button>
    <button id="wakelock" class="reset hidden">📱 Keep awake</button>
    <span class="ver">v0.5 — From Scrawny to Swole</span>
  </footer>
  </div>

  <div id="toasts" class="toasts"></div>
`;

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

// ===== Global: pointer/touch only — block ALL keyboard button activation =====
// Stop keyboard-synthesized clicks (Enter/Space, detail === 0) before they reach
// any button handler, and suppress the key itself so nothing auto-repeats.
app.addEventListener(
  "click",
  (e) => {
    if ((e as MouseEvent).detail === 0 && (e.target as HTMLElement)?.closest("button")) {
      e.stopImmediatePropagation();
      e.preventDefault();
    }
  },
  true,
);
app.addEventListener("keydown", (e) => {
  if ((e.key === "Enter" || e.key === " " || e.key === "Spacebar") && (e.target as HTMLElement)?.closest("button")) {
    e.preventDefault();
  }
});

// ================= Tabs =================
type Tab = "gym" | "work" | "food" | "market" | "hospital" | "arnold" | "prestige" | "achv";
const TABS: Tab[] = ["gym", "work", "food", "market", "hospital", "arnold", "prestige", "achv"];
function showTab(which: Tab) {
  for (const t of TABS) {
    $("view-" + t).classList.toggle("hidden", which !== t);
    $("tab-" + t).classList.toggle("active", which === t);
  }
  if (which === "work") renderWork();
  if (which === "food") renderFood();
  if (which === "market") renderMarket();
  if (which === "hospital") renderHospital();
  if (which === "arnold") renderArnold();
  if (which === "prestige") renderPrestige();
  if (which === "achv") renderAchievements();
}
TABS.forEach((t) => $("tab-" + t).addEventListener("click", () => showTab(t)));

// ================= Avatar =================
function avatar(strength: number): { emoji: string; label: string } {
  if (game.state.arnoldWon) return { emoji: "🏆", label: "Arnold Champion" };
  if (strength >= 5000) return { emoji: "🦍", label: "Beast" };
  if (strength >= 1500) return { emoji: "🏋️", label: "Strong" };
  if (strength >= 400) return { emoji: "💪", label: "Toned" };
  if (strength >= 80) return { emoji: "🚶", label: "In Shape" };
  return { emoji: "🧍", label: "Scrawny" };
}

// ================= Gym =================
// Floating tooltip appended to <body> so it's never clipped by the scroll container,
// and clamped to the viewport so edge buttons don't get cut off.
const tipEl = document.createElement("div");
tipEl.className = "tip hidden";
document.body.appendChild(tipEl);
function showTip(target: HTMLElement, text: string) {
  tipEl.textContent = text;
  tipEl.classList.remove("hidden");
  const r = target.getBoundingClientRect();
  const t = tipEl.getBoundingClientRect();
  const left = Math.max(8, Math.min(r.left + r.width / 2 - t.width / 2, window.innerWidth - t.width - 8));
  let top = r.top - t.height - 8;
  if (top < 8) top = r.bottom + 8; // flip below if there's no room above
  tipEl.style.left = left + "px";
  tipEl.style.top = top + "px";
}
function hideTip() {
  tipEl.classList.add("hidden");
}
// Buff tooltip text: the food's name + the multipliers it's currently providing.
function buffTip(b: { name: string; xpMult: number; clickMult: number; muscleMult: number }): string {
  const parts: string[] = [];
  if (b.xpMult !== 1) parts.push(`×${b.xpMult} XP`);
  if (b.clickMult !== 1) parts.push(`×${b.clickMult} energy`);
  if (b.muscleMult !== 1) parts.push(`×${b.muscleMult} muscle`);
  return `${b.name}${parts.length ? " · " + parts.join(" · ") : ""}`;
}
// Delegated hover tooltip for the active-buff chips (they're rebuilt every frame).
$("buffs").addEventListener("pointerover", (e) => {
  const chip = (e.target as HTMLElement).closest<HTMLElement>(".buff[data-tip]");
  if (chip) showTip(chip, chip.dataset.tip!);
});
$("buffs").addEventListener("pointerout", hideTip);

const MUSCLE_NAME: Record<string, string> = Object.fromEntries(MUSCLES.map((m) => [m.id, m.name]));
const ACH_NAME: Record<string, string> = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a.name]));
// Why an exercise is still locked (achievement requirement takes priority over level).
function lockReason(ex: (typeof EXERCISES)[number]): string {
  if (ex.requiresAchievement) return `🏅 ${ACH_NAME[ex.requiresAchievement] ?? "achievement"}`;
  return `Lv ${ex.unlockLevel}`;
}
// What each exercise develops, for the hover tooltip.
function exerciseTip(ex: (typeof EXERCISES)[number]): string {
  const develops =
    ex.muscle === "fullbody"
      ? "Full body — develops every muscle group (mass + symmetry)"
      : `Develops ${MUSCLE_NAME[ex.muscle]} (mass)`;
  const bonus = ex.gainMult && ex.gainMult > 1 ? ` · ${ex.gainMult}× gains` : "";
  const lock = game.unlocked(ex) ? "" : ` · unlock: ${lockReason(ex)}`;
  return `${develops} · +Strength XP${bonus}${lock}`;
}

function buildList() {
  const nav = $("exlist");
  hideTip(); // avoid a stuck tooltip when the buttons are rebuilt
  nav.innerHTML = "";
  for (const ex of EXERCISES) {
    const btn = document.createElement("button");
    const ok = game.unlocked(ex);
    // locked exercises use a class (not `disabled`) so they still fire hover for the tooltip
    btn.className = "exbtn" + (ex.id === game.state.currentExercise ? " active" : "") + (ok ? "" : " locked");
    btn.textContent = ok ? ex.name : `🔒 ${lockReason(ex)}`;
    const tip = exerciseTip(ex);
    btn.addEventListener("pointerenter", () => showTip(btn, tip));
    btn.addEventListener("pointerleave", hideTip);
    btn.onclick = () => {
      if (!game.unlocked(ex)) return; // locked — ignore
      hideTip();
      game.selectExercise(ex.id);
      buildList();
    };
    nav.appendChild(btn);
  }
}

function floatText(text: string) {
  const bar = $("bar");
  const el = document.createElement("span");
  el.className = "float";
  el.textContent = text;
  el.style.left = 40 + Math.random() * 20 + "%";
  bar.appendChild(el);
  setTimeout(() => el.remove(), 700);
}

const barEl = $("bar");
barEl.addEventListener("click", (e) => {
  // Only real mouse/touch clicks count. Keyboard-triggered clicks (Enter/Space)
  // have detail === 0 — ignore them so the rep button can't be auto-fired.
  if ((e as MouseEvent).detail === 0) return;
  const setsBefore = game.state.setsCompleted;
  if (game.push()) {
    if (game.state.setsCompleted > setsBefore) {
      floatText("SET ✅");
      toast(`✅ Set done! Rest ${BALANCE.restSeconds}s before the next series.`);
      playSound("set");
    } else {
      floatText(`+${Math.max(1, Math.round(game.selectedWeight() * game.globalMultiplier()))} 💪`);
      playSound("click");
    }
  }
});
// Block keyboard activation entirely (no holding Enter to spam reps).
barEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") e.preventDefault();
});
// Press-and-hold to keep changing the weight: one step on press, then auto-repeat
// (accelerating) while held. Pointer/touch only — keyboard can't fire pointerdown.
function holdToRepeat(el: HTMLElement, step: () => void) {
  let delay: ReturnType<typeof setTimeout> | undefined;
  let repeat: ReturnType<typeof setTimeout> | undefined;
  const stop = () => {
    if (delay) clearTimeout(delay);
    if (repeat) clearTimeout(repeat);
    delay = repeat = undefined;
  };
  el.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return; // primary button / touch only
    e.preventDefault();
    step(); // immediate first step on tap
    let ms = 110;
    delay = setTimeout(function spin() {
      step();
      ms = Math.max(28, ms - 12); // speed up the longer you hold
      repeat = setTimeout(spin, ms);
    }, 300);
  });
  // Stop on release/cancel anywhere, or when the pointer leaves the button.
  for (const ev of ["pointerup", "pointercancel"] as const) window.addEventListener(ev, stop);
  el.addEventListener("pointerleave", stop);
}
holdToRepeat($("weightDown"), () => game.changeWeight(-1));
holdToRepeat($("weightUp"), () => game.changeWeight(1));
$("weightMin").addEventListener("click", () => game.setWeightExtreme(false));
$("weightMax").addEventListener("click", () => game.setWeightExtreme(true));
$("autobuy").addEventListener("click", () => game.hireAuto() && playSound("buy"));
$("autotoggle").addEventListener("click", () => game.toggleAuto());
$("agentbuy").addEventListener("click", () => game.hireAgent() && (renderWork(), playSound("buy")));
$("chefbuy").addEventListener("click", () => game.hireChef() && (renderFood(), playSound("buy")));
$("cheffood").addEventListener("change", (e) => game.markFood((e.target as HTMLSelectElement).value));
$("reset").addEventListener("click", () => {
  if (confirm("Reset all progress?")) {
    game.reset();
    comp = null;
    buildList();
    renderWork();
    renderPrestige();
    renderAchievements();
    renderFood();
    renderMarket();
    renderHospital();
    renderArnold();
  }
});
const muteBtn = $<HTMLButtonElement>("mute");
muteBtn.textContent = isMuted() ? "🔇 Muted" : "🔊 Sound";
muteBtn.addEventListener("click", () => {
  const m = toggleMute();
  muteBtn.textContent = m ? "🔇 Muted" : "🔊 Sound";
});

// Keep-awake toggle — only shown when the browser supports the Wake Lock API
const wakeBtn = $<HTMLButtonElement>("wakelock");
if (wakeLockSupported()) {
  initWakeLock();
  wakeBtn.classList.remove("hidden");
  const sync = () => (wakeBtn.textContent = isWakeLockOn() ? "📱 Keep awake" : "💤 Auto-lock");
  sync();
  wakeBtn.addEventListener("click", () => {
    setWakeLock(!isWakeLockOn());
    sync();
  });
}

// ================= Work =================
function renderWork() {
  const active = game.state.activeJob;
  $("joblist").innerHTML = JOBS.map((j) => {
    const unlocked = game.jobUnlocked(j);
    const isActive = active === j.id;
    const busy = !!active && !isActive;
    const noFood = unlocked && j.needsFood && game.state.hunger <= 0;
    const info = !unlocked
      ? `🔒 Lv ${j.unlockLevel}`
      : noFood
        ? "🍽️ needs food"
        : `+$${j.pay} · ${j.duration}s${j.needsFood ? "" : " · no food"}`;
    const prog = isActive
      ? `<span class="jobprogwrap"><span id="jobprog" class="jobprog"></span></span>`
      : "";
    return `<button class="card job${isActive ? " working" : ""}${noFood ? " bad" : ""}" data-job="${j.id}"
      ${!unlocked || busy || isActive || noFood ? "disabled" : ""}>
      <span class="cemoji">${j.emoji}</span>
      <span class="cname2">${j.name}</span>
      <span class="ctags">${info}</span>
      ${prog}
    </button>`;
  }).join("");
  $("joblist")
    .querySelectorAll<HTMLButtonElement>("[data-job]")
    .forEach((b) => (b.onclick = () => game.startJob(b.dataset.job!) && renderWork()));
}

// ================= Food =================
function renderChef() {
  // food picker (the meal the chef auto-buys)
  const sel = $<HTMLSelectElement>("cheffood");
  if (sel.childElementCount !== FOODS.length) {
    sel.innerHTML = FOODS.map((f) => `<option value="${f.id}">${f.emoji} ${f.name} ($${f.cost})</option>`).join("");
  }
  if (game.state.markedFood) sel.value = game.state.markedFood;
  const chefbuy = $<HTMLButtonElement>("chefbuy");
  if (game.state.chefHired) {
    chefbuy.textContent = "Hired ✓";
    chefbuy.disabled = true;
    $("chefrate").textContent = ` · auto-buys below ${BALANCE.chefHungerThreshold} 🍽️`;
  } else {
    chefbuy.textContent = `Hire $${game.chefCost().toLocaleString("en-US")}`;
    chefbuy.disabled = game.state.money < game.chefCost();
    $("chefrate").textContent = " · feeds you when hunger runs low";
  }
}

function renderFood() {
  renderChef();
  $("foodlist").innerHTML = FOODS.map((f) => {
    const tags: string[] = [`+${f.satiety} 🍽️`];
    if (f.condition) tags.push(`${f.condition > 0 ? "+" : ""}${f.condition} cond`);
    if (f.xpMult !== 1) tags.push(`×${f.xpMult} XP`);
    if (f.clickMult !== 1) tags.push(`×${f.clickMult} energy`);
    if (f.muscleMult !== 1) tags.push(`×${f.muscleMult} muscle`);
    const afford = game.state.money >= f.cost;
    return `<button class="card${f.condition < 0 ? " bad" : ""}" data-food="${f.id}" ${afford ? "" : "disabled"}>
      <span class="cemoji">${f.emoji}</span>
      <span class="cname2">${f.name}</span>
      <span class="ctags">${tags.join(" · ")}</span>
      <span class="cost">$${f.cost}</span>
    </button>`;
  }).join("");
  $("foodlist")
    .querySelectorAll<HTMLButtonElement>("[data-food]")
    .forEach((b) => (b.onclick = () => game.eat(b.dataset.food!) && (renderFood(), playSound("buy"))));
}

// ================= Market =================
function renderMarket() {
  const cats: Category[] = ["equipment", "vitamin", "compound", "anabolic"];
  $("marketlist").innerHTML = cats
    .map((cat) => {
      const inCat = MARKET.filter((i) => i.category === cat);
      // available items: full cards with description + price
      const available = inCat
        .filter((i) => !game.owns(i.id))
        .map((i) => {
          const afford = game.state.money >= i.cost;
          return `<button class="card mk${i.category === "anabolic" ? " bad" : ""}"
            data-buy="${i.id}" ${!afford ? "disabled" : ""}>
            <span class="cemoji">${i.emoji}</span>
            <span class="cname2">${i.name}</span>
            <span class="ctags">${i.desc}</span>
            <span class="cost">$${i.cost}</span>
          </button>`;
        })
        .join("");
      // owned items: minimized to a compact chip with just the icon + title
      const owned = inCat
        .filter((i) => game.owns(i.id))
        .map(
          (i) => `<span class="card mk owned min" data-tip="${i.desc}">
            <span class="cemoji">${i.emoji}</span>
            <span class="cname2">${i.name}</span>
            <span class="cost">✓</span>
          </span>`,
        )
        .join("");
      return (
        `<h3 class="cattl">${CATEGORY_LABEL[cat]}</h3>` +
        (available ? `<div class="grid">${available}</div>` : "") +
        (owned ? `<div class="chips">${owned}</div>` : "")
      );
    })
    .join("");
  $("marketlist")
    .querySelectorAll<HTMLButtonElement>("[data-buy]")
    .forEach((b) => (b.onclick = () => game.buy(b.dataset.buy!) && (renderMarket(), playSound("buy"))));
}

// ================= Hospital =================
function renderHospital() {
  $("hosphealth").textContent = String(Math.round(game.state.health));
  $("hospside").textContent = String(Math.round(game.sideEffects() * 0.06 * 60)); // approx hp lost per minute
  $("hospitallist").innerHTML = TREATMENTS.map((t) => {
    const afford = game.state.money >= t.cost;
    return `<button class="card" data-treat="${t.id}" ${afford ? "" : "disabled"}>
      <span class="cemoji">${t.emoji}</span>
      <span class="cname2">${t.name}</span>
      <span class="ctags">${t.desc}</span>
      <span class="cost">$${t.cost}</span>
    </button>`;
  }).join("");
  $("hospitallist")
    .querySelectorAll<HTMLButtonElement>("[data-treat]")
    .forEach((b) => (b.onclick = () => game.hospitalize(b.dataset.treat!) && (renderHospital(), playSound("heal"))));
}

// ================= Competitions =================
const ROUND_DELAY = 1100; // ms between auto-played elimination rounds (time to watch)
let comp: Competition | null = null;
let compTimer: ReturnType<typeof setTimeout> | null = null;
let lastResult: RoundResult | null = null;
let prizeAwarded = false;
let lastPrize = 0;
let lastPrizeFirst = false;
let endlessActive: number | null = null; // stage being attempted in the Endless Olympia (null = a normal show)

function enter(t: Tournament) {
  if (!game.payEntry(t)) return; // can't afford the entry fee
  if (compTimer) clearTimeout(compTimer);
  endlessActive = null;
  comp = new Competition(t, game.state.physique, game.conditioning(), Date.now() & 0xffffff);
  lastResult = null;
  prizeAwarded = false;
  renderArnold();
  // auto-play the whole bracket: rounds run on a timer, no clicking — just watch
  compTimer = setTimeout(autoStep, ROUND_DELAY);
}
function enterEndless() {
  const stage = game.endlessTarget();
  if (!game.payEndlessEntry(stage)) return;
  if (compTimer) clearTimeout(compTimer);
  endlessActive = stage;
  const t: Tournament = {
    id: "endless",
    name: `Endless Olympia · Stage ${stage}`,
    emoji: "🔱",
    desc: `${BALANCE.endlessFieldSize} legends`,
    prize: game.endlessPrize(stage),
    entryFee: game.endlessEntry(stage),
    rivalIdx: [],
  };
  const rivals = endlessField(game.endlessTier(stage), BALANCE.endlessFieldSize);
  comp = new Competition(t, game.state.physique, game.conditioning(), Date.now() & 0xffffff, rivals);
  lastResult = null;
  prizeAwarded = false;
  renderArnold();
  compTimer = setTimeout(autoStep, ROUND_DELAY);
}
function autoStep() {
  if (!comp || comp.finished) return;
  lastResult = comp.nextRound(Date.now() & 0xffffff);
  if (comp.finished && comp.playerWon() && !prizeAwarded) {
    prizeAwarded = true;
    if (endlessActive != null) {
      lastPrize = game.clearEndless(endlessActive);
      lastPrizeFirst = true;
      playSound("epic");
    } else {
      const res = game.claimPrize(comp.tournament.id, comp.tournament.prize);
      lastPrize = res.amount;
      lastPrizeFirst = res.first;
      const wasArnold = comp.tournament.isArnold;
      if (wasArnold) game.state.arnoldWon = true;
      playSound(wasArnold ? "epic" : "win");
    }
    game.save();
  } else if (comp.finished && !comp.playerWon()) {
    playSound("lose");
  }
  renderArnold();
  if (comp && !comp.finished) compTimer = setTimeout(autoStep, ROUND_DELAY);
}
function leave() {
  if (compTimer) clearTimeout(compTimer);
  compTimer = null;
  comp = null;
  lastResult = null;
  renderArnold();
}

// Live player stats panel (physique bars + conditioning + side effects). Cheap to
// run every frame, so the Competitions view reflects training without a tab switch.
function renderArnoldStats() {
  const phys = $("physique");
  const maxVal = Math.max(1, ...JUDGED_MUSCLES.map((m) => game.state.physique[m.id]));
  phys.innerHTML = JUDGED_MUSCLES.map((m) => {
    const v = game.state.physique[m.id];
    return `<div class="prow"><span class="plbl">${m.name}</span>
      <div class="pbar"><span style="width:${(v / maxVal) * 100}%"></span></div>
      <span class="pval">${Math.round(v)}</span></div>`;
  }).join("");
  $("condval").textContent = String(game.conditioning());
  $("sideval").textContent = String(Math.round(game.sideEffects()));
}

function renderArnold() {
  renderArnoldStats();
  const body = $("arnold-body");
  if (!comp) {
    // tournament picker
    const cards = TOURNAMENTS.map((t) => {
      const wins = game.timesWon(t.id);
      const next = game.nextPrize(t.id, t.prize);
      const prizeLine = wins
        ? `Won ×${wins} ✅ · next $${next.toLocaleString("en-US")}`
        : `Prize $${t.prize.toLocaleString("en-US")}`;
      const fee = game.canAffordEntry(t);
      return `<button class="tcard${t.isArnold ? " arnold" : ""}${fee ? "" : " bad"}" data-enter="${t.id}" ${fee ? "" : "disabled"}>
        <span class="temoji">${t.emoji}</span>
        <span class="tname">${t.name}</span>
        <span class="tdesc">${t.desc}</span>
        <span class="tprize">${prizeLine}</span>
        <span class="tfee">Entry $${t.entryFee.toLocaleString("en-US")}${fee ? "" : " — can't afford"}</span>
      </button>`;
    }).join("");
    // Endless Olympia card — infinitely scaling endgame, unlocked after the Arnold
    let endlessCard = "";
    if (game.endlessUnlocked()) {
      const stage = game.endlessTarget();
      const fee = game.canAffordEndless(stage);
      endlessCard = `<button class="tcard endless${fee ? "" : " bad"}" data-endless="1" ${fee ? "" : "disabled"}>
        <span class="temoji">🔱</span>
        <span class="tname">Endless Olympia</span>
        <span class="tdesc">Stage ${stage} · best ${game.state.olympiaBest} · ${BALANCE.endlessFieldSize} legends</span>
        <span class="tprize">Prize $${game.endlessPrize(stage).toLocaleString("en-US")}</span>
        <span class="tfee">Entry $${game.endlessEntry(stage).toLocaleString("en-US")}${fee ? "" : " — can't afford"}</span>
      </button>`;
    }
    body.innerHTML = `<div class="tlist">${cards}${endlessCard}</div>`;
    body.querySelectorAll<HTMLButtonElement>("[data-enter]").forEach((b) => {
      b.onclick = () => enter(TOURNAMENTS.find((t) => t.id === b.dataset.enter)!);
    });
    body.querySelector<HTMLButtonElement>("[data-endless]")?.addEventListener("click", enterEndless);
  } else {
    const sorted = [...comp.competitors].sort((a, b) => {
      if (a.eliminated !== b.eliminated) return a.eliminated ? 1 : -1;
      return b.score - a.score;
    });
    const lineup = sorted
      .map((c) => {
        const status = c.eliminated ? `<span class="out">out</span>` : "";
        const score = c.score ? c.score.toFixed(1) : "—";
        return `<div class="comp${c.isPlayer ? " me" : ""}${c.eliminated ? " dead" : ""}">
          <span class="cname">${c.isPlayer ? "🧍 You" : c.name}</span>
          <span class="cscore">${score}</span>${status}</div>`;
      })
      .join("");
    // rounds auto-play on a timer — show progress while running, a button when done
    const ctrl = comp.finished
      ? `<button id="leave" class="primary">Back to competitions</button>`
      : `<span class="running">⏳ ${comp.currentRoundName}…</span>`;
    body.innerHTML = `<h3 class="cattl">${comp.tournament.emoji} ${comp.tournament.name}</h3>
      <div class="lineup">${lineup}</div><div class="arow">${ctrl}</div>`;
    $("leave")?.addEventListener("click", leave);
  }

  const msg = $("arnold-msg");
  if (comp?.finished) {
    if (comp.playerWon()) {
      msg.textContent =
        endlessActive != null
          ? `🔱 Cleared Endless Olympia Stage ${game.state.olympiaStage}! Prize: $${lastPrize.toLocaleString("en-US")} (best: ${game.state.olympiaBest})`
          : `🏆 You won ${comp.tournament.name}! ${lastPrizeFirst ? "Prize" : "Rematch payout"}: $${lastPrize.toLocaleString("en-US")}`;
    } else {
      msg.textContent = `Champion: ${comp.winner?.name}. Train harder and come back.`;
    }
    msg.className = "arnold-msg " + (comp.playerWon() ? "win" : "lose");
  } else if (comp && comp.playerEliminated()) {
    msg.textContent = "You were eliminated. Build more mass & symmetry, then try again.";
    msg.className = "arnold-msg lose";
  } else if (lastResult) {
    const names = lastResult.cut.map((c) => (c.isPlayer ? "You" : c.name)).join(", ") || "nobody";
    msg.textContent = `${lastResult.roundName} done. Eliminated: ${names}.`;
    msg.className = "arnold-msg";
  } else {
    msg.textContent = "";
    msg.className = "arnold-msg";
  }
}

// ================= Prestige =================
let shownProtein = -1; // rebuild the upgrade list only when Protein changes (it's static otherwise)
function renderUpgrades(force = false) {
  if (!force && game.state.protein === shownProtein && $("upgradelist").childElementCount) return;
  shownProtein = game.state.protein;
  $("upgradelist").innerHTML = PRESTIGE_UPGRADES.map((u) => {
    const lvl = game.upgradeLevel(u.id);
    const maxed = game.upgradeMaxed(u);
    const cost = game.upgradeCost(u);
    const canBuy = game.canBuyUpgrade(u);
    const costLine = maxed ? "MAX" : `${cost} 🥤`;
    return `<button class="card mk${maxed ? " owned" : ""}" data-upg="${u.id}" ${canBuy ? "" : "disabled"}>
      <span class="cemoji">${u.emoji}</span>
      <span class="cname2">${u.name} <small class="muted">Lv ${lvl}/${u.maxLevel}</small></span>
      <span class="ctags">${u.desc(lvl)}${maxed ? "" : ` → ${u.desc(lvl + 1)}`}</span>
      <span class="cost">${costLine}</span>
    </button>`;
  }).join("");
  $("upgradelist")
    .querySelectorAll<HTMLButtonElement>("[data-upg]")
    .forEach((b) => (b.onclick = () => game.buyUpgrade(b.dataset.upg!) && (renderPrestige(), playSound("buy"))));
}

function renderPrestige() {
  $("proteinval").textContent = String(game.state.protein);
  $("prestmult").textContent = `+${Math.round((game.prestigeMult() - 1) * 100)}%`;
  $("proteingain").textContent = String(game.proteinGain());
  const div = game.division();
  $("prestdiv").textContent = `${div.emoji} ${div.name}`;
  const next = game.nextDivision();
  $("prestnext").textContent = next
    ? `· next season → ${next.emoji} ${next.name}`
    : "· at the Opens — top division reached 🏆";
  const btn = $<HTMLButtonElement>("prestige-btn");
  const gain = game.proteinGain();
  const promo = next ? ` → ${next.emoji} ${next.name}` : "";
  btn.textContent = gain >= 1 ? `Start New Season (+${gain} 🥤)${promo}` : "Need more strength to prestige";
  btn.disabled = gain < 1;
  $("prestige-msg").textContent = gain < 1 ? "Earn strength until at least 1 🥤 is available." : "";
  renderUpgrades();
}
$("prestige-btn").addEventListener("click", () => {
  const gain = game.proteinGain();
  if (gain < 1) return;
  const next = game.nextDivision();
  const promo = next ? ` and move up to ${next.emoji} ${next.name}` : "";
  if (confirm(`Start a New Season? You will reset all progress and gain +${gain} 🥤 to spend on permanent upgrades${promo}.`)) {
    game.prestige();
    comp = null;
    buildList();
    renderWork();
    renderPrestige();
    showTab("gym");
    playSound("epic");
  }
});

// ================= Achievements =================
function renderAchievements() {
  const unlocked = ACHIEVEMENTS.filter((a) => game.state.achievements[a.id]).length;
  $("achvcount").textContent = String(unlocked);
  $("achvtotal").textContent = String(ACHIEVEMENTS.length);
  $("achvlist").innerHTML = ACHIEVEMENTS.map((a) => {
    const got = !!game.state.achievements[a.id];
    return `<div class="card achv${got ? " got" : " locked"}">
      <span class="cemoji">${got ? a.emoji : "🔒"}</span>
      <span class="cname2">${a.name}</span>
      <span class="ctags">${a.desc}</span>
    </div>`;
  }).join("");
}
function toast(text: string) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = text;
  $("toasts").appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

// ================= Render loop =================
let last = performance.now();
let shownLevel = -1; // rebuild the exercise list whenever the level changes
let shownExercise = ""; // rebuild the exercise list when the active exercise changes
let shownMoney = -1; // refresh the visible shop when money changes (affordability)
let shownJob: string | null | undefined = undefined; // refresh Work view on job change
function render(now: number) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  game.tick(dt);

  const ex = game.exercise();
  $("strength").textContent = Math.floor(game.state.strength).toLocaleString("en-US");
  $("level").textContent = String(game.state.level);
  if (game.state.level !== shownLevel) {
    // don't toast on the first render (shownLevel starts at -1) or on a reset drop
    if (shownLevel >= 0 && game.state.level > shownLevel) {
      toast(`⭐ Level up! You're now Level ${game.state.level}.`);
      playSound("levelup");
    }
    shownLevel = game.state.level;
    buildList(); // newly reached level unlocks exercises immediately
  }
  if (game.state.currentExercise !== shownExercise) {
    shownExercise = game.state.currentExercise;
    buildList(); // keep the exercise-list highlight in sync (e.g. auto-trainer switches)
  }
  $("money").textContent = Math.floor(game.state.money).toLocaleString("en-US");
  $("condhdr").textContent = String(game.conditioning());

  // jobs: live status + progress, refresh the Work list when the job changes
  const jobObj = game.activeJobObj();
  $("jobstatus").textContent = jobObj
    ? `Working: ${jobObj.emoji} ${jobObj.name} — ${Math.ceil(game.state.jobRemaining)}s left (+$${jobObj.pay})`
    : "Not working right now.";
  const jp = document.getElementById("jobprog");
  if (jp) (jp as HTMLElement).style.width = game.jobProgress() * 100 + "%";
  if (game.state.activeJob !== shownJob) {
    shownJob = game.state.activeJob;
    if (!$("view-work").classList.contains("hidden")) renderWork();
  }

  const nextXp = game.xpForNextLevel();
  $<HTMLElement>("xpfill").style.width = Math.min(100, (game.state.xp / nextXp) * 100) + "%";
  $("xptxt").textContent = `${Math.floor(game.state.xp)}/${nextXp}`;

  const hunger = Math.round(game.state.hunger);
  $<HTMLElement>("hungerfill").style.width = hunger + "%";
  $<HTMLElement>("hungerfill").style.background = hunger < 25 ? "#c0392b" : "#27ae60";
  $("hungerval").textContent = String(hunger);

  const health = Math.round(game.state.health);
  $<HTMLElement>("healthfill").style.width = health + "%";
  $<HTMLElement>("healthfill").style.background = health < 25 ? "#c0392b" : "#e74c3c";
  $("healthval").textContent = String(health);

  $("exname").textContent = ex.name;
  $("weightval").textContent = String(game.selectedWeight());
  $("weightmax").textContent = String(game.maxLift());
  const atMax = game.selectedWeight() >= game.maxLift();
  const atMin = game.selectedWeight() <= ex.minWeight;
  $<HTMLButtonElement>("weightUp").disabled = atMax;
  $<HTMLButtonElement>("weightMax").disabled = atMax;
  $<HTMLButtonElement>("weightDown").disabled = atMin;
  $<HTMLButtonElement>("weightMin").disabled = atMin;

  // Auto-Trainer control
  $("autolvl").textContent = String(game.state.autoLevel);
  $("autorate").textContent =
    game.state.autoLevel === 0
      ? ""
      : !game.state.autoEnabled
        ? " · paused (off)"
        : game.state.hunger <= 0 || game.state.health <= 0
          ? " · paused (no energy)"
          : ` · ${game.autoClicksPerSec()} reps/s`;
  const autotoggle = $<HTMLButtonElement>("autotoggle");
  autotoggle.classList.toggle("hidden", game.state.autoLevel === 0);
  autotoggle.textContent = game.state.autoEnabled ? "⏸ Pause" : "▶ Resume";
  const autobuy = $<HTMLButtonElement>("autobuy");
  if (game.autoMaxed()) {
    autobuy.textContent = "MAX";
    autobuy.disabled = true;
  } else {
    autobuy.textContent = `Hire $${game.autoCost().toLocaleString("en-US")}`;
    autobuy.disabled = game.state.money < game.autoCost();
  }

  // Business Agent (auto-work) control
  $("agentlvl").textContent = String(game.state.agentLevel);
  if (game.state.agentLevel === 0) {
    $("agentrate").textContent = " · auto-works jobs for you";
  } else {
    const nextJob = game.agentBestJob();
    $("agentrate").textContent = ` · every ${game.agentInterval()}s · next in ${Math.ceil(game.state.agentTimer)}s${
      nextJob ? ` (${nextJob.emoji} +$${nextJob.pay})` : ""
    }`;
  }
  const agentbuy = $<HTMLButtonElement>("agentbuy");
  if (game.agentMaxed()) {
    agentbuy.textContent = "MAX";
    agentbuy.disabled = true;
  } else {
    agentbuy.textContent = `${game.state.agentLevel === 0 ? "Hire" : "Upgrade"} $${game.agentCost().toLocaleString("en-US")}`;
    agentbuy.disabled = game.state.money < game.agentCost();
  }

  const cost = game.repCost();
  const fill = $<HTMLElement>("effort");
  fill.style.width = Math.min(100, (game.effort / cost) * 100) + "%";
  const ease = 1 - Math.pow(BALANCE.decay, Math.min(game.currentReps(), BALANCE.decayCap));
  fill.style.background = `hsl(${ease * 130}, 80%, 50%)`;

  $("warmup").textContent = String(Math.floor(game.currentReps()));

  // Sets (séries) tracker
  const setReps = game.setReps();
  const perSet = game.repsPerSet();
  const restLeft = game.restRemaining();
  const resting = restLeft > 0;
  $("setper").textContent = String(perSet);
  $("setreps").textContent = String(setReps);
  $("setsdone").textContent = String(game.state.setsCompleted);
  $("totalreps").textContent = game.state.totalReps.toLocaleString("en-US");
  const dots = $("setdots");
  if (dots.childElementCount !== perSet) {
    dots.innerHTML = Array.from({ length: perSet }, () => `<span class="dot"></span>`).join("");
  }
  dots.querySelectorAll<HTMLElement>(".dot").forEach((d, i) => d.classList.toggle("on", i < setReps));
  if (resting) {
    // show the rest as a filling bar so the pause is visible
    const eff = $<HTMLElement>("effort");
    eff.style.width = (1 - restLeft / BALANCE.restSeconds) * 100 + "%";
    eff.style.background = "#2980b9";
  }

  const fat = game.muscleFatigue();
  const fatPen = Math.round((1 - game.fatigueFactor()) * 100);
  const exhausted = fat >= BALANCE.fatigueMax;
  const starving = game.state.hunger <= 0;
  const sick = game.state.health <= 0;
  const recovering = game.isRecovering();
  if (recovering) {
    // hospitalized: show the recovery as a filling bar with a live countdown
    const eff = $<HTMLElement>("effort");
    eff.style.width = (1 - game.state.recovering / BALANCE.collapseSeconds) * 100 + "%";
    eff.style.background = "#8e44ad";
  }
  $("hint").textContent = recovering
    ? `hospitalized — recovering ${Math.ceil(game.state.recovering)}s (−${Math.round(BALANCE.collapseLoss * 100)}% gains lost)`
    : sick
    ? "too sick — go to the hospital!"
    : starving
      ? "too hungry — eat something!"
      : resting
        ? `resting between sets — ${Math.ceil(restLeft)}s (builds strength & conditioning)`
        : exhausted
          ? "muscle exhausted — rest or switch!"
          : game.state.health < 25
            ? "overtraining — rest to recover health!"
            : fat >= 50
              ? `muscle tiring — pushes ${fatPen}% weaker, rest or switch`
              : game.currentReps() < 1
                ? "starts hard…"
                : ease > 0.6
                  ? "flowing! 🔥"
                  : "getting easier…";
  $("barlbl").textContent = recovering
    ? `🏥 RECOVERING ${Math.ceil(game.state.recovering)}s`
    : sick
      ? "HOSPITAL 🏥"
      : starving
        ? "EAT 🍽️"
        : resting
          ? `RESTING ${Math.ceil(restLeft)}s 😮‍💨`
          : exhausted
            ? "REST 😮‍💨"
            : `CLICK TO ${ex.name.toUpperCase()}`;
  $("bar").classList.toggle("exhausted", exhausted || starving || sick || recovering);
  $("bar").classList.toggle("resting", resting && !recovering);

  $("fatname").textContent = ex.muscle;
  $<HTMLElement>("fatfill").style.width = fat + "%";
  $<HTMLElement>("fatfill").style.background = fat >= BALANCE.fatigueMax ? "#c0392b" : "#e67e22";
  $("fatpen").textContent = fatPen > 0 ? ` · −${fatPen}% effort` : "";

  $("buffs").innerHTML = game.state.buffs
    .map((b) => `<span class="buff" data-tip="${buffTip(b)}">${b.emoji} ${Math.ceil(b.remaining)}s</span>`)
    .join("");

  const av = avatar(game.state.strength);
  $("avatar").textContent = av.emoji;
  $("avatarlbl").textContent = av.label;

  if (!$("view-prestige").classList.contains("hidden")) renderPrestige(); // live protein gain
  if (!$("view-arnold").classList.contains("hidden")) renderArnoldStats(); // live physique/conditioning
  // when money changes, refresh the visible shop so affordability (enabled buttons) updates live
  const moneyNow = Math.floor(game.state.money);
  if (moneyNow !== shownMoney) {
    shownMoney = moneyNow;
    if (!$("view-market").classList.contains("hidden")) renderMarket();
    if (!$("view-food").classList.contains("hidden")) renderFood();
    if (!$("view-work").classList.contains("hidden")) renderWork();
    if (!$("view-arnold").classList.contains("hidden") && !comp) renderArnold();
  }

  const fresh = game.checkAchievements();
  for (const a of fresh) {
    toast(`🏅 ${a.emoji} ${a.name} unlocked!`);
    if (!$("view-achv").classList.contains("hidden")) renderAchievements();
  }
  if (fresh.length) {
    playSound("achieve");
    buildList(); // an achievement may unlock an exercise (e.g. Bench the World)
  }

  if (game.jobEvents.length) {
    for (const j of game.jobEvents) toast(`${j.emoji} ${j.name} done · +$${j.pay.toLocaleString("en-US")}`);
    game.jobEvents.length = 0;
    playSound("coin");
  }

  if (game.chefEvents.length) {
    for (const c of game.chefEvents) toast(`👨‍🍳 Chef served ${c.emoji} ${c.name} · −$${c.cost.toLocaleString("en-US")}`);
    game.chefEvents.length = 0;
  }

  if (game.justCollapsed) {
    game.justCollapsed = false;
    toast(`🏥 Collapsed! Emergency hospital — recovering ${BALANCE.collapseSeconds}s, −${Math.round(BALANCE.collapseLoss * 100)}% gains.`);
    playSound("thud");
  }
  if (game.justRecovered) {
    game.justRecovered = false;
    toast(`💪 Recovered! Back to full health — all negative statuses cleared.`);
    playSound("heal");
  }

  requestAnimationFrame(render);
}

buildList();
requestAnimationFrame(render);
setInterval(() => game.save(), 3000);
window.addEventListener("beforeunload", () => game.save());

// "Welcome back" — summarize idle progress earned while the player was away
if (game.offlineSummary) {
  const o = game.offlineSummary;
  game.offlineSummary = null;
  const h = Math.floor(o.seconds / 3600);
  const m = Math.floor((o.seconds % 3600) / 60);
  const away = h > 0 ? `${h}h ${m}m` : `${m}m`;
  const parts: string[] = [];
  if (o.strength > 0) parts.push(`+${Math.floor(o.strength).toLocaleString("en-US")} 💪`);
  if (o.levels > 0) parts.push(`+${o.levels} ⭐`);
  if (o.money > 0) parts.push(`+$${Math.floor(o.money).toLocaleString("en-US")}`);
  if (o.reps > 0) parts.push(`+${o.reps.toLocaleString("en-US")} reps`);
  if (parts.length) toast(`👋 Welcome back! Away ${away} → ${parts.join(" · ")}`);
}
