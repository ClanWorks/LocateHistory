// Local-only persistence: whether the player has seen the intro, and
// their best session score. Explicitly excluded from v1 per plan.md §20:
// no accounts, no server-stored history — this is purely a courtesy for
// the same browser/device.
const HAS_SEEN_INTRO_KEY = "photolocation:hasSeenIntro";
const BEST_SCORE_KEY = "photolocation:bestScore";

/**
 * Storage is injectable (defaults to window.localStorage) so this stays
 * testable without a real browser, and so a private-browsing session
 * where localStorage throws doesn't take the whole app down with it.
 */
function safeStorage(storage) {
  const backend = storage ?? (typeof localStorage !== "undefined" ? localStorage : null);
  return {
    getItem(key) {
      try {
        return backend ? backend.getItem(key) : null;
      } catch {
        return null;
      }
    },
    setItem(key, value) {
      try {
        backend?.setItem(key, value);
      } catch {
        // Storage unavailable or full — degrade to "nothing persists",
        // not a crash.
      }
    },
  };
}

export function getHasSeenIntro(storage) {
  return safeStorage(storage).getItem(HAS_SEEN_INTRO_KEY) === "true";
}

export function setHasSeenIntro(storage) {
  safeStorage(storage).setItem(HAS_SEEN_INTRO_KEY, "true");
}

export function getBestScore(storage) {
  const raw = safeStorage(storage).getItem(BEST_SCORE_KEY);
  const parsed = raw === null ? null : Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * @returns {{ bestScore: number, isNewBest: boolean }}
 */
export function recordSessionScore(score, storage) {
  const store = safeStorage(storage);
  const current = getBestScore(storage);
  if (current === null || score > current) {
    store.setItem(BEST_SCORE_KEY, String(score));
    return { bestScore: score, isNewBest: true };
  }
  return { bestScore: current, isNewBest: false };
}
