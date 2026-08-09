import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  haversineDistanceKm,
  calculateAccuracy,
  calculateTimeBonus,
  calculateCluePenalty,
  calculateRoundScore,
  ROUND_DURATION_MS,
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
    const value = calculateAccuracy(11);
    assert.ok(value < 800 && value > 790, `expected a small decay just past 10km, got ${value}`);
  });

  test("decays substantially by 760km (~1/e)", () => {
    assertClose(calculateAccuracy(760), 294, 2);
  });

  test("never goes negative for very large distances", () => {
    assert.equal(calculateAccuracy(20000), 0);
  });
});

describe("calculateTimeBonus", () => {
  test("full bonus at full remaining time", () => {
    assert.equal(calculateTimeBonus(ROUND_DURATION_MS), 200);
  });

  test("zero bonus at zero remaining time", () => {
    assert.equal(calculateTimeBonus(0), 0);
  });

  test("half remaining time gives half bonus", () => {
    assert.equal(calculateTimeBonus(ROUND_DURATION_MS / 2), 100);
  });

  test("clamps negative remaining time to zero", () => {
    assert.equal(calculateTimeBonus(-5000), 0);
  });

  test("clamps remaining time above the round duration to the max", () => {
    assert.equal(calculateTimeBonus(ROUND_DURATION_MS * 2), 200);
  });
});

describe("calculateCluePenalty", () => {
  test("no clues costs nothing", () => {
    assert.equal(calculateCluePenalty([]), 0);
  });

  test("sums distinct clue costs", () => {
    assert.equal(calculateCluePenalty(["region", "era", "country"]), 75 + 100 + 200);
  });

  test("does not double-charge a repeated clue", () => {
    assert.equal(calculateCluePenalty(["region", "region"]), 75);
  });

  test("ignores unknown clue names rather than throwing", () => {
    assert.equal(calculateCluePenalty(["not-a-real-clue"]), 0);
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
});
