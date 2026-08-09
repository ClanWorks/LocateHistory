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
// Usage: node scripts/build-content.js [--source <dir>] [--content-out <dir>] [--assets-out <dir>]
// The build fails loudly rather than publishing partial or invalid data,
// and never touches the real output directories until a full build
// (validation + every asset + manifest + gazetteer) has already succeeded.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { validateSourceCollection, validateManifest } from "./lib/validate.js";
import { REQUIRED_ROUNDS } from "../public/js/state-machine.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");

function parseArgs(argv) {
  const args = {
    sourceDir: path.join(repoRoot, "content", "source"),
    contentOutDir: path.join(repoRoot, "public", "content"),
    assetsOutDir: path.join(repoRoot, "public", "assets"),
  };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--source" && argv[i + 1]) {
      args.sourceDir = path.resolve(argv[i + 1]);
      i++;
    } else if (argv[i] === "--content-out" && argv[i + 1]) {
      args.contentOutDir = path.resolve(argv[i + 1]);
      i++;
    } else if (argv[i] === "--assets-out" && argv[i + 1]) {
      args.assetsOutDir = path.resolve(argv[i + 1]);
      i++;
    }
  }
  return args;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

/**
 * Resolves item.media.originalPath against originalsDir and rejects any
 * result that escapes it (e.g. "../../../etc/passwd" or an absolute
 * path). See plan.md §13 step 12 ("fail on ... unsafe paths").
 */
function resolveConfinedPath(baseDir, relativePath) {
  const resolvedBase = path.resolve(baseDir);
  const resolvedPath = path.resolve(resolvedBase, relativePath);
  const isInside = resolvedPath === resolvedBase || resolvedPath.startsWith(resolvedBase + path.sep);
  if (!isInside) {
    throw new Error(`unsafe media path escapes originals directory: "${relativePath}"`);
  }
  return resolvedPath;
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
  const originalPath = resolveConfinedPath(originalsDir, item.media.originalPath);
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

/**
 * @param {object} options
 * @param {string} options.sourceDir
 * @param {string} [options.originalsDir]
 * @param {string} [options.assetsOutDir]
 * @param {number} [options.minApprovedItems] Production builds need at
 *   least REQUIRED_ROUNDS approved items to run one full session — this
 *   defaults to that. Tests pass a smaller explicit value so small,
 *   fast fixture sets don't have to fake ten items just to exercise the
 *   pipeline.
 */
function buildManifest({ sourceDir, originalsDir, assetsOutDir, minApprovedItems = REQUIRED_ROUNDS }) {
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
  if (approved.length < minApprovedItems) {
    throw new Error(
      `only ${approved.length} approved item(s) in ${sourceDir}, need at least ${minApprovedItems} for a full session ` +
        `(pass a smaller minApprovedItems explicitly for test/fixture builds)`
    );
  }
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

  // The public gazetteer is the whole curated guess pool, not just the
  // cities that happen to be correct answers in this content batch — if
  // it were filtered to answers-only, the searchable city selector would
  // list exactly the ten correct cities and get easier every round.
  // validateSourceCollection already guarantees every item's placeId and
  // acceptedPlaceIds resolve somewhere in this list, so no further
  // filtering or re-checking is needed here.
  const publicGazetteer = gazetteer;

  // "Deterministic" applies to contentHash, not the manifest file as a
  // whole: contentHash is derived only from manifestItems, so the same
  // source always produces the same hash. generatedAt is deliberately
  // wall-clock (useful for ops/debugging — "when was this published")
  // and will differ between two builds of identical content. Compare
  // contentHash, not the full JSON, when checking whether a rebuild
  // actually changed anything.
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

/**
 * Builds into a scratch staging directory first, and only touches the
 * real public/ output once everything — validation, every asset, the
 * manifest, the gazetteer — has succeeded. A mid-build failure with the
 * old single-pass version left whichever assets had already been written
 * sitting in public/assets alongside no manifest update at all, and old
 * assets for retired content were never cleaned up. Swapping the whole
 * assets directory in one rename means a rebuild's output always exactly
 * matches current approved content, with no partial writes and no
 * accumulating orphans.
 */
function main() {
  const { sourceDir, contentOutDir: outDir, assetsOutDir: finalAssetsDir } = parseArgs(process.argv.slice(2));
  const stagingAssetsDir = path.join(path.dirname(finalAssetsDir), `.assets-build-${crypto.randomUUID()}`);

  let result;
  try {
    result = buildManifest({ sourceDir, assetsOutDir: stagingAssetsDir });
  } catch (err) {
    fs.rmSync(stagingAssetsDir, { recursive: true, force: true });
    throw err;
  }

  const { manifest, gazetteer, approvedCount, totalCount } = result;

  fs.mkdirSync(outDir, { recursive: true });
  const manifestTmpPath = path.join(outDir, `.manifest.json.tmp-${crypto.randomUUID()}`);
  const gazetteerTmpPath = path.join(outDir, `.gazetteer.json.tmp-${crypto.randomUUID()}`);
  fs.writeFileSync(manifestTmpPath, JSON.stringify(manifest, null, 2));
  fs.writeFileSync(gazetteerTmpPath, JSON.stringify(gazetteer, null, 2));

  // Everything that can fail has already happened. From here it's just
  // renames, which are atomic on the same filesystem.
  fs.rmSync(finalAssetsDir, { recursive: true, force: true });
  fs.renameSync(stagingAssetsDir, finalAssetsDir);
  fs.renameSync(manifestTmpPath, path.join(outDir, "manifest.json"));
  fs.renameSync(gazetteerTmpPath, path.join(outDir, "gazetteer.json"));

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
