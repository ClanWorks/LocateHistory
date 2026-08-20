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

// M5 play-test (PLAYTEST.md, session 2): "The time penalty kicks in
// instantly, this means a perfect score is not possible, there should be
// a penalty free chance to answer the questions." The first GRACE_MS of
// a round earns the full time bonus; only the remainder of the round
// decays linearly to zero. A true instant, fully-accurate guess can
// therefore reach 1000.
export const TIME_BONUS_GRACE_MS = 3000;

/** Clue name -> point cost. Each clue may only be requested once per round.
 * `country` is a reference/fallback value only — see
 * calculateCountryCluePenalty for the real, gazetteer-size-aware cost. */
export const CLUE_COSTS = Object.freeze({
  region: 75,
  era: 100,
  country: 200,
});

// M5 play-test (session 1): "The country and region hints were powerful,
// especially when the location was in a small country. Consider a
// percentage drop." A flat 200-point country clue is nearly a giveaway
// when the gazetteer has only one or two cities in that country, and
// mild when it has a dozen. The cost scales inversely with how many
// gazetteer places share the answer's country: fewer candidates (more
// informative clue) costs more, more candidates (less informative)
// costs less. COUNTRY_CLUE_REFERENCE_CANDIDATES is calibrated so a
// "typical" country-size clue still costs close to the old flat 200.
export const COUNTRY_CLUE_BASE_COST = 200;
export const COUNTRY_CLUE_REFERENCE_CANDIDATES = 4;
export const COUNTRY_CLUE_MIN_COST = 150;
export const COUNTRY_CLUE_MAX_COST = 400;

function toRadians(deg) {
  return (deg * Math.PI) / 180;
}

function assertFiniteNumber(value, label) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError(`${label} must be a finite number, got ${JSON.stringify(value)}`);
  }
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
 * The country clue's real cost: inversely proportional to how many
 * gazetteer places share the answer's country, clamped to a sane range.
 * @param {number | null | undefined} candidateCount number of gazetteer
 *   entries sharing the round's answer country; null/undefined falls back
 *   to CLUE_COSTS.country (used when the caller doesn't have gazetteer
 *   context, e.g. a bare unit test).
 */
export function calculateCountryCluePenalty(candidateCount) {
  if (candidateCount == null) return CLUE_COSTS.country;
  if (!Number.isInteger(candidateCount) || candidateCount < 1) {
    throw new RangeError(`candidateCount must be a positive integer, got ${JSON.stringify(candidateCount)}`);
  }
  const raw = COUNTRY_CLUE_BASE_COST * (COUNTRY_CLUE_REFERENCE_CANDIDATES / candidateCount);
  return Math.round(Math.min(COUNTRY_CLUE_MAX_COST, Math.max(COUNTRY_CLUE_MIN_COST, raw)));
}

/**
 * Total point cost for a set of requested clues. Duplicate clue names are
 * only charged once, matching the "requested once" rule enforced upstream
 * by the state machine — this function stays defensive rather than trusting
 * the caller.
 * @param {string[]} cluesUsed
 * @param {object} [options]
 * @param {number} [options.countryCandidateCount] see calculateCountryCluePenalty
 */
export function calculateCluePenalty(cluesUsed, options = {}) {
  if (!Array.isArray(cluesUsed)) {
    throw new TypeError(`cluesUsed must be an array, got ${JSON.stringify(cluesUsed)}`);
  }
  const unique = new Set(cluesUsed);
  let total = 0;
  for (const clue of unique) {
    if (clue === "country") {
      total += calculateCountryCluePenalty(options.countryCandidateCount);
    } else {
      total += CLUE_COSTS[clue] ?? 0;
    }
  }
  return total;
}

/**
 * @param {number} distanceKm
 * @returns {number} 0-800, full credit inside DISTANCE_FULL_CREDIT_KM, then
 *   exponential decay.
 */
export function calculateAccuracy(distanceKm) {
  assertFiniteNumber(distanceKm, "distanceKm");
  if (distanceKm < 0) {
    throw new RangeError(`distanceKm must not be negative, got ${distanceKm}`);
  }
  if (distanceKm <= DISTANCE_FULL_CREDIT_KM) return ACCURACY_MAX;
  const raw = ACCURACY_MAX * Math.exp(-(distanceKm - DISTANCE_FULL_CREDIT_KM) / DISTANCE_DECAY_KM);
  return Math.min(ACCURACY_MAX, Math.max(0, Math.round(raw)));
}

/**
 * Time bonus: full credit for answering within TIME_BONUS_GRACE_MS,
 * decaying linearly to zero over the rest of the round after that —
 * then scaled by how accurate the guess was. The accuracy scaling is
 * the fix for the M5 finding that a fast-but-wrong guess earned nearly
 * the same time bonus as a fast-and-correct one; an inaccurate guess
 * now earns little or no time bonus regardless of speed.
 *
 * @param {number} remainingMs
 * @param {number} [roundDurationMs]
 * @param {number} [accuracy] 0-ACCURACY_MAX, from calculateAccuracy;
 *   defaults to full accuracy so existing callers that only care about
 *   the raw time-based curve (e.g. tests) keep working unscaled.
 * @returns {number} 0-200
 */
export function calculateTimeBonus(remainingMs, roundDurationMs = ROUND_DURATION_MS, accuracy = ACCURACY_MAX) {
  assertFiniteNumber(remainingMs, "remainingMs");
  assertFiniteNumber(roundDurationMs, "roundDurationMs");
  assertFiniteNumber(accuracy, "accuracy");
  if (roundDurationMs <= 0) {
    throw new RangeError(`roundDurationMs must be greater than zero, got ${roundDurationMs}`);
  }
  if (accuracy < 0 || accuracy > ACCURACY_MAX) {
    throw new RangeError(`accuracy must be between 0 and ${ACCURACY_MAX}, got ${accuracy}`);
  }

  const clampedRemaining = Math.min(roundDurationMs, Math.max(0, remainingMs));
  const elapsedMs = roundDurationMs - clampedRemaining;
  const graceMs = Math.min(TIME_BONUS_GRACE_MS, roundDurationMs);
  const decayWindowMs = Math.max(1, roundDurationMs - graceMs); // guards a custom duration <= grace

  const timeFraction = elapsedMs <= graceMs ? 1 : Math.min(1, Math.max(0, 1 - (elapsedMs - graceMs) / decayWindowMs));
  const accuracyFactor = accuracy / ACCURACY_MAX;
  const raw = TIME_BONUS_MAX * timeFraction * accuracyFactor;
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
 * @param {number} [input.countryCandidateCount] see calculateCountryCluePenalty
 * @returns {{ roundScore: number, accuracy: number, timeBonus: number, cluePenalty: number }}
 */
export function calculateRoundScore(input) {
  const cluePenalty = calculateCluePenalty(input.cluesUsed ?? [], { countryCandidateCount: input.countryCandidateCount });

  if (input.timedOut) {
    return { roundScore: 0, accuracy: 0, timeBonus: 0, cluePenalty };
  }

  const accuracy = calculateAccuracy(input.distanceKm);
  const timeBonus = calculateTimeBonus(input.remainingMs, input.roundDurationMs ?? ROUND_DURATION_MS, accuracy);
  const roundScore = Math.max(0, accuracy + timeBonus - cluePenalty);

  return { roundScore, accuracy, timeBonus, cluePenalty };
}
