import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  haversineDistanceKm,
  calculateAccuracy,
  calculateTimeBonus,
  calculateCluePenalty,
  calculateCountryCluePenalty,
  calculateConfoundScore,
  calculateRoundScore,
  ROUND_DURATION_MS,
  TIME_BONUS_GRACE_MS,
  ACCURACY_MAX,
  COUNTRY_CLUE_MIN_COST,
  COUNTRY_CLUE_MAX_COST,
  COUNTRY_CLUE_REFERENCE_SCORE,
  DISTANCE_FULL_CREDIT_KM,
  DISTANCE_DECAY_KM,
} from "../public/js/scoring.js";

function assertClose(actual, expected, tolerance, message) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${message}: expected ${actual} within ${tolerance} of ${expected}`);
}

describe("haversineDistanceKm", () => {
  test("same point is zero distance", () => {
    assert.equal(haversineDistanceKm({ lat: 51.5, lng: -0.12 }, { lat: 51.5, lng: -0.12 }), 0);
  });

  test("one degree of latitude at the equator is ~111.2km", () => {
    assertClose(haversineDistanceKm({ lat: 0, lng: 0 }, { lat: 1, lng: 0 }), 111.2, 1);
  });

  test("London to Paris is ~343km", () => {
    const london = { lat: 51.5074, lng: -0.1278 };
    const paris = { lat: 48.8566, lng: 2.3522 };
    assertClose(haversineDistanceKm(london, paris), 343, 5);
  });

  test("is symmetric", () => {
    const a = { lat: 10, lng: 20 };
    const b = { lat: -5, lng: 100 };
    assertClose(haversineDistanceKm(a, b), haversineDistanceKm(b, a), 0.0001);
  });
});

describe("calculateAccuracy", () => {
  test("full credit at zero distance", () => {
    assert.equal(calculateAccuracy(0), 800);
  });

  test("full credit at exactly the 10km boundary", () => {
    assert.equal(calculateAccuracy(10), 800);
  });

  test("decays just past the boundary", () => {
    // The GeoGuessr-calibrated decay constant (~2,000km) is gentle enough
    // that 1km past the boundary rounds back to 800 — this checks a
    // distance where the decay is actually detectable instead.
    const value = calculateAccuracy(DISTANCE_FULL_CREDIT_KM + 100);
    assert.ok(value < 800 && value > 700, `expected a small decay 100km past the boundary, got ${value}`);
  });

  test("decays to ~1/e of max one decay-constant past the full-credit boundary", () => {
    const distance = DISTANCE_FULL_CREDIT_KM + DISTANCE_DECAY_KM;
    assertClose(calculateAccuracy(distance), ACCURACY_MAX / Math.E, 2);
  });

  test("never goes negative for very large distances", () => {
    assert.equal(calculateAccuracy(20000), 0);
  });

  test("rejects NaN/undefined instead of silently returning full credit", () => {
    assert.throws(() => calculateAccuracy(undefined), TypeError);
    assert.throws(() => calculateAccuracy(NaN), TypeError);
  });

  test("rejects a negative distance instead of treating it as full credit", () => {
    assert.throws(() => calculateAccuracy(-5), RangeError);
  });
});

describe("calculateTimeBonus", () => {
  test("full bonus at full remaining time", () => {
    assert.equal(calculateTimeBonus(ROUND_DURATION_MS), 200);
  });

  test("zero bonus at zero remaining time", () => {
    assert.equal(calculateTimeBonus(0), 0);
  });

  test("full bonus anywhere inside the grace period (M5: a penalty-free chance to answer)", () => {
    const remainingAtGraceBoundary = ROUND_DURATION_MS - TIME_BONUS_GRACE_MS;
    assert.equal(calculateTimeBonus(remainingAtGraceBoundary), 200);
    assert.equal(calculateTimeBonus(ROUND_DURATION_MS - 1), 200); // answered almost instantly
  });

  test("decays linearly to zero over the remainder of the round after the grace period", () => {
    // elapsed = grace + half of what's left of the round -> half bonus
    const decayWindow = ROUND_DURATION_MS - TIME_BONUS_GRACE_MS;
    const remaining = ROUND_DURATION_MS - (TIME_BONUS_GRACE_MS + decayWindow / 2);
    assert.equal(calculateTimeBonus(remaining), 100);
  });

  test("a true instant, full-accuracy guess can reach the full 1000-point max (accuracy + time bonus)", () => {
    assert.equal(calculateAccuracy(0) + calculateTimeBonus(ROUND_DURATION_MS, ROUND_DURATION_MS, calculateAccuracy(0)), 1000);
  });

  test("clamps negative remaining time to zero", () => {
    assert.equal(calculateTimeBonus(-5000), 0);
  });

  test("clamps remaining time above the round duration to the max", () => {
    assert.equal(calculateTimeBonus(ROUND_DURATION_MS * 2), 200);
  });

  test("scales down with accuracy (M5: a fast-but-wrong guess shouldn't earn a near-full bonus)", () => {
    assert.equal(calculateTimeBonus(ROUND_DURATION_MS, ROUND_DURATION_MS, ACCURACY_MAX / 2), 100);
    assert.equal(calculateTimeBonus(ROUND_DURATION_MS, ROUND_DURATION_MS, 0), 0);
  });

  test("rejects a non-numeric remainingMs", () => {
    assert.throws(() => calculateTimeBonus(undefined), TypeError);
    assert.throws(() => calculateTimeBonus(NaN), TypeError);
  });

  test("rejects a zero or negative round duration instead of dividing by it", () => {
    assert.throws(() => calculateTimeBonus(1000, 0), RangeError);
    assert.throws(() => calculateTimeBonus(1000, -30000), RangeError);
  });

  test("rejects an accuracy outside 0-ACCURACY_MAX", () => {
    assert.throws(() => calculateTimeBonus(1000, ROUND_DURATION_MS, ACCURACY_MAX + 1), RangeError);
    assert.throws(() => calculateTimeBonus(1000, ROUND_DURATION_MS, -1), RangeError);
  });
});

describe("calculateConfoundScore", () => {
  test("a place with nothing else nearby or in-country scores zero", () => {
    const isolated = { id: "a", lat: 0, lng: 0, country: "Nowhereland" };
    const farAway = { id: "b", lat: 45, lng: 90, country: "Elsewhere" };
    assert.equal(calculateConfoundScore(isolated, [isolated, farAway]), 0);
  });

  test("a nearby place (within 100km) weighs more than an equally-distant same-country place beyond 5000km", () => {
    const place = { id: "a", lat: 0, lng: 0, country: "A-land" };
    const near = { id: "b", lat: 0.5, lng: 0, country: "Other" }; // ~55km away
    const farCompatriot = { id: "c", lat: 50, lng: 0, country: "A-land" }; // ~5560km away, same country
    const scoreWithNear = calculateConfoundScore(place, [place, near]);
    const scoreWithFarCompatriot = calculateConfoundScore(place, [place, farCompatriot]);
    assert.ok(scoreWithNear > scoreWithFarCompatriot, `expected a 100km neighbor (${scoreWithNear}) to outweigh a same-country place 5560km away (${scoreWithFarCompatriot})`);
  });

  test("a remote place with nothing within 1000km still scores above zero if something is within 5000km (M6: no cliff to zero for e.g. Fiji)", () => {
    const place = { id: "a", lat: 0, lng: 0, country: "Remoteland" };
    const distant = { id: "b", lat: 25, lng: 0, country: "Other" }; // ~2780km away — inside the 2000-5000km ring, not same country
    const score = calculateConfoundScore(place, [place, distant]);
    assert.ok(score > 0, `expected a 2780km neighbor to still contribute something, got ${score}`);
  });

  test("excludes the place itself from its own gazetteer scan", () => {
    const place = { id: "a", lat: 0, lng: 0, country: "A-land" };
    assert.equal(calculateConfoundScore(place, [place]), 0);
  });
});

describe("calculateCountryCluePenalty", () => {
  test("falls back to the flat reference cost when confoundScore is unknown", () => {
    assert.equal(calculateCountryCluePenalty(null), 200);
    assert.equal(calculateCountryCluePenalty(undefined), 200);
  });

  test("costs the most for a fully isolated place — zero confounds (M5: small-country giveaway)", () => {
    assert.equal(calculateCountryCluePenalty(0), COUNTRY_CLUE_MAX_COST);
  });

  test("costs close to the base amount right at the reference score", () => {
    // Not exactly 200 — the formula divides by (score + 1), not score, to
    // stay finite at score 0 — but close, which is all the constant is
    // calibrated for (see the comment above COUNTRY_CLUE_REFERENCE_SCORE).
    assertClose(calculateCountryCluePenalty(COUNTRY_CLUE_REFERENCE_SCORE), 200, 10);
  });

  test("costs less the more confounds surround the place", () => {
    assert.equal(calculateCountryCluePenalty(100), COUNTRY_CLUE_MIN_COST);
  });

  test("is clamped, never below MIN or above MAX", () => {
    for (const n of [0, 1, 2, 3, 4, 5, 8, 12, 50, 1000]) {
      const cost = calculateCountryCluePenalty(n);
      assert.ok(cost >= COUNTRY_CLUE_MIN_COST && cost <= COUNTRY_CLUE_MAX_COST, `cost ${cost} for n=${n} out of range`);
    }
  });

  test("rejects a negative or non-finite confoundScore", () => {
    assert.throws(() => calculateCountryCluePenalty(-1), RangeError);
    assert.throws(() => calculateCountryCluePenalty(NaN), TypeError);
    assert.throws(() => calculateCountryCluePenalty(Infinity), TypeError);
  });
});

describe("calculateCluePenalty", () => {
  test("no clues costs nothing", () => {
    assert.equal(calculateCluePenalty([]), 0);
  });

  test("sums distinct clue costs, using the flat country cost when no gazetteer context is given", () => {
    assert.equal(calculateCluePenalty(["region", "era", "country"]), 75 + 100 + 200);
  });

  test("does not double-charge a repeated clue", () => {
    assert.equal(calculateCluePenalty(["region", "region"]), 75);
  });

  test("ignores unknown clue names rather than throwing", () => {
    assert.equal(calculateCluePenalty(["not-a-real-clue"]), 0);
  });

  test("threads countryClueConfoundScore through to the country clue's real cost", () => {
    assert.equal(calculateCluePenalty(["country"], { countryClueConfoundScore: 0 }), COUNTRY_CLUE_MAX_COST);
    assert.equal(calculateCluePenalty(["country"], { countryClueConfoundScore: 100 }), COUNTRY_CLUE_MIN_COST);
  });

  test("rejects a non-array cluesUsed", () => {
    assert.throws(() => calculateCluePenalty(undefined), TypeError);
    assert.throws(() => calculateCluePenalty("region"), TypeError);
  });
});

describe("calculateRoundScore", () => {
  test("a perfect, fast, clue-free guess scores the full 1000", () => {
    const result = calculateRoundScore({ timedOut: false, distanceKm: 0, remainingMs: ROUND_DURATION_MS, cluesUsed: [] });
    assert.deepEqual(result, { roundScore: 1000, accuracy: 800, timeBonus: 200, cluePenalty: 0 });
  });

  test("timeout always scores zero, even if distance/time would otherwise score well", () => {
    const result = calculateRoundScore({ timedOut: true, distanceKm: 0, remainingMs: ROUND_DURATION_MS, cluesUsed: [] });
    assert.deepEqual(result, { roundScore: 0, accuracy: 0, timeBonus: 0, cluePenalty: 0 });
  });

  test("clue penalty floors the round score at zero rather than going negative", () => {
    const result = calculateRoundScore({ timedOut: false, distanceKm: 20000, remainingMs: 0, cluesUsed: ["country"] });
    assert.equal(result.roundScore, 0);
  });

  test("identical inputs produce identical outputs", () => {
    const input = { timedOut: false, distanceKm: 452.3, remainingMs: 12345, cluesUsed: ["region"] };
    assert.deepEqual(calculateRoundScore(input), calculateRoundScore({ ...input }));
  });

  test("a fast, essentially random guess no longer earns a near-full time bonus (M5 session 1)", () => {
    // Instant guess, but on the other side of the planet: accuracy ~= 0,
    // so the time bonus this earns is now scaled down to ~0 too, instead
    // of the old flat 200 that was independent of how wrong the guess was.
    const result = calculateRoundScore({ timedOut: false, distanceKm: 15000, remainingMs: ROUND_DURATION_MS, cluesUsed: [] });
    assert.ok(result.timeBonus < 20, `expected a near-zero time bonus for a near-zero-accuracy guess, got ${result.timeBonus}`);
  });

  test("passes countryClueConfoundScore through to the country clue's real cost", () => {
    const rare = calculateRoundScore({ timedOut: false, distanceKm: 0, remainingMs: 0, cluesUsed: ["country"], countryClueConfoundScore: 0 });
    const common = calculateRoundScore({ timedOut: false, distanceKm: 0, remainingMs: 0, cluesUsed: ["country"], countryClueConfoundScore: 100 });
    assert.equal(rare.cluePenalty, COUNTRY_CLUE_MAX_COST);
    assert.equal(common.cluePenalty, COUNTRY_CLUE_MIN_COST);
  });

  test("propagates the underlying validation error instead of returning NaN for a non-timeout round", () => {
    assert.throws(() => calculateRoundScore({ timedOut: false, distanceKm: undefined, remainingMs: 1000, cluesUsed: [] }), TypeError);
    assert.throws(() => calculateRoundScore({ timedOut: false, distanceKm: 100, remainingMs: NaN, cluesUsed: [] }), TypeError);
  });
});
