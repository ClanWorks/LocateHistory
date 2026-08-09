import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { processMedia, resolveConfinedPath } from "../scripts/lib/media.js";
import { makeTinyPng } from "./helpers/make-tiny-png.js";

/** srcset entries are "path Nw" — take only the descriptor width, not
 * any digits that happen to appear inside the opaque filename itself. */
function srcsetWidths(srcset) {
  return srcset.split(", ").map((entry) => Number(entry.trim().split(" ")[1].replace("w", "")));
}

describe("processMedia", () => {
  let originalsDir;
  let assetsOutDir;

  before(() => {
    originalsDir = fs.mkdtempSync(path.join(os.tmpdir(), "photolocation-media-originals-"));
    assetsOutDir = fs.mkdtempSync(path.join(os.tmpdir(), "photolocation-media-assets-"));
  });

  after(() => {
    fs.rmSync(originalsDir, { recursive: true, force: true });
    fs.rmSync(assetsOutDir, { recursive: true, force: true });
  });

  test("an image between two target widths uses its full native resolution as the largest variant", async () => {
    // Regression test: TARGET_WIDTHS is [480, 960, 1600]. An 800px-wide
    // original used to get filtered down to just the 480px target
    // (everything larger was simply dropped for exceeding the original),
    // throwing away 320px of real, available detail instead of using it
    // as the largest/default variant.
    fs.writeFileSync(path.join(originalsDir, "between-targets.png"), makeTinyPng(800, 500, [50, 100, 150]));
    const result = await processMedia(
      { id: "between-targets", media: { originalPath: "between-targets.png" } },
      { originalsDir, assetsOutDir, minDimensionPx: 100 }
    );
    assert.equal(result.width, 800, "the largest/default variant must use the original's full width, not cap at 480");
    assert.equal(result.height, 500);
    const widths = srcsetWidths(result.srcset);
    assert.deepEqual(widths, [480, 800]);
  });

  test("an image narrower than every target width produces exactly one native-size variant", async () => {
    fs.writeFileSync(path.join(originalsDir, "small.png"), makeTinyPng(300, 200, [200, 50, 50]));
    const result = await processMedia({ id: "small", media: { originalPath: "small.png" } }, { originalsDir, assetsOutDir, minDimensionPx: 100 });
    const widths = srcsetWidths(result.srcset);
    assert.deepEqual(widths, [300]);
    assert.equal(result.width, 300);
  });

  test("an image wider than every target width produces all three variants, capped at 1600", async () => {
    fs.writeFileSync(path.join(originalsDir, "big.png"), makeTinyPng(2000, 1200, [10, 10, 10]));
    const result = await processMedia({ id: "big", media: { originalPath: "big.png" } }, { originalsDir, assetsOutDir, minDimensionPx: 100 });
    const widths = srcsetWidths(result.srcset);
    assert.deepEqual(widths, [480, 960, 1600]);
    assert.equal(result.width, 1600, "must not upscale — 1600 is the cap, not the original 2000");
  });

  test("rejects an image below the minimum dimension on either side", async () => {
    fs.writeFileSync(path.join(originalsDir, "tiny.png"), makeTinyPng(300, 600, [1, 2, 3]));
    await assert.rejects(
      () => processMedia({ id: "tiny", media: { originalPath: "tiny.png" } }, { originalsDir, assetsOutDir, minDimensionPx: 480 }),
      /below the 480px minimum/
    );
  });

  test("rejects a path that escapes originalsDir", async () => {
    await assert.rejects(
      () => processMedia({ id: "evil", media: { originalPath: "../../../../etc/passwd" } }, { originalsDir, assetsOutDir }),
      /unsafe media path/
    );
  });

  test("strips EXIF metadata from the output, even when the original has it", async () => {
    const withExif = await sharp(makeTinyPng(600, 600, [80, 80, 200]))
      .jpeg()
      .withExif({ IFD0: { Copyright: "should not survive the pipeline", Artist: "Test Artist" } })
      .toBuffer();
    fs.writeFileSync(path.join(originalsDir, "has-exif.jpg"), withExif);

    // Confirm the fixture actually carries EXIF before processing —
    // otherwise this test would trivially pass for the wrong reason.
    const beforeMeta = await sharp(withExif).metadata();
    assert.ok(beforeMeta.exif, "test fixture must actually contain EXIF data to begin with");

    const result = await processMedia({ id: "has-exif", media: { originalPath: "has-exif.jpg" } }, { originalsDir, assetsOutDir, minDimensionPx: 100 });
    const outputBytes = fs.readFileSync(path.join(assetsOutDir, path.basename(result.src)));
    const afterMeta = await sharp(outputBytes).metadata();
    assert.equal(afterMeta.exif, undefined, "output must not carry the original's EXIF data");
  });

  test("two different source images never collide on asset name", async () => {
    fs.writeFileSync(path.join(originalsDir, "a.png"), makeTinyPng(600, 600, [1, 1, 1]));
    fs.writeFileSync(path.join(originalsDir, "b.png"), makeTinyPng(600, 600, [2, 2, 2]));
    const a = await processMedia({ id: "a", media: { originalPath: "a.png" } }, { originalsDir, assetsOutDir, minDimensionPx: 100 });
    const b = await processMedia({ id: "b", media: { originalPath: "b.png" } }, { originalsDir, assetsOutDir, minDimensionPx: 100 });
    assert.notEqual(a.src, b.src);
  });
});

describe("resolveConfinedPath", () => {
  test("resolves a normal relative path inside the base directory", () => {
    const result = resolveConfinedPath("/base/dir", "photo.jpg");
    assert.equal(result, "/base/dir/photo.jpg");
  });

  test("throws for a path that escapes via ../", () => {
    assert.throws(() => resolveConfinedPath("/base/dir", "../../etc/passwd"), /unsafe media path/);
  });

  test("throws for an absolute path outside the base directory", () => {
    assert.throws(() => resolveConfinedPath("/base/dir", "/etc/passwd"), /unsafe media path/);
  });
});
