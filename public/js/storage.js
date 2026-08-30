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

/**
 * @param {Storage} [storage]
 * @param {number} [maxPossibleScore] the current rules' actual ceiling
 *   (REQUIRED_ROUNDS * MAX_ROUND_SCORE). A stored value above it can only
 *   be left over from a since-changed rule set (e.g. this project went
 *   from 10 rounds to 5, roughly halving the real maximum) — displaying
 *   it as someone's "best score" would show an impossible, permanently
 *   unbeatable number instead of a real one. Optional so callers without
 *   rules context (e.g. a bare unit test) still get the raw stored value.
 */
export function getBestScore(storage, maxPossibleScore) {
  const raw = safeStorage(storage).getItem(BEST_SCORE_KEY);
  const parsed = raw === null ? null : Number(raw);
  if (!Number.isFinite(parsed)) return null;
  if (maxPossibleScore !== undefined && parsed > maxPossibleScore) return null;
  return parsed;
}

/**
 * @param {number} [maxPossibleScore] see getBestScore
 * @returns {{ bestScore: number, isNewBest: boolean }}
 */
export function recordSessionScore(score, storage, maxPossibleScore) {
  const store = safeStorage(storage);
  const current = getBestScore(storage, maxPossibleScore);
  if (current === null || score > current) {
    store.setItem(BEST_SCORE_KEY, String(score));
    return { bestScore: score, isNewBest: true };
  }
  return { bestScore: current, isNewBest: false };
}
