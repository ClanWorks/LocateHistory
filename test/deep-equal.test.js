import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { deepEqual } from "../scripts/lib/deep-equal.js";

describe("deepEqual", () => {
  test("primitives", () => {
    assert.equal(deepEqual(1, 1), true);
    assert.equal(deepEqual(1, 2), false);
    assert.equal(deepEqual("a", "a"), true);
    assert.equal(deepEqual(null, null), true);
    assert.equal(deepEqual(null, undefined), false);
    assert.equal(deepEqual(0, false), false); // strict, not loose
  });

  test("objects are equal regardless of key order", () => {
    assert.equal(deepEqual({ a: 1, b: 2 }, { b: 2, a: 1 }), true);
  });

  test("objects with different keys or values are not equal", () => {
    assert.equal(deepEqual({ a: 1 }, { a: 1, b: 2 }), false);
    assert.equal(deepEqual({ a: 1 }, { a: 2 }), false);
  });

  test("arrays are equal only in the same order", () => {
    assert.equal(deepEqual([1, 2, 3], [1, 2, 3]), true);
    assert.equal(deepEqual([1, 2, 3], [3, 2, 1]), false);
  });

  test("nested structures", () => {
    const a = { id: "x", location: { lat: 1, lng: 2 }, tags: ["a", "b"] };
    const b = { location: { lng: 2, lat: 1 }, tags: ["a", "b"], id: "x" };
    assert.equal(deepEqual(a, b), true);
  });

  test("a nested array-order difference is not equal", () => {
    const a = { tags: ["a", "b"] };
    const b = { tags: ["b", "a"] };
    assert.equal(deepEqual(a, b), false);
  });
});
