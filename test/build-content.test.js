import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { buildManifest } from "../scripts/build-content.js";

/** Minimal real (not copied/faked) PNG, for tests that need genuinely
 * distinct image bytes so checksums actually differ. */
function makeTinyPng(width, height, [r, g, b]) {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  const crc32 = (buf) => {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, "ascii");
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  };

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 2;
  const ihdr = chunk("IHDR", ihdrData);

  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (width * 3 + 1);
    raw[rowStart] = 0;
    for (let x = 0; x < width; x++) {
      const px = rowStart + 1 + x * 3;
      raw[px] = r;
      raw[px + 1] = g;
      raw[px + 2] = b;
    }
  }
  const idat = chunk("IDAT", zlib.deflateSync(raw));
  const iend = chunk("IEND", Buffer.alloc(0));
  return Buffer.concat([sig, ihdr, idat, iend]);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");
const fixturesSourceDir = path.join(__dirname, "fixtures", "source");
const fixturesOriginalsDir = path.join(__dirname, "fixtures", "originals");
const buildScript = path.join(repoRoot, "scripts", "build-content.js");

// Fixtures intentionally keep to a small, fast 2-approved-item set — well
// below production's REQUIRED_ROUNDS (10) minimum. Every call below opts
// into that explicitly via minApprovedItems, which is exactly the
// fixture/test-mode escape hatch: production (the CLI's default) never
// gets to skip the minimum, only tests that say so on purpose.
const FIXTURE_MIN_ITEMS = 2;

describe("buildManifest (fixture content)", () => {
  let assetsOutDir;

  before(() => {
    assetsOutDir = fs.mkdtempSync(path.join(os.tmpdir(), "photolocation-build-test-"));
  });

  after(() => {
    fs.rmSync(assetsOutDir, { recursive: true, force: true });
  });

  test("publishes only approved items, in order", () => {
    const { manifest, approvedCount, totalCount } = buildManifest({ sourceDir: fixturesSourceDir, assetsOutDir, minApprovedItems: FIXTURE_MIN_ITEMS });
    assert.equal(totalCount, 3, "fixture set has 3 source items");
    assert.equal(approvedCount, 2, "fixture set has 2 approved items");
    assert.equal(manifest.items.length, 2);
    assert.deepEqual(manifest.items.map((i) => i.id), ["prague-castle-1830", "oslo-harbour-1900"]);
  });

  test("excludes draft items from the manifest even with incomplete attribution", () => {
    const { manifest } = buildManifest({ sourceDir: fixturesSourceDir, assetsOutDir, minApprovedItems: FIXTURE_MIN_ITEMS });
    assert.ok(!manifest.items.some((i) => i.id === "prague-unverified-license"));
  });

  test("real image dimensions are read from the PNG, not hardcoded", () => {
    const { manifest } = buildManifest({ sourceDir: fixturesSourceDir, assetsOutDir, minApprovedItems: FIXTURE_MIN_ITEMS });
    const prague = manifest.items.find((i) => i.id === "prague-castle-1830");
    const oslo = manifest.items.find((i) => i.id === "oslo-harbour-1900");
    assert.deepEqual([prague.image.width, prague.image.height], [400, 300]);
    assert.deepEqual([oslo.image.width, oslo.image.height], [320, 240]);
  });

  test("asset filenames are opaque (checksum-derived), not the original filename", () => {
    const { manifest } = buildManifest({ sourceDir: fixturesSourceDir, assetsOutDir, minApprovedItems: FIXTURE_MIN_ITEMS });
    for (const item of manifest.items) {
      const basename = path.basename(item.image.src);
      assert.doesNotMatch(basename, /prague|oslo|castle|harbour/i, "asset name must not leak the source filename");
      assert.match(basename, /^[0-9a-f]{16}\.png$/, "asset name must be a 16-char hex checksum + extension");
      assert.ok(fs.existsSync(path.join(assetsOutDir, basename)), "asset must actually be written to the output dir");
    }
  });

  test("is deterministic: rebuilding from the same source produces the same contentHash", () => {
    const first = buildManifest({ sourceDir: fixturesSourceDir, assetsOutDir, minApprovedItems: FIXTURE_MIN_ITEMS });
    const second = buildManifest({ sourceDir: fixturesSourceDir, assetsOutDir, minApprovedItems: FIXTURE_MIN_ITEMS });
    assert.equal(first.manifest.contentHash, second.manifest.contentHash);
    // generatedAt is deliberately wall-clock, not part of the determinism
    // contract — assert it's present and ISO-shaped, not that it's stable.
    assert.match(first.manifest.generatedAt, /^\d{4}-\d{2}-\d{2}T/);
  });

  test("public gazetteer is the full guess pool, not filtered down to answer cities", () => {
    // If the selector only ever offered the cities that happen to be
    // correct answers, the game would get easier every round by process
    // of elimination. unused-place-xx isn't the answer to anything in
    // the fixture set and must still appear as a guessable option.
    const { gazetteer } = buildManifest({ sourceDir: fixturesSourceDir, assetsOutDir, minApprovedItems: FIXTURE_MIN_ITEMS });
    const ids = gazetteer.map((g) => g.id).sort();
    assert.deepEqual(ids, ["oslo-no", "prague-cz", "unused-place-xx"]);
  });

  test("the production default requires REQUIRED_ROUNDS approved items, not just whatever exists", () => {
    // No minApprovedItems override here — this is the CLI's real default.
    assert.throws(() => buildManifest({ sourceDir: fixturesSourceDir, assetsOutDir }), /need at least 10/);
  });

  test("rejects a media path that escapes the originals directory", () => {
    const tmpSourceDir = fs.mkdtempSync(path.join(os.tmpdir(), "photolocation-invalid-source-"));
    const items = JSON.parse(fs.readFileSync(path.join(fixturesSourceDir, "items.json"), "utf8"));
    items[0] = { ...items[0], media: { ...items[0].media, originalPath: "../../../../../etc/passwd" } };
    fs.writeFileSync(path.join(tmpSourceDir, "items.json"), JSON.stringify(items));
    fs.copyFileSync(path.join(fixturesSourceDir, "gazetteer.json"), path.join(tmpSourceDir, "gazetteer.json"));

    assert.throws(
      () => buildManifest({ sourceDir: tmpSourceDir, originalsDir: fixturesOriginalsDir, assetsOutDir, minApprovedItems: FIXTURE_MIN_ITEMS }),
      /unsafe media path/
    );
    fs.rmSync(tmpSourceDir, { recursive: true, force: true });
  });

  test("fails the whole build on a duplicate content id", () => {
    const tmpSourceDir = fs.mkdtempSync(path.join(os.tmpdir(), "photolocation-invalid-source-"));
    const items = JSON.parse(fs.readFileSync(path.join(fixturesSourceDir, "items.json"), "utf8"));
    const duplicated = [...items, { ...items[0] }]; // reuse the same id on purpose
    fs.writeFileSync(path.join(tmpSourceDir, "items.json"), JSON.stringify(duplicated));
    fs.copyFileSync(path.join(fixturesSourceDir, "gazetteer.json"), path.join(tmpSourceDir, "gazetteer.json"));

    assert.throws(
      () => buildManifest({ sourceDir: tmpSourceDir, originalsDir: fixturesOriginalsDir, assetsOutDir, minApprovedItems: FIXTURE_MIN_ITEMS }),
      /content validation failed/
    );
    fs.rmSync(tmpSourceDir, { recursive: true, force: true });
  });

  test("fails the whole build when an item references an unresolved gazetteer id", () => {
    const tmpSourceDir = fs.mkdtempSync(path.join(os.tmpdir(), "photolocation-invalid-source-"));
    const items = JSON.parse(fs.readFileSync(path.join(fixturesSourceDir, "items.json"), "utf8"));
    items[0] = { ...items[0], location: { placeId: "nowhere-that-exists", acceptedPlaceIds: [] } };
    fs.writeFileSync(path.join(tmpSourceDir, "items.json"), JSON.stringify(items));
    fs.copyFileSync(path.join(fixturesSourceDir, "gazetteer.json"), path.join(tmpSourceDir, "gazetteer.json"));

    assert.throws(
      () => buildManifest({ sourceDir: tmpSourceDir, originalsDir: fixturesOriginalsDir, assetsOutDir, minApprovedItems: FIXTURE_MIN_ITEMS }),
      /content validation failed/
    );
    fs.rmSync(tmpSourceDir, { recursive: true, force: true });
  });

  test("fails the whole build when an approved item has no license", () => {
    const tmpSourceDir = fs.mkdtempSync(path.join(os.tmpdir(), "photolocation-invalid-source-"));
    const items = JSON.parse(fs.readFileSync(path.join(fixturesSourceDir, "items.json"), "utf8"));
    items[0] = { ...items[0], attribution: { ...items[0].attribution, license: "" } };
    fs.writeFileSync(path.join(tmpSourceDir, "items.json"), JSON.stringify(items));
    fs.copyFileSync(path.join(fixturesSourceDir, "gazetteer.json"), path.join(tmpSourceDir, "gazetteer.json"));

    assert.throws(
      () => buildManifest({ sourceDir: tmpSourceDir, originalsDir: fixturesOriginalsDir, assetsOutDir, minApprovedItems: FIXTURE_MIN_ITEMS }),
      /content validation failed/
    );
    fs.rmSync(tmpSourceDir, { recursive: true, force: true });
  });
});

/**
 * CLI-level tests for main()'s atomic staging/swap behavior (plan.md §13
 * "fail on ... inconsistent output"). These exercise the real
 * scripts/build-content.js entry point as a subprocess, with
 * --content-out/--assets-out redirected well away from the real public/
 * directory, and satisfy the production REQUIRED_ROUNDS minimum with a
 * full 10-item source generated from the two real fixture PNGs.
 */
describe("build-content.js CLI (atomic build)", () => {
  let workDir;
  let sourceDir;
  let originalsDir;
  let contentOutDir;
  let assetsOutDir;

  function writeTenItemSource({ swapSecondHalfImage } = {}) {
    const baseItems = JSON.parse(fs.readFileSync(path.join(fixturesSourceDir, "items.json"), "utf8")).filter((i) => i.status === "approved");
    const gazetteer = JSON.parse(fs.readFileSync(path.join(fixturesSourceDir, "gazetteer.json"), "utf8"));

    const items = [];
    for (let i = 0; i < 10; i++) {
      const base = baseItems[i % baseItems.length];
      const useSwappedImage = swapSecondHalfImage && i >= 5;
      items.push({
        ...base,
        id: `${base.id}-${i}`,
        media: { ...base.media, originalPath: useSwappedImage ? "third-image.png" : base.media.originalPath },
      });
    }

    fs.writeFileSync(path.join(sourceDir, "items.json"), JSON.stringify(items));
    fs.writeFileSync(path.join(sourceDir, "gazetteer.json"), JSON.stringify(gazetteer));
  }

  function runBuild() {
    return execFileSync(
      process.execPath,
      [buildScript, "--source", sourceDir, "--content-out", contentOutDir, "--assets-out", assetsOutDir],
      { encoding: "utf8" }
    );
  }

  before(() => {
    workDir = fs.mkdtempSync(path.join(os.tmpdir(), "photolocation-cli-test-"));
    sourceDir = path.join(workDir, "source");
    originalsDir = path.join(workDir, "originals");
    contentOutDir = path.join(workDir, "content-out");
    assetsOutDir = path.join(workDir, "assets-out");
    fs.mkdirSync(sourceDir, { recursive: true });
    fs.mkdirSync(originalsDir, { recursive: true });

    for (const name of fs.readdirSync(fixturesOriginalsDir)) {
      fs.copyFileSync(path.join(fixturesOriginalsDir, name), path.join(originalsDir, name));
    }
    // A third, genuinely distinct original (not a copy of an existing
    // fixture — same bytes would hash to the same opaque filename and
    // defeat the point) used to prove stale assets get removed on a
    // rebuild whose content no longer references them.
    fs.writeFileSync(path.join(originalsDir, "third-image.png"), makeTinyPng(200, 150, [10, 200, 90]));
  });

  after(() => {
    fs.rmSync(workDir, { recursive: true, force: true });
  });

  test("a successful build populates content-out and assets-out", () => {
    writeTenItemSource();
    const output = runBuild();
    assert.match(output, /Build OK: 10\/10 approved items published/);
    assert.ok(fs.existsSync(path.join(contentOutDir, "manifest.json")));
    assert.ok(fs.existsSync(path.join(contentOutDir, "gazetteer.json")));
    const assetFiles = fs.readdirSync(assetsOutDir);
    assert.equal(assetFiles.length, 2, "10 items over 2 distinct source images should produce exactly 2 assets");
  });

  test("no leftover staging directories after a successful build", () => {
    const parentEntries = fs.readdirSync(path.dirname(assetsOutDir));
    assert.ok(!parentEntries.some((name) => name.startsWith(".assets-build-")), "staging dir must be renamed away, not left behind");
  });

  test("a rebuild whose content changed removes assets that are no longer referenced", () => {
    const before = fs.readdirSync(assetsOutDir).sort();
    writeTenItemSource({ swapSecondHalfImage: true });
    runBuild();
    const after = fs.readdirSync(assetsOutDir).sort();
    assert.equal(after.length, 3, "now 3 distinct source images are referenced");
    assert.notDeepEqual(after, before, "asset set must reflect only the current content, old-and-new never accumulate");
  });

  test("a failing build leaves content-out and assets-out completely untouched", () => {
    const manifestBefore = fs.readFileSync(path.join(contentOutDir, "manifest.json"), "utf8");
    const assetsBefore = fs.readdirSync(assetsOutDir).sort();

    // Corrupt the source with a duplicate id — validation will fail
    // after the staging directory already has some assets copied into
    // it, which is exactly the scenario that used to leak partial state
    // into the real output.
    const items = JSON.parse(fs.readFileSync(path.join(sourceDir, "items.json"), "utf8"));
    items.push({ ...items[0] });
    fs.writeFileSync(path.join(sourceDir, "items.json"), JSON.stringify(items));

    assert.throws(() => runBuild());

    const manifestAfter = fs.readFileSync(path.join(contentOutDir, "manifest.json"), "utf8");
    const assetsAfter = fs.readdirSync(assetsOutDir).sort();
    assert.equal(manifestAfter, manifestBefore, "manifest.json must be byte-for-byte unchanged after a failed build");
    assert.deepEqual(assetsAfter, assetsBefore, "assets-out must be unchanged after a failed build");

    const parentEntries = fs.readdirSync(path.dirname(assetsOutDir));
    assert.ok(!parentEntries.some((name) => name.startsWith(".assets-build-")), "failed build's staging dir must be cleaned up, not left behind");
  });
});
