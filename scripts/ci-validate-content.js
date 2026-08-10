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
// What CI *can* and does check without the originals: that the actual
// curator source (content/source/items.json, gazetteer.json) is
// internally valid — the same schema and cross-reference checks
// scripts/build-content.js runs before it ever touches an image. This
// catches the class of regression that matters most for CI (someone
// edits items.json or gazetteer.json and introduces a duplicate id, an
// unresolved place reference, a missing license on an approved item,
// etc.) without needing image assets at all. The full pipeline
// (including real image processing via sharp) already runs in CI a
// different way: test/build-content.test.js and test/media.test.js
// exercise the actual build-content.js/media.js code against small
// synthetic fixture images checked into test/fixtures/, which `npm
// test` already runs on every CI invocation.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateSourceCollection } from "./lib/validate.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sourceDir = path.join(__dirname, "..", "content", "source");

const items = JSON.parse(fs.readFileSync(path.join(sourceDir, "items.json"), "utf8"));
const gazetteer = JSON.parse(fs.readFileSync(path.join(sourceDir, "gazetteer.json"), "utf8"));

const failures = validateSourceCollection(items, gazetteer);
if (failures.length) {
  console.error(`Content validation failed for ${failures.length} record(s):\n`);
  for (const failure of failures) {
    console.error(`  ${failure.id}:`);
    for (const err of failure.errors) console.error(`    ${err.path}: ${err.message}`);
  }
  process.exit(1);
}

const approved = items.filter((i) => i.status === "approved");
console.log(`Content OK: ${items.length} source item(s), ${approved.length} approved, ${gazetteer.length} gazetteer entries.`);
