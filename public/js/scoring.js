// Pure scoring functions. See plan.md §12. No I/O, no Date.now(), no
// randomness — every value the formulas need is passed in by the caller
// so identical inputs always produce identical outputs.

export const ROUND_DURATION_MS = 30_000;
export const MAX_ROUND_SCORE = 1000;
export const ACCURACY_MAX = 800;
export const TIME_BONUS_MAX = 200;
export const DISTANCE_FULL_CREDIT_KM = 10;
export const DISTANCE_DECAY_KM = 750;
export const EARTH_RADIUS_KM = 6371;

/** Clue name -> point cost. Each clue may only be requested once per round. */
export const CLUE_COSTS = Object.freeze({
  region: 75,
  era: 100,
  country: 200,
});

function toRadians(deg) {
  return (deg * Math.PI) / 180;
}

/**
 * Great-circle distance between two {lat, lng} points, in kilometres.
 */
export function haversineDistanceKm(a, b) {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.asin(Math.min(1, Math.sqrt(h)));
  return EARTH_RADIUS_KM * c;
}

/**
 * Total point cost for a set of requested clues. Duplicate clue names are
 * only charged once, matching the "requested once" rule enforced upstream
 * by the state machine — this function stays defensive rather than trusting
 * the caller.
 * @param {string[]} cluesUsed
 */
export function calculateCluePenalty(cluesUsed) {
  const unique = new Set(cluesUsed);
  let total = 0;
  for (const clue of unique) {
    total += CLUE_COSTS[clue] ?? 0;
  }
  return total;
}

/**
 * @param {number} distanceKm
 * @returns {number} 0-800, full credit inside DISTANCE_FULL_CREDIT_KM, then
 *   exponential decay.
 */
export function calculateAccuracy(distanceKm) {
  if (distanceKm <= DISTANCE_FULL_CREDIT_KM) return ACCURACY_MAX;
  const raw = ACCURACY_MAX * Math.exp(-(distanceKm - DISTANCE_FULL_CREDIT_KM) / DISTANCE_DECAY_KM);
  return Math.min(ACCURACY_MAX, Math.max(0, Math.round(raw)));
}

/**
 * @param {number} remainingMs
 * @param {number} [roundDurationMs]
 * @returns {number} 0-200
 */
export function calculateTimeBonus(remainingMs, roundDurationMs = ROUND_DURATION_MS) {
  const clampedRemaining = Math.min(roundDurationMs, Math.max(0, remainingMs));
  const raw = TIME_BONUS_MAX * (clampedRemaining / roundDurationMs);
  return Math.min(TIME_BONUS_MAX, Math.max(0, Math.round(raw)));
}

/**
 * Compute a full round score from a frozen round snapshot.
 * Timeout always scores zero, regardless of distance — no guess was
 * submitted, so there is nothing to award credit for.
 *
 * @param {object} input
 * @param {boolean} input.timedOut
 * @param {number} [input.distanceKm] required unless timedOut
 * @param {number} [input.remainingMs] required unless timedOut
 * @param {string[]} [input.cluesUsed]
 * @param {number} [input.roundDurationMs]
 * @returns {{ roundScore: number, accuracy: number, timeBonus: number, cluePenalty: number }}
 */
export function calculateRoundScore(input) {
  const cluePenalty = calculateCluePenalty(input.cluesUsed ?? []);

  if (input.timedOut) {
    return { roundScore: 0, accuracy: 0, timeBonus: 0, cluePenalty };
  }

  const accuracy = calculateAccuracy(input.distanceKm);
  const timeBonus = calculateTimeBonus(input.remainingMs, input.roundDurationMs ?? ROUND_DURATION_MS);
  const roundScore = Math.max(0, accuracy + timeBonus - cluePenalty);

  return { roundScore, accuracy, timeBonus, cluePenalty };
}
