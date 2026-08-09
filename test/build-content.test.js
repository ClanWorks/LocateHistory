import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildManifest } from "../scripts/build-content.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesSourceDir = path.join(__dirname, "fixtures", "source");

describe("buildManifest (fixture content)", () => {
  let assetsOutDir;

  before(() => {
    assetsOutDir = fs.mkdtempSync(path.join(os.tmpdir(), "photolocation-build-test-"));
  });

  after(() => {
    fs.rmSync(assetsOutDir, { recursive: true, force: true });
  });

  test("publishes only approved items, in order", () => {
    const { manifest, approvedCount, totalCount } = buildManifest({ sourceDir: fixturesSourceDir, assetsOutDir });
    assert.equal(totalCount, 3, "fixture set has 3 source items");
    assert.equal(approvedCount, 2, "fixture set has 2 approved items");
    assert.equal(manifest.items.length, 2);
    assert.deepEqual(manifest.items.map((i) => i.id), ["prague-castle-1830", "oslo-harbour-1900"]);
  });

  test("excludes draft items from the manifest even with incomplete attribution", () => {
    const { manifest } = buildManifest({ sourceDir: fixturesSourceDir, assetsOutDir });
    assert.ok(!manifest.items.some((i) => i.id === "prague-unverified-license"));
  });

  test("real image dimensions are read from the PNG, not hardcoded", () => {
    const { manifest } = buildManifest({ sourceDir: fixturesSourceDir, assetsOutDir });
    const prague = manifest.items.find((i) => i.id === "prague-castle-1830");
    const oslo = manifest.items.find((i) => i.id === "oslo-harbour-1900");
    assert.deepEqual([prague.image.width, prague.image.height], [400, 300]);
    assert.deepEqual([oslo.image.width, oslo.image.height], [320, 240]);
  });

  test("asset filenames are opaque (checksum-derived), not the original filename", () => {
    const { manifest } = buildManifest({ sourceDir: fixturesSourceDir, assetsOutDir });
    for (const item of manifest.items) {
      const basename = path.basename(item.image.src);
      assert.doesNotMatch(basename, /prague|oslo|castle|harbour/i, "asset name must not leak the source filename");
      assert.match(basename, /^[0-9a-f]{16}\.png$/, "asset name must be a 16-char hex checksum + extension");
      assert.ok(fs.existsSync(path.join(assetsOutDir, basename)), "asset must actually be written to the output dir");
    }
  });

  test("is deterministic: rebuilding from the same source produces the same contentHash", () => {
    const first = buildManifest({ sourceDir: fixturesSourceDir, assetsOutDir });
    const second = buildManifest({ sourceDir: fixturesSourceDir, assetsOutDir });
    assert.equal(first.manifest.contentHash, second.manifest.contentHash);
  });

  test("gazetteer is filtered to only places actually used by approved items", () => {
    const { gazetteer } = buildManifest({ sourceDir: fixturesSourceDir, assetsOutDir });
    const ids = gazetteer.map((g) => g.id).sort();
    assert.deepEqual(ids, ["oslo-no", "prague-cz"], "unused-place-xx must not appear in the public gazetteer");
  });

  test("fails the whole build on a duplicate content id", () => {
    const tmpSourceDir = fs.mkdtempSync(path.join(os.tmpdir(), "photolocation-invalid-source-"));
    const items = JSON.parse(fs.readFileSync(path.join(fixturesSourceDir, "items.json"), "utf8"));
    const duplicated = [...items, { ...items[0] }]; // reuse the same id on purpose
    fs.writeFileSync(path.join(tmpSourceDir, "items.json"), JSON.stringify(duplicated));
    fs.copyFileSync(path.join(fixturesSourceDir, "gazetteer.json"), path.join(tmpSourceDir, "gazetteer.json"));

    assert.throws(
      () => buildManifest({ sourceDir: tmpSourceDir, originalsDir: path.join(fixturesSourceDir, "..", "originals"), assetsOutDir }),
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
      () => buildManifest({ sourceDir: tmpSourceDir, originalsDir: path.join(fixturesSourceDir, "..", "originals"), assetsOutDir }),
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
      () => buildManifest({ sourceDir: tmpSourceDir, originalsDir: path.join(fixturesSourceDir, "..", "originals"), assetsOutDir }),
      /content validation failed/
    );
    fs.rmSync(tmpSourceDir, { recursive: true, force: true });
  });
});
