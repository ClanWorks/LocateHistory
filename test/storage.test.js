import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { getHasSeenIntro, setHasSeenIntro, getBestScore, recordSessionScore } from "../public/js/storage.js";

/** Minimal in-memory Storage-alike for tests — no real localStorage in Node. */
function makeFakeStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, v),
  };
}

describe("hasSeenIntro", () => {
  test("defaults to false when nothing stored", () => {
    assert.equal(getHasSeenIntro(makeFakeStorage()), false);
  });

  test("becomes true after being set", () => {
    const storage = makeFakeStorage();
    setHasSeenIntro(storage);
    assert.equal(getHasSeenIntro(storage), true);
  });
});

describe("bestScore / recordSessionScore", () => {
  test("no best score recorded initially", () => {
    assert.equal(getBestScore(makeFakeStorage()), null);
  });

  test("first recorded score becomes the best", () => {
    const storage = makeFakeStorage();
    const result = recordSessionScore(4200, storage);
    assert.deepEqual(result, { bestScore: 4200, isNewBest: true });
    assert.equal(getBestScore(storage), 4200);
  });

  test("a lower score does not overwrite the best", () => {
    const storage = makeFakeStorage();
    recordSessionScore(5000, storage);
    const result = recordSessionScore(3000, storage);
    assert.deepEqual(result, { bestScore: 5000, isNewBest: false });
    assert.equal(getBestScore(storage), 5000);
  });

  test("a higher score overwrites the best", () => {
    const storage = makeFakeStorage();
    recordSessionScore(5000, storage);
    const result = recordSessionScore(6000, storage);
    assert.deepEqual(result, { bestScore: 6000, isNewBest: true });
  });

  test("degrades gracefully when the storage backend throws (e.g. private browsing)", () => {
    const throwingStorage = {
      getItem: () => {
        throw new Error("storage disabled");
      },
      setItem: () => {
        throw new Error("storage disabled");
      },
    };
    assert.equal(getHasSeenIntro(throwingStorage), false);
    assert.doesNotThrow(() => setHasSeenIntro(throwingStorage));
    assert.doesNotThrow(() => recordSessionScore(100, throwingStorage));
  });
});
