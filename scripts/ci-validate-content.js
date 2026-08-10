#!/usr/bin/env node
// Content validation for CI (plan.md §17: "the content build runs in
// continuous integration before deployment").
//
// This deliberately does NOT run the full image-processing build
// (scripts/build-content.js's normal path) in CI: that needs the real
// originals in content/originals/, which are gitignored on purpose
// (plan.md §8 — raw historical scans don't belong permanently in git
// history) and therefore aren't present in a CI checkout any more than
// they are in a fresh local clone (see README's "Content curation"
// section). Re-fetching them from Wikimedia on every CI run would be
// slow and exposed to the same rate-limiting hit during M2's curation
// work (scripts/migrate-download-originals.js's retry/backoff exists
// specifically because of that).
//
// What this checks instead, without needing the originals:
//
//   1. content/source/items.json and gazetteer.json are internally
//      valid (schema + cross-references) and have enough approved
//      items for a full session.
//   2. public/content/manifest.json actually matches that source — not
//      just "is itself well-formed", which the M4 review pointed out
//      was the actual gap: a source edit without a rebuild, or a
//      rebuilt-but-uncommitted public/, would previously pass every
//      existing check (source validation looks only at content/source/;
//      the E2E suite plays whatever public/ currently contains and has
//      no way to know it's stale; a single randomized 10-of-20-item
//      session might not even happen to touch the missing/wrong item).
//      So: every approved source item's non-image fields must exactly
//      match its published manifest entry, the published gazetteer must
//      exactly match the source gazetteer, every asset path the
//      manifest references must actually exist under public/assets/,
//      and manifest.contentHash must match a fresh recompute from the
//      manifest's own published items+gazetteer (catches hand-edited or
//      corrupted output even though CI can't independently re-derive
//      the image data that hash also depends on).
//
// The real sharp-based image pipeline (EXIF stripping, opaque naming,
// responsive variants) still runs in CI — just via `npm test`'s
// fixture-based build tests, not against the real curated originals.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { validateSourceCollection, validateManifest } from "./lib/validate.js";
import { toManifestItemNonImageFields } from "./lib/manifest-mapping.js";
import { deepEqual } from "./lib/deep-equal.js";
import { REQUIRED_ROUNDS } from "../public/js/state-machine.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");

/**
 * @param {object} options
 * @param {string} options.sourceDir
 * @param {string} options.contentOutDir directory containing manifest.json/gazetteer.json
 * @param {string} options.assetsDir directory the manifest's image paths resolve against (its parent)
 * @param {number} [options.minApprovedItems]
 * @returns {string[]} failure messages; empty means everything checked out
 */
export function validatePublishedContent({ sourceDir, contentOutDir, assetsDir, minApprovedItems = REQUIRED_ROUNDS }) {
  const failures = [];

  const items = JSON.parse(fs.readFileSync(path.join(sourceDir, "items.json"), "utf8"));
  const gazetteer = JSON.parse(fs.readFileSync(path.join(sourceDir, "gazetteer.json"), "utf8"));

  const sourceFailures = validateSourceCollection(items, gazetteer);
  if (sourceFailures.length) {
    for (const failure of sourceFailures) {
      for (const err of failure.errors) failures.push(`source: ${failure.id}: ${err.path}: ${err.message}`);
    }
    return failures; // no point checking public/ against source that's already known-broken
  }

  const approved = items.filter((i) => i.status === "approved");
  if (approved.length < minApprovedItems) {
    failures.push(`source: only ${approved.length} approved item(s), need at least ${minApprovedItems}`);
  }

  const manifestPath = path.join(contentOutDir, "manifest.json");
  const gazetteerPath = path.join(contentOutDir, "gazetteer.json");
  if (!fs.existsSync(manifestPath) || !fs.existsSync(gazetteerPath)) {
    failures.push(`public: ${contentOutDir} is missing manifest.json/gazetteer.json — run npm run build:content`);
    return failures;
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const publishedGazetteer = JSON.parse(fs.readFileSync(gazetteerPath, "utf8"));

  for (const err of validateManifest(manifest)) {
    failures.push(`public manifest schema: ${err.path}: ${err.message}`);
  }

  if (!deepEqual(publishedGazetteer, gazetteer)) {
    failures.push("public: gazetteer.json does not match content/source/gazetteer.json — run npm run build:content");
  }

  if (manifest.items.length !== approved.length) {
    failures.push(
      `public: manifest has ${manifest.items.length} item(s) but source has ${approved.length} approved — run npm run build:content`
    );
  }

  const manifestById = new Map(manifest.items.map((i) => [i.id, i]));
  for (const item of approved) {
    const published = manifestById.get(item.id);
    if (!published) {
      failures.push(`public: approved source item "${item.id}" is missing from the published manifest — run npm run build:content`);
      continue;
    }

    const expected = toManifestItemNonImageFields(item);
    const { image, ...publishedNonImage } = published;
    if (!deepEqual(publishedNonImage, expected)) {
      failures.push(`public: manifest item "${item.id}" doesn't match content/source/items.json — run npm run build:content`);
    }

    if (!image) {
      failures.push(`public: manifest item "${item.id}" has no image field`);
      continue;
    }
    const assetPaths = new Set([image.src, ...(image.srcset ?? "").split(",").map((entry) => entry.trim().split(" ")[0])].filter(Boolean));
    for (const assetPath of assetPaths) {
      // assetPath is manifest-relative, like "assets/<hash>-480w.jpg" —
      // resolve the filename directly against the real assetsDir given,
      // not by guessing a sibling directory literally named "assets"
      // from assetsDir's own path (assetsDir might not be named that,
      // e.g. in tests).
      const filename = assetPath.startsWith("assets/") ? assetPath.slice("assets/".length) : assetPath;
      const absolute = path.join(assetsDir, filename);
      if (!fs.existsSync(absolute)) {
        failures.push(`public: manifest item "${item.id}" references a missing asset: ${assetPath}`);
      }
    }
  }

  // manifest.contentHash must match a fresh recompute from the manifest's
  // OWN published items+gazetteer — exactly build-content.js's recipe
  // (see there for why generatedAt is excluded). This doesn't prove the
  // image bytes were correctly derived from real originals (CI can't
  // redo that without them), but it does catch a hand-edited or
  // otherwise corrupted manifest.json, and needs no image reprocessing
  // since it only re-hashes data already present in the published files.
  const manifestBody = { manifestVersion: 1, items: manifest.items, gazetteer: publishedGazetteer };
  const recomputedHash = crypto.createHash("sha256").update(JSON.stringify(manifestBody)).digest("hex").slice(0, 16);
  if (recomputedHash !== manifest.contentHash) {
    failures.push(`public: manifest.contentHash (${manifest.contentHash}) doesn't match a fresh recompute (${recomputedHash}) — manifest.json may have been hand-edited`);
  }

  return failures;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  const sourceDir = path.join(repoRoot, "content", "source");
  const contentOutDir = path.join(repoRoot, "public", "content");
  const assetsDir = path.join(repoRoot, "public", "assets");

  const failures = validatePublishedContent({ sourceDir, contentOutDir, assetsDir });
  if (failures.length) {
    console.error(`Content validation failed (${failures.length}):\n`);
    for (const f of failures) console.error(`  ✘ ${f}`);
    process.exit(1);
  }

  const items = JSON.parse(fs.readFileSync(path.join(sourceDir, "items.json"), "utf8"));
  const gazetteer = JSON.parse(fs.readFileSync(path.join(sourceDir, "gazetteer.json"), "utf8"));
  const approved = items.filter((i) => i.status === "approved");
  console.log(
    `Content OK: ${items.length} source item(s), ${approved.length} approved, ${gazetteer.length} gazetteer entries, public/ matches source.`
  );
}
