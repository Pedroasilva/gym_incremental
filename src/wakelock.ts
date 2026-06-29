// Keep the phone screen awake while playing (Screen Wake Lock API). Supported on
// Chrome/Android and iOS Safari 16.4+, over HTTPS. Gracefully no-ops elsewhere.
// The lock is auto-released when the tab is hidden, so we re-acquire on visibility.

interface WakeLockSentinelLike {
  release(): Promise<void>;
  addEventListener(type: "release", listener: () => void): void;
}
interface WakeLockLike {
  request(type: "screen"): Promise<WakeLockSentinelLike>;
}

const KEY = "gym_incremental_wakelock";
const api = (navigator as Navigator & { wakeLock?: WakeLockLike }).wakeLock;
let enabled = localStorage.getItem(KEY) !== "0"; // default ON
let sentinel: WakeLockSentinelLike | null = null;

export function wakeLockSupported(): boolean {
  return !!api;
}
export function isWakeLockOn(): boolean {
  return enabled;
}

async function acquire() {
  if (!api || !enabled || sentinel || document.visibilityState !== "visible") return;
  try {
    sentinel = await api.request("screen");
    sentinel.addEventListener("release", () => (sentinel = null));
  } catch {
    sentinel = null; // request can reject (e.g. not focused) — retry on next gesture/visibility
  }
}
async function release() {
  try {
    await sentinel?.release();
  } catch {
    /* ignore */
  }
  sentinel = null;
}

export function setWakeLock(on: boolean) {
  enabled = on;
  localStorage.setItem(KEY, on ? "1" : "0");
  if (on) acquire();
  else release();
}

export function initWakeLock() {
  if (!api) return;
  acquire();
  // re-acquire when returning to the tab (the lock drops while hidden)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") acquire();
  });
  // some browsers only grant the lock after a user gesture — retry on first interaction
  const retry = () => {
    acquire();
    window.removeEventListener("pointerdown", retry);
  };
  window.addEventListener("pointerdown", retry);
}
