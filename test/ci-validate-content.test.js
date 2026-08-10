import { test, describe, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildManifest } from "../scripts/build-content.js";
import { validatePublishedContent } from "../scripts/ci-validate-content.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesSourceDir = path.join(__dirname, "fixtures", "source");
const fixturesOriginalsDir = path.join(__dirname, "fixtures", "originals");
const FIXTURE_OPTS = { minApprovedItems: 2, minDimensionPx: 100 };

/**
 * These tests exist specifically to prove the M4 review's gap is
 * closed: a source edit without a rebuild, or a rebuilt-but-uncommitted
 * public/, used to pass every existing check (source validation only
 * looked at content/source/; the E2E suite only ever played whatever
 * public/ already contained). Each "stale" test below deliberately
 * recreates that exact scenario and asserts it's now caught.
 */
describe("validatePublishedContent", () => {
  let workDir, sourceDir, contentOutDir, assetsDir;

  beforeEach(() => {
    // Fresh, genuinely-in-sync source + published output for every
    // test, built the same way the real CLI does.
    workDir = fs.mkdtempSync(path.join(os.tmpdir(), "photolocation-ci-validate-"));
    sourceDir = path.join(workDir, "source");
    contentOutDir = path.join(workDir, "content-out");
    assetsDir = path.join(workDir, "assets-out");
    fs.mkdirSync(sourceDir, { recursive: true });

    fs.cpSync(path.join(fixturesSourceDir, "items.json"), path.join(sourceDir, "items.json"));
    fs.cpSync(path.join(fixturesSourceDir, "gazetteer.json"), path.join(sourceDir, "gazetteer.json"));
  });

  after(() => {
    // beforeEach recreates workDir per test; nothing persists to clean
    // up here beyond what each test already removes, but guard anyway.
  });

  async function buildFixturePublic() {
    const result = await buildManifest({ sourceDir, originalsDir: fixturesOriginalsDir, assetsOutDir: assetsDir, ...FIXTURE_OPTS });
    fs.mkdirSync(contentOutDir, { recursive: true });
    fs.writeFileSync(path.join(contentOutDir, "manifest.json"), JSON.stringify(result.manifest, null, 2));
    fs.writeFileSync(path.join(contentOutDir, "gazetteer.json"), JSON.stringify(result.gazetteer, null, 2));
    return result;
  }

  test("passes when public/ genuinely matches source", async () => {
    await buildFixturePublic();
    const failures = validatePublishedContent({ sourceDir, contentOutDir, assetsDir, minApprovedItems: 2 });
    assert.deepEqual(failures, []);
  });

  test("catches a source edit that was never rebuilt (the exact gap this was written for)", async () => {
    await buildFixturePublic();

    // Edit source AFTER building — public/ is now stale, exactly the
    // "valid source edit without rebuilding public/" scenario.
    const items = JSON.parse(fs.readFileSync(path.join(sourceDir, "items.json"), "utf8"));
    items[0] = { ...items[0], title: "A completely different title nobody rebuilt for" };
    fs.writeFileSync(path.join(sourceDir, "items.json"), JSON.stringify(items));

    const failures = validatePublishedContent({ sourceDir, contentOutDir, assetsDir, minApprovedItems: 2 });
    assert.ok(
      failures.some((f) => f.includes("doesn't match content/source/items.json")),
      `expected a stale-content failure, got: ${JSON.stringify(failures)}`
    );
  });

  test("catches a stale published gazetteer", async () => {
    await buildFixturePublic();
    const gazetteer = JSON.parse(fs.readFileSync(path.join(sourceDir, "gazetteer.json"), "utf8"));
    gazetteer[0] = { ...gazetteer[0], lat: gazetteer[0].lat + 5 };
    fs.writeFileSync(path.join(sourceDir, "gazetteer.json"), JSON.stringify(gazetteer));

    const failures = validatePublishedContent({ sourceDir, contentOutDir, assetsDir, minApprovedItems: 2 });
    assert.ok(failures.some((f) => f.includes("gazetteer.json does not match")));
  });

  test("catches a missing published build entirely", () => {
    // Don't build anything — content-out doesn't exist at all.
    const failures = validatePublishedContent({ sourceDir, contentOutDir, assetsDir, minApprovedItems: 2 });
    assert.ok(failures.some((f) => f.includes("missing manifest.json")));
  });

  test("catches a manifest referencing an asset that doesn't actually exist on disk", async () => {
    await buildFixturePublic();
    const manifestPath = path.join(contentOutDir, "manifest.json");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    manifest.items[0].image.src = "assets/this-file-was-never-written.jpg";
    fs.writeFileSync(manifestPath, JSON.stringify(manifest));

    const failures = validatePublishedContent({ sourceDir, contentOutDir, assetsDir, minApprovedItems: 2 });
    assert.ok(failures.some((f) => f.includes("missing asset")));
  });

  test("catches a hand-edited manifest via the contentHash check", async () => {
    await buildFixturePublic();
    const manifestPath = path.join(contentOutDir, "manifest.json");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    // Tamper with something the hash covers but this test doesn't
    // otherwise check, without touching contentHash itself — a
    // real hand-edit wouldn't know to recompute it either.
    manifest.items[0].title = "hand-edited directly in the published file";
    fs.writeFileSync(manifestPath, JSON.stringify(manifest));

    const failures = validatePublishedContent({ sourceDir, contentOutDir, assetsDir, minApprovedItems: 2 });
    assert.ok(failures.some((f) => f.includes("doesn't match a fresh recompute")));
  });

  test("catches too few approved items for a full session", async () => {
    await buildFixturePublic();
    // The fixture set only has 2 approved items; the production
    // minimum (REQUIRED_ROUNDS, unset here) must reject that.
    const failures = validatePublishedContent({ sourceDir, contentOutDir, assetsDir });
    assert.ok(failures.some((f) => f.includes("need at least")));
  });

  test("stops at source-level failures before even checking public/", async () => {
    const items = JSON.parse(fs.readFileSync(path.join(sourceDir, "items.json"), "utf8"));
    items.push({ ...items[0] }); // duplicate id
    fs.writeFileSync(path.join(sourceDir, "items.json"), JSON.stringify(items));

    const failures = validatePublishedContent({ sourceDir, contentOutDir, assetsDir, minApprovedItems: 2 });
    assert.ok(failures.some((f) => f.startsWith("source:")));
    assert.ok(!failures.some((f) => f.startsWith("public:")), "should not report public/ issues when source itself is invalid");
  });
});
