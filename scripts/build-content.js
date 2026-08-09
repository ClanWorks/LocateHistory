#!/usr/bin/env node
// Deterministic content build. Replaces the interactive Firestore CLI
// (config/addCityCLI.cjs) with a validated, reviewable pipeline.
// See plan.md §8 and §13.
//
// M1 scope: schema + cross-reference validation, deterministic manifest
// and gazetteer generation, opaque asset naming derived from file bytes.
// Full media processing (EXIF stripping, responsive srcset generation,
// minimum-dimension enforcement) is M2 — see scripts/lib/media.js once
// it exists. For now, approved items' original assets are copied through
// unchanged under an opaque, checksum-derived name.
//
// Usage: node scripts/build-content.js [--source <dir>]
// The build fails loudly rather than publishing partial or invalid data.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { validateSourceCollection, validateManifest } from "./lib/validate.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");

function parseArgs(argv) {
  const args = { sourceDir: path.join(repoRoot, "content", "source") };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--source" && argv[i + 1]) {
      args.sourceDir = path.resolve(argv[i + 1]);
      i++;
    }
  }
  return args;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function deriveEra(minYear) {
  const decade = Math.floor(minYear / 10) * 10;
  return `${decade}s`;
}

/**
 * Reads width/height straight out of a PNG's IHDR chunk. A deliberately
 * minimal stand-in for real image decoding — enough to satisfy the
 * manifest schema's width/height >= 1 requirement without pulling in an
 * image library before M2 needs one for real resizing/EXIF work.
 */
function readPngDimensions(bytes) {
  const isPng = bytes.length > 24 && bytes.readUInt32BE(0) === 0x89504e47;
  if (!isPng) {
    throw new Error("M1's build stub only supports PNG originals; M2's real media pipeline replaces this with a proper image decoder for JPEG/etc.");
  }
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

/**
 * M1 stand-in for the real M2 media pipeline: computes an opaque,
 * checksum-derived asset name from the original file's bytes and copies
 * it into public/assets unchanged. Does not strip metadata, resize, or
 * generate a srcset — that is explicitly deferred to M2 (plan.md §13
 * steps 6-9).
 */
function processMediaPlaceholder(item, { originalsDir, assetsOutDir }) {
  const originalPath = path.join(originalsDir, item.media.originalPath);
  if (!fs.existsSync(originalPath)) {
    throw new Error(`missing original asset for "${item.id}": ${originalPath}`);
  }
  const bytes = fs.readFileSync(originalPath);
  const checksum = crypto.createHash("sha256").update(bytes).digest("hex").slice(0, 16);
  const ext = path.extname(item.media.originalPath).toLowerCase();
  const assetName = `${checksum}${ext}`;
  const { width, height } = readPngDimensions(bytes);

  fs.mkdirSync(assetsOutDir, { recursive: true });
  fs.writeFileSync(path.join(assetsOutDir, assetName), bytes);

  return { src: `assets/${assetName}`, srcset: `assets/${assetName} 1x`, placeholder: null, width, height };
}

function buildManifest({ sourceDir, originalsDir, assetsOutDir }) {
  const items = readJson(path.join(sourceDir, "items.json"));
  const gazetteer = readJson(path.join(sourceDir, "gazetteer.json"));

  const failures = validateSourceCollection(items, gazetteer);
  if (failures.length) {
    console.error(`Content validation failed for ${failures.length} record(s):\n`);
    for (const failure of failures) {
      console.error(`  ${failure.id}:`);
      for (const err of failure.errors) console.error(`    ${err.path}: ${err.message}`);
    }
    throw new Error("content validation failed — build aborted");
  }

  const approved = items.filter((item) => item.status === "approved");
  const resolvedOriginalsDir = originalsDir ?? path.join(sourceDir, "..", "originals");
  const resolvedAssetsOutDir = assetsOutDir ?? path.join(repoRoot, "public", "assets");

  const manifestItems = approved.map((item) => {
    const image = processMediaPlaceholder(item, { originalsDir: resolvedOriginalsDir, assetsOutDir: resolvedAssetsOutDir });
    return {
      id: item.id,
      workType: item.workType,
      image: {
        src: image.src,
        srcset: image.srcset,
        width: image.width,
        height: image.height,
        placeholder: image.placeholder,
      },
      location: item.location,
      depictedDate: item.depictedDate,
      creationDate: item.creationDate,
      classification: {
        region: item.classification.region,
        difficulty: item.classification.difficulty,
        tags: item.classification.tags,
      },
      clues: item.clues,
      title: item.title,
      artistOrCreator: item.artistOrCreator,
      context: item.context,
      attribution: item.attribution,
    };
  });

  const usedPlaceIds = new Set();
  for (const item of approved) {
    usedPlaceIds.add(item.location.placeId);
    for (const id of item.location.acceptedPlaceIds) usedPlaceIds.add(id);
  }
  const publicGazetteer = gazetteer.filter((entry) => usedPlaceIds.has(entry.id));

  const manifestBody = { manifestVersion: 1, items: manifestItems };
  const contentHash = crypto.createHash("sha256").update(JSON.stringify(manifestBody)).digest("hex").slice(0, 16);
  const manifest = { manifestVersion: 1, generatedAt: new Date().toISOString(), contentHash, items: manifestItems };

  const manifestErrors = validateManifest(manifest);
  if (manifestErrors.length) {
    console.error("Generated manifest failed its own schema — this is a build script bug, not a content problem:");
    for (const err of manifestErrors) console.error(`  ${err.path}: ${err.message}`);
    throw new Error("generated manifest is invalid — build aborted");
  }

  return { manifest, gazetteer: publicGazetteer, approvedCount: approved.length, totalCount: items.length };
}

function main() {
  const { sourceDir } = parseArgs(process.argv.slice(2));
  const outDir = path.join(repoRoot, "public", "content");

  const { manifest, gazetteer, approvedCount, totalCount } = buildManifest({ sourceDir });

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));
  fs.writeFileSync(path.join(outDir, "gazetteer.json"), JSON.stringify(gazetteer, null, 2));

  console.log(`Build OK: ${approvedCount}/${totalCount} approved items published, ${gazetteer.length} gazetteer entries.`);
  console.log(`  -> ${path.relative(repoRoot, path.join(outDir, "manifest.json"))}`);
  console.log(`  -> ${path.relative(repoRoot, path.join(outDir, "gazetteer.json"))}`);
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  try {
    main();
  } catch (err) {
    console.error(err.message || err);
    process.exit(1);
  }
}

export { buildManifest };
