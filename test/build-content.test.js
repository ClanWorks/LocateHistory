import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { buildManifest, cleanupStaleBuildArtifacts, BACKUP_PREFIX, STAGING_PREFIX } from "../scripts/build-content.js";
import { makeTinyPng } from "./helpers/make-tiny-png.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");
const fixturesSourceDir = path.join(__dirname, "fixtures", "source");
const fixturesOriginalsDir = path.join(__dirname, "fixtures", "originals");
const buildScript = path.join(repoRoot, "scripts", "build-content.js");

// Fixtures intentionally keep to a small, fast 2-approved-item set — well
// below production's REQUIRED_ROUNDS (10) minimum. Every call below opts
// into that explicitly via minApprovedItems, which is exactly the
// fixture/test-mode escape hatch: production (the CLI's default) never
// gets to skip the minimum, only tests that say so on purpose. Likewise
// the fixture PNGs (400x300, 320x240) are well below production's real
// MIN_DIMENSION_PX (480) — minDimensionPx opts into a lower bar for the
// same reason, so fixtures don't need to be regenerated at full size
// just to exercise the pipeline quickly.
const FIXTURE_MIN_ITEMS = 2;
const FIXTURE_MIN_DIMENSION = 100;
const FIXTURE_OPTS = { minApprovedItems: FIXTURE_MIN_ITEMS, minDimensionPx: FIXTURE_MIN_DIMENSION };

describe("buildManifest (fixture content)", () => {
  let assetsOutDir;

  before(() => {
    assetsOutDir = fs.mkdtempSync(path.join(os.tmpdir(), "photolocation-build-test-"));
  });

  after(() => {
    fs.rmSync(assetsOutDir, { recursive: true, force: true });
  });

  test("publishes only approved items, in order", async () => {
    const { manifest, approvedCount, totalCount } = await buildManifest({ sourceDir: fixturesSourceDir, assetsOutDir, ...FIXTURE_OPTS });
    assert.equal(totalCount, 3, "fixture set has 3 source items");
    assert.equal(approvedCount, 2, "fixture set has 2 approved items");
    assert.equal(manifest.items.length, 2);
    assert.deepEqual(manifest.items.map((i) => i.id), ["prague-castle-1830", "oslo-harbour-1900"]);
  });

  test("excludes draft items from the manifest even with incomplete attribution", async () => {
    const { manifest } = await buildManifest({ sourceDir: fixturesSourceDir, assetsOutDir, ...FIXTURE_OPTS });
    assert.ok(!manifest.items.some((i) => i.id === "prague-unverified-license"));
  });

  test("real image dimensions are read from the source, not hardcoded", async () => {
    const { manifest } = await buildManifest({ sourceDir: fixturesSourceDir, assetsOutDir, ...FIXTURE_OPTS });
    const prague = manifest.items.find((i) => i.id === "prague-castle-1830");
    const oslo = manifest.items.find((i) => i.id === "oslo-harbour-1900");
    // Both fixtures are narrower than the smallest responsive target
    // (480px), so each produces exactly one variant at its native size —
    // never upscaled.
    assert.deepEqual([prague.image.width, prague.image.height], [400, 300]);
    assert.deepEqual([oslo.image.width, oslo.image.height], [320, 240]);
  });

  test("asset filenames are opaque (checksum-derived), not the original filename", async () => {
    const { manifest } = await buildManifest({ sourceDir: fixturesSourceDir, assetsOutDir, ...FIXTURE_OPTS });
    for (const item of manifest.items) {
      const basename = path.basename(item.image.src);
      assert.doesNotMatch(basename, /prague|oslo|castle|harbour/i, "asset name must not leak the source filename");
      assert.match(basename, /^[0-9a-f]{16}-\d+w\.jpg$/, "asset name must be a 16-char hex checksum + width suffix + extension");
      assert.ok(fs.existsSync(path.join(assetsOutDir, basename)), "asset must actually be written to the output dir");
    }
  });

  test("is deterministic: rebuilding from the same source produces the same contentHash", async () => {
    const first = await buildManifest({ sourceDir: fixturesSourceDir, assetsOutDir, ...FIXTURE_OPTS });
    const second = await buildManifest({ sourceDir: fixturesSourceDir, assetsOutDir, ...FIXTURE_OPTS });
    assert.equal(first.manifest.contentHash, second.manifest.contentHash);
    // generatedAt is deliberately wall-clock, not part of the determinism
    // contract — assert it's present and ISO-shaped, not that it's stable.
    assert.match(first.manifest.generatedAt, /^\d{4}-\d{2}-\d{2}T/);
  });

  test("public gazetteer is the full guess pool, not filtered down to answer cities", async () => {
    // If the selector only ever offered the cities that happen to be
    // correct answers, the game would get easier every round by process
    // of elimination. unused-place-xx isn't the answer to anything in
    // the fixture set and must still appear as a guessable option.
    const { gazetteer } = await buildManifest({ sourceDir: fixturesSourceDir, assetsOutDir, ...FIXTURE_OPTS });
    const ids = gazetteer.map((g) => g.id).sort();
    assert.deepEqual(ids, ["oslo-no", "prague-cz", "unused-place-xx"]);
  });

  test("contentHash changes when only the gazetteer changes, not just the items", async () => {
    // A curator correcting a city's coordinates changes scoring outcomes
    // even though no item record was touched. If contentHash only hashed
    // manifestItems, that correction would silently claim "nothing
    // changed" to anything comparing hashes to detect a rebuild.
    const before = await buildManifest({ sourceDir: fixturesSourceDir, assetsOutDir, ...FIXTURE_OPTS });

    const tmpSourceDir = fs.mkdtempSync(path.join(os.tmpdir(), "photolocation-gazetteer-change-"));
    fs.copyFileSync(path.join(fixturesSourceDir, "items.json"), path.join(tmpSourceDir, "items.json"));
    const gazetteer = JSON.parse(fs.readFileSync(path.join(fixturesSourceDir, "gazetteer.json"), "utf8"));
    gazetteer[0] = { ...gazetteer[0], lat: gazetteer[0].lat + 1 };
    fs.writeFileSync(path.join(tmpSourceDir, "gazetteer.json"), JSON.stringify(gazetteer));

    const after = await buildManifest({ sourceDir: tmpSourceDir, originalsDir: fixturesOriginalsDir, assetsOutDir, ...FIXTURE_OPTS });
    assert.notEqual(after.manifest.contentHash, before.manifest.contentHash);
    fs.rmSync(tmpSourceDir, { recursive: true, force: true });
  });

  test("rejects a duplicate gazetteer id instead of silently collapsing it", async () => {
    const tmpSourceDir = fs.mkdtempSync(path.join(os.tmpdir(), "photolocation-invalid-source-"));
    fs.copyFileSync(path.join(fixturesSourceDir, "items.json"), path.join(tmpSourceDir, "items.json"));
    const gazetteer = JSON.parse(fs.readFileSync(path.join(fixturesSourceDir, "gazetteer.json"), "utf8"));
    gazetteer.push({ ...gazetteer[0] }); // reuse the same id on purpose
    fs.writeFileSync(path.join(tmpSourceDir, "gazetteer.json"), JSON.stringify(gazetteer));

    await assert.rejects(
      () => buildManifest({ sourceDir: tmpSourceDir, originalsDir: fixturesOriginalsDir, assetsOutDir, ...FIXTURE_OPTS }),
      /content validation failed/
    );
    fs.rmSync(tmpSourceDir, { recursive: true, force: true });
  });

  test("the production default requires REQUIRED_ROUNDS approved items, not just whatever exists", async () => {
    // No minApprovedItems override here — this is the CLI's real default.
    await assert.rejects(() => buildManifest({ sourceDir: fixturesSourceDir, assetsOutDir, minDimensionPx: FIXTURE_MIN_DIMENSION }), /need at least 10/);
  });

  test("rejects an image below the minimum dimension", async () => {
    // No minDimensionPx override — production's real 480px minimum
    // applies, and both fixtures (400x300, 320x240) fall under it.
    await assert.rejects(
      () => buildManifest({ sourceDir: fixturesSourceDir, assetsOutDir, minApprovedItems: FIXTURE_MIN_ITEMS }),
      /below the 480px minimum/
    );
  });

  test("rejects a media path that escapes the originals directory", async () => {
    const tmpSourceDir = fs.mkdtempSync(path.join(os.tmpdir(), "photolocation-invalid-source-"));
    const items = JSON.parse(fs.readFileSync(path.join(fixturesSourceDir, "items.json"), "utf8"));
    items[0] = { ...items[0], media: { ...items[0].media, originalPath: "../../../../../etc/passwd" } };
    fs.writeFileSync(path.join(tmpSourceDir, "items.json"), JSON.stringify(items));
    fs.copyFileSync(path.join(fixturesSourceDir, "gazetteer.json"), path.join(tmpSourceDir, "gazetteer.json"));

    await assert.rejects(
      () => buildManifest({ sourceDir: tmpSourceDir, originalsDir: fixturesOriginalsDir, assetsOutDir, ...FIXTURE_OPTS }),
      /unsafe media path/
    );
    fs.rmSync(tmpSourceDir, { recursive: true, force: true });
  });

  test("fails the whole build on a duplicate content id", async () => {
    const tmpSourceDir = fs.mkdtempSync(path.join(os.tmpdir(), "photolocation-invalid-source-"));
    const items = JSON.parse(fs.readFileSync(path.join(fixturesSourceDir, "items.json"), "utf8"));
    const duplicated = [...items, { ...items[0] }]; // reuse the same id on purpose
    fs.writeFileSync(path.join(tmpSourceDir, "items.json"), JSON.stringify(duplicated));
    fs.copyFileSync(path.join(fixturesSourceDir, "gazetteer.json"), path.join(tmpSourceDir, "gazetteer.json"));

    await assert.rejects(
      () => buildManifest({ sourceDir: tmpSourceDir, originalsDir: fixturesOriginalsDir, assetsOutDir, ...FIXTURE_OPTS }),
      /content validation failed/
    );
    fs.rmSync(tmpSourceDir, { recursive: true, force: true });
  });

  test("fails the whole build when an item references an unresolved gazetteer id", async () => {
    const tmpSourceDir = fs.mkdtempSync(path.join(os.tmpdir(), "photolocation-invalid-source-"));
    const items = JSON.parse(fs.readFileSync(path.join(fixturesSourceDir, "items.json"), "utf8"));
    items[0] = { ...items[0], location: { placeId: "nowhere-that-exists", acceptedPlaceIds: [] } };
    fs.writeFileSync(path.join(tmpSourceDir, "items.json"), JSON.stringify(items));
    fs.copyFileSync(path.join(fixturesSourceDir, "gazetteer.json"), path.join(tmpSourceDir, "gazetteer.json"));

    await assert.rejects(
      () => buildManifest({ sourceDir: tmpSourceDir, originalsDir: fixturesOriginalsDir, assetsOutDir, ...FIXTURE_OPTS }),
      /content validation failed/
    );
    fs.rmSync(tmpSourceDir, { recursive: true, force: true });
  });

  test("fails the whole build when an approved item has no license", async () => {
    const tmpSourceDir = fs.mkdtempSync(path.join(os.tmpdir(), "photolocation-invalid-source-"));
    const items = JSON.parse(fs.readFileSync(path.join(fixturesSourceDir, "items.json"), "utf8"));
    items[0] = { ...items[0], attribution: { ...items[0].attribution, license: "" } };
    fs.writeFileSync(path.join(tmpSourceDir, "items.json"), JSON.stringify(items));
    fs.copyFileSync(path.join(fixturesSourceDir, "gazetteer.json"), path.join(tmpSourceDir, "gazetteer.json"));

    await assert.rejects(
      () => buildManifest({ sourceDir: tmpSourceDir, originalsDir: fixturesOriginalsDir, assetsOutDir, ...FIXTURE_OPTS }),
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
 * --min-dimension is passed to accommodate the tiny fixture images.
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
      [buildScript, "--source", sourceDir, "--content-out", contentOutDir, "--assets-out", assetsOutDir, "--min-dimension", String(FIXTURE_MIN_DIMENSION)],
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
    // This second build is the one that actually exercises the backup
    // step in main() — the first build had no existing assetsOutDir to
    // back up, so this is where "rename old aside, swap in new, delete
    // the backup" runs for real.
    const before = fs.readdirSync(assetsOutDir).sort();
    writeTenItemSource({ swapSecondHalfImage: true });
    runBuild();
    const after = fs.readdirSync(assetsOutDir).sort();
    assert.equal(after.length, 3, "now 3 distinct source images are referenced");
    assert.notDeepEqual(after, before, "asset set must reflect only the current content, old-and-new never accumulate");

    const parentEntries = fs.readdirSync(path.dirname(assetsOutDir));
    assert.ok(!parentEntries.some((name) => name.startsWith(".assets-backup-")), "backup dir must be cleaned up after a successful swap, not left behind");
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

/**
 * Unit tests for cleanupStaleBuildArtifacts in isolation, covering the
 * scenario a real end-to-end CLI test can't easily reach: a process that
 * was interrupted between "rename final assets aside as backup" and
 * "rename staging into final", leaving finalAssetsDir missing and the
 * backup as the only good copy. The original version of this function
 * deleted every backup dir unconditionally on startup, which would have
 * destroyed that copy.
 */
describe("cleanupStaleBuildArtifacts", () => {
  let parentDir;
  let finalAssetsDir;

  before(() => {
    parentDir = fs.mkdtempSync(path.join(os.tmpdir(), "photolocation-cleanup-test-"));
    finalAssetsDir = path.join(parentDir, "assets");
  });

  after(() => {
    fs.rmSync(parentDir, { recursive: true, force: true });
  });

  function makeBackupDir(name, fileContent) {
    const dir = path.join(parentDir, name);
    fs.mkdirSync(dir);
    fs.writeFileSync(path.join(dir, "some-asset.jpg"), fileContent);
    return dir;
  }

  test("restores the backup when finalAssetsDir is missing (interrupted swap)", () => {
    fs.rmSync(finalAssetsDir, { recursive: true, force: true });
    makeBackupDir(`${BACKUP_PREFIX}only-one`, "the-only-good-copy");

    cleanupStaleBuildArtifacts(parentDir, finalAssetsDir);

    assert.ok(fs.existsSync(finalAssetsDir), "finalAssetsDir must be restored from the backup, not left missing");
    assert.equal(fs.readFileSync(path.join(finalAssetsDir, "some-asset.jpg"), "utf8"), "the-only-good-copy");
    assert.ok(!fs.existsSync(path.join(parentDir, `${BACKUP_PREFIX}only-one`)), "the backup dir must be gone once restored (renamed, not copied)");
  });

  test("does not touch finalAssetsDir when it already exists — backups are just cleaned up", () => {
    fs.rmSync(finalAssetsDir, { recursive: true, force: true });
    fs.mkdirSync(finalAssetsDir);
    fs.writeFileSync(path.join(finalAssetsDir, "current-asset.jpg"), "the-current-good-build");
    makeBackupDir(`${BACKUP_PREFIX}orphaned`, "stale-orphaned-backup");

    cleanupStaleBuildArtifacts(parentDir, finalAssetsDir);

    assert.equal(fs.readFileSync(path.join(finalAssetsDir, "current-asset.jpg"), "utf8"), "the-current-good-build", "existing final assets must be untouched");
    assert.ok(!fs.existsSync(path.join(parentDir, `${BACKUP_PREFIX}orphaned`)), "orphaned backup must be cleaned up");
  });

  test("with multiple stale backups and no final dir, restores only the most recently modified one", async () => {
    fs.rmSync(finalAssetsDir, { recursive: true, force: true });
    makeBackupDir(`${BACKUP_PREFIX}older`, "older-backup");
    await new Promise((resolve) => setTimeout(resolve, 10)); // ensure a distinct mtime
    makeBackupDir(`${BACKUP_PREFIX}newer`, "newer-backup");

    cleanupStaleBuildArtifacts(parentDir, finalAssetsDir);

    assert.equal(fs.readFileSync(path.join(finalAssetsDir, "some-asset.jpg"), "utf8"), "newer-backup", "the most recently modified backup must be the one restored");
    assert.ok(!fs.existsSync(path.join(parentDir, `${BACKUP_PREFIX}older`)), "the older, unused backup must still be cleaned up");
  });

  test("always removes staging dirs regardless of backup/final state", () => {
    fs.rmSync(finalAssetsDir, { recursive: true, force: true });
    fs.mkdirSync(finalAssetsDir);
    const stagingDir = path.join(parentDir, `${STAGING_PREFIX}leftover`);
    fs.mkdirSync(stagingDir);

    cleanupStaleBuildArtifacts(parentDir, finalAssetsDir);

    assert.ok(!fs.existsSync(stagingDir), "leftover staging dirs are never validated as complete and must always be discarded");
  });
});
