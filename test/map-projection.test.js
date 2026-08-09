import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { project, graticuleLines } from "../public/js/map-projection.js";

describe("project", () => {
  test("the prime meridian / equator origin maps to the center of the map", () => {
    const p = project(0, 0, 600, 300);
    assert.deepEqual(p, { x: 300, y: 150 });
  });

  test("the top-left corner is (lat 90, lng -180)", () => {
    assert.deepEqual(project(90, -180, 600, 300), { x: 0, y: 0 });
  });

  test("the bottom-right corner is (lat -90, lng 180)", () => {
    assert.deepEqual(project(-90, 180, 600, 300), { x: 600, y: 300 });
  });

  test("latitude increases upward (north is up)", () => {
    const north = project(45, 0, 600, 300);
    const south = project(-45, 0, 600, 300);
    assert.ok(north.y < south.y, "a higher latitude must have a smaller y (closer to the top)");
  });

  test("longitude increases rightward (east is right)", () => {
    const west = project(0, -90, 600, 300);
    const east = project(0, 90, 600, 300);
    assert.ok(west.x < east.x, "a higher (more eastward) longitude must have a larger x");
  });
});

describe("graticuleLines", () => {
  test("marks exactly one line as the equator and one as the prime meridian", () => {
    const lines = graticuleLines(600, 300, 30);
    assert.equal(lines.filter((l) => l.emphasis === "equator").length, 1);
    assert.equal(lines.filter((l) => l.emphasis === "prime-meridian").length, 1);
  });

  test("every line's coordinates stay within the map bounds", () => {
    const lines = graticuleLines(600, 300, 30);
    for (const l of lines) {
      for (const [x, y] of [
        [l.x1, l.y1],
        [l.x2, l.y2],
      ]) {
        assert.ok(x >= 0 && x <= 600, `x=${x} out of bounds`);
        assert.ok(y >= 0 && y <= 300, `y=${y} out of bounds`);
      }
    }
  });
});
