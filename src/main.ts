import "./style.css";
import { Game } from "./game";
import { BALANCE, EXERCISES, MUSCLES } from "./balance";
import { FOODS } from "./nutrition";
import { MARKET, CATEGORY_LABEL, type Category } from "./market";
import { TREATMENTS } from "./hospital";
import { JOBS } from "./jobs";
import { Competition, TOURNAMENTS, type RoundResult, type Tournament } from "./competition";

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
  </nav>

  <div id="view-gym">
    <main class="stage">
      <section class="avatar-box">
        <div id="avatar" class="avatar">🧍</div>
        <div id="avatarlbl" class="avatarlbl">Scrawny</div>
      </section>
      <section class="workout">
        <h2 id="exname">Crunch</h2>
        <div class="weight">
          <button id="weightDown">−</button>
          <span>Weight: <b id="weightval">0</b> kg</span>
          <button id="weightUp">+</button>
        </div>
        <button id="bar" class="bar" aria-label="Do a rep">
          <span id="effort" class="effort"></span>
          <span id="barlbl" class="barlbl">CLICK TO PUSH</span>
        </button>
        <p class="reptxt">Warm-up reps: <b id="warmup">0</b> — <span id="hint">starts hard…</span></p>
        <div class="fatigue">
          <span>Fatigue <b id="fatname">core</b></span>
          <div class="fatbar"><span id="fatfill" class="fatfill"></span></div>
        </div>
        <div id="buffs" class="buffs"></div>
      </section>
    </main>
    <div class="autobox">
      <span class="autolbl">🤖 Auto-Trainer <b id="autolvl">0</b><span id="autorate" class="muted"></span></span>
      <button id="autobuy" class="autobuy">Hire</button>
    </div>
    <nav id="exlist" class="exlist"></nav>
  </div>

  <div id="view-work" class="hidden">
    <section class="panel">
      <h2>💼 Work</h2>
      <p class="muted">Earn money on the side while you build toward competitions. Each job takes time and pays when it's done — you can keep training meanwhile.</p>
      <p id="jobstatus" class="cond"></p>
      <div id="joblist" class="grid"></div>
    </section>
  </div>

  <div id="view-food" class="hidden">
    <section class="panel">
      <h2>🍽️ Food</h2>
      <p class="muted">Eat to restore hunger. Clean food boosts gains & conditioning; junk fills you fast but wrecks your stage look.</p>
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

  <footer class="footer">
    <button id="reset" class="reset">Reset progress</button>
    <span class="ver">v0.5 — From Scrawny to Swole</span>
  </footer>
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
type Tab = "gym" | "work" | "food" | "market" | "hospital" | "arnold";
const TABS: Tab[] = ["gym", "work", "food", "market", "hospital", "arnold"];
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
function buildList() {
  const nav = $("exlist");
  nav.innerHTML = "";
  for (const ex of EXERCISES) {
    const btn = document.createElement("button");
    const ok = game.unlocked(ex);
    btn.className = "exbtn" + (ex.id === game.state.currentExercise ? " active" : "");
    btn.disabled = !ok;
    btn.textContent = ok ? ex.name : `🔒 Lv ${ex.unlockLevel}`;
    btn.onclick = () => {
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
  if (game.push()) {
    floatText(`+${Math.max(1, Math.round(game.selectedWeight() * game.globalMultiplier()))} 💪`);
  }
});
// Block keyboard activation entirely (no holding Enter to spam reps).
barEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") e.preventDefault();
});
$("weightDown").addEventListener("click", () => game.changeWeight(-1));
$("weightUp").addEventListener("click", () => game.changeWeight(1));
$("autobuy").addEventListener("click", () => game.hireAuto());
$("reset").addEventListener("click", () => {
  if (confirm("Reset all progress?")) {
    game.reset();
    comp = null;
    buildList();
    renderWork();
    renderFood();
    renderMarket();
    renderHospital();
    renderArnold();
  }
});

// ================= Work =================
function renderWork() {
  const active = game.state.activeJob;
  $("joblist").innerHTML = JOBS.map((j) => {
    const unlocked = game.jobUnlocked(j);
    const isActive = active === j.id;
    const busy = !!active && !isActive;
    const info = unlocked ? `+$${j.pay} · ${j.duration}s` : `🔒 Lv ${j.unlockLevel}`;
    const prog = isActive
      ? `<span class="jobprogwrap"><span id="jobprog" class="jobprog"></span></span>`
      : "";
    return `<button class="card job${isActive ? " working" : ""}" data-job="${j.id}"
      ${!unlocked || busy || isActive ? "disabled" : ""}>
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
function renderFood() {
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
    .forEach((b) => (b.onclick = () => game.eat(b.dataset.food!) && renderFood()));
}

// ================= Market =================
function renderMarket() {
  const cats: Category[] = ["equipment", "vitamin", "compound", "anabolic"];
  $("marketlist").innerHTML = cats
    .map((cat) => {
      const items = MARKET.filter((i) => i.category === cat)
        .map((i) => {
          const owned = game.owns(i.id);
          const afford = game.state.money >= i.cost;
          return `<button class="card mk${i.category === "anabolic" ? " bad" : ""}${owned ? " owned" : ""}"
            data-buy="${i.id}" ${owned || !afford ? "disabled" : ""}>
            <span class="cemoji">${i.emoji}</span>
            <span class="cname2">${i.name}</span>
            <span class="ctags">${i.desc}</span>
            <span class="cost">${owned ? "✓ owned" : "$" + i.cost}</span>
          </button>`;
        })
        .join("");
      return `<h3 class="cattl">${CATEGORY_LABEL[cat]}</h3><div class="grid">${items}</div>`;
    })
    .join("");
  $("marketlist")
    .querySelectorAll<HTMLButtonElement>("[data-buy]")
    .forEach((b) => (b.onclick = () => game.buy(b.dataset.buy!) && renderMarket()));
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
    .forEach((b) => (b.onclick = () => game.hospitalize(b.dataset.treat!) && renderHospital()));
}

// ================= Competitions =================
let comp: Competition | null = null;
let lastResult: RoundResult | null = null;
let prizeAwarded = false;
let lastPrize = 0;
let lastPrizeFirst = false;

function enter(t: Tournament) {
  comp = new Competition(t, game.state.physique, game.conditioning(), Date.now() & 0xffffff);
  lastResult = null;
  prizeAwarded = false;
  renderArnold();
}
function nextRound() {
  if (!comp || comp.finished) return;
  lastResult = comp.nextRound(Date.now() & 0xffffff);
  if (comp.finished && comp.playerWon() && !prizeAwarded) {
    prizeAwarded = true;
    const res = game.claimPrize(comp.tournament.id, comp.tournament.prize);
    lastPrize = res.amount;
    lastPrizeFirst = res.first;
    if (comp.tournament.isArnold) game.state.arnoldWon = true;
    game.save();
  }
  renderArnold();
}
function leave() {
  comp = null;
  lastResult = null;
  renderArnold();
}

function renderArnold() {
  const phys = $("physique");
  const maxVal = Math.max(1, ...MUSCLES.map((m) => game.state.physique[m.id]));
  phys.innerHTML = MUSCLES.map((m) => {
    const v = game.state.physique[m.id];
    return `<div class="prow"><span class="plbl">${m.name}</span>
      <div class="pbar"><span style="width:${(v / maxVal) * 100}%"></span></div>
      <span class="pval">${Math.round(v)}</span></div>`;
  }).join("");
  $("condval").textContent = String(game.conditioning());
  $("sideval").textContent = String(Math.round(game.sideEffects()));

  const body = $("arnold-body");
  if (!comp) {
    // tournament picker
    body.innerHTML =
      `<div class="tlist">` +
      TOURNAMENTS.map((t) => {
        const won = !!game.state.wonTournaments[t.id];
        const prizeLine = won
          ? `Won ✅ · rematch $${Math.round(t.prize * 0.2).toLocaleString("en-US")}`
          : `Prize $${t.prize.toLocaleString("en-US")}`;
        return `<button class="tcard${t.isArnold ? " arnold" : ""}" data-enter="${t.id}">
          <span class="temoji">${t.emoji}</span>
          <span class="tname">${t.name}</span>
          <span class="tdesc">${t.desc}</span>
          <span class="tprize">${prizeLine}</span>
        </button>`;
      }).join("") +
      `</div>`;
    body.querySelectorAll<HTMLButtonElement>("[data-enter]").forEach((b) => {
      b.onclick = () => enter(TOURNAMENTS.find((t) => t.id === b.dataset.enter)!);
    });
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
    const over = comp.finished || comp.playerEliminated();
    const ctrl = over
      ? `<button id="leave" class="primary">Back to competitions</button>`
      : `<button id="next" class="primary">Run ${comp.currentRoundName} →</button>
         <button id="leave" class="ghost">Withdraw</button>`;
    body.innerHTML = `<h3 class="cattl">${comp.tournament.emoji} ${comp.tournament.name}</h3>
      <div class="lineup">${lineup}</div><div class="arow">${ctrl}</div>`;
    $("next")?.addEventListener("click", nextRound);
    $("leave")?.addEventListener("click", leave);
  }

  const msg = $("arnold-msg");
  if (comp?.finished) {
    msg.textContent = comp.playerWon()
      ? `🏆 You won ${comp.tournament.name}! ${lastPrizeFirst ? "Prize" : "Rematch payout"}: $${lastPrize.toLocaleString("en-US")}`
      : `Champion: ${comp.winner?.name}. Train harder and come back.`;
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

// ================= Render loop =================
let last = performance.now();
let shownLevel = -1; // rebuild the exercise list whenever the level changes
let shownJob: string | null | undefined = undefined; // refresh Work view on job change
function render(now: number) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  game.tick(dt);

  const ex = game.exercise();
  $("strength").textContent = Math.floor(game.state.strength).toLocaleString("en-US");
  $("level").textContent = String(game.state.level);
  if (game.state.level !== shownLevel) {
    shownLevel = game.state.level;
    buildList(); // newly reached level unlocks exercises immediately
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

  // Auto-Trainer control
  $("autolvl").textContent = String(game.state.autoLevel);
  $("autorate").textContent = game.state.autoLevel > 0 ? ` · ${game.autoClicksPerSec()} reps/s` : "";
  const autobuy = $<HTMLButtonElement>("autobuy");
  if (game.autoMaxed()) {
    autobuy.textContent = "MAX";
    autobuy.disabled = true;
  } else {
    autobuy.textContent = `Hire $${game.autoCost().toLocaleString("en-US")}`;
    autobuy.disabled = game.state.money < game.autoCost();
  }

  const cost = game.repCost();
  const fill = $<HTMLElement>("effort");
  fill.style.width = Math.min(100, (game.effort / cost) * 100) + "%";
  const ease = 1 - Math.pow(BALANCE.decay, Math.min(game.currentReps(), BALANCE.decayCap));
  fill.style.background = `hsl(${ease * 130}, 80%, 50%)`;

  $("warmup").textContent = String(Math.floor(game.currentReps()));
  const exhausted = game.muscleFatigue() >= BALANCE.fatigueMax;
  const starving = game.state.hunger <= 0;
  const sick = game.state.health <= 0;
  $("hint").textContent = sick
    ? "too sick — go to the hospital!"
    : starving
      ? "too hungry — eat something!"
      : exhausted
        ? "muscle exhausted — rest or switch!"
        : game.currentReps() < 1
          ? "starts hard…"
          : ease > 0.6
            ? "flowing! 🔥"
            : "getting easier…";
  $("barlbl").textContent = sick ? "HOSPITAL 🏥" : starving ? "EAT 🍽️" : exhausted ? "REST 😮‍💨" : "CLICK TO PUSH";
  $("bar").classList.toggle("exhausted", exhausted || starving || sick);

  $("fatname").textContent = ex.muscle;
  const fat = game.muscleFatigue();
  $<HTMLElement>("fatfill").style.width = fat + "%";
  $<HTMLElement>("fatfill").style.background = fat >= BALANCE.fatigueMax ? "#c0392b" : "#e67e22";

  $("buffs").innerHTML = game.state.buffs
    .map((b) => `<span class="buff">${b.emoji} ${Math.ceil(b.remaining)}s</span>`)
    .join("");

  const av = avatar(game.state.strength);
  $("avatar").textContent = av.emoji;
  $("avatarlbl").textContent = av.label;

  requestAnimationFrame(render);
}

buildList();
requestAnimationFrame(render);
setInterval(() => game.save(), 3000);
window.addEventListener("beforeunload", () => game.save());
