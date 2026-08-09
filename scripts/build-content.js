#!/usr/bin/env node
// Deterministic content build. Replaces the interactive Firestore CLI
// (config/addCityCLI.cjs) with a validated, reviewable pipeline.
// See plan.md §8 and §13.
//
// Schema + cross-reference validation, deterministic manifest and
// gazetteer generation, and the real M2 media pipeline (sharp-based
// decoding, minimum-dimension enforcement, metadata stripping,
// responsive JPEG variants under opaque checksum-derived names — see
// scripts/lib/media.js).
//
// Usage: node scripts/build-content.js [--source <dir>] [--content-out <dir>] [--assets-out <dir>] [--min-dimension <px>]
// The build fails loudly rather than publishing partial or invalid data,
// and never touches the real output directories until a full build
// (validation + every asset + manifest + gazetteer) has already succeeded.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { validateSourceCollection, validateManifest } from "./lib/validate.js";
import { processMedia } from "./lib/media.js";
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
    } else if (argv[i] === "--min-dimension" && argv[i + 1]) {
      args.minDimensionPx = Number(argv[i + 1]);
      i++;
    }
  }
  return args;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
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
async function buildManifest({ sourceDir, originalsDir, assetsOutDir, minApprovedItems = REQUIRED_ROUNDS, minDimensionPx }) {
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

  const manifestItems = [];
  for (const item of approved) {
    const mediaOptions = { originalsDir: resolvedOriginalsDir, assetsOutDir: resolvedAssetsOutDir };
    if (minDimensionPx !== undefined) mediaOptions.minDimensionPx = minDimensionPx;
    const image = await processMedia(item, mediaOptions);
    manifestItems.push({
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
    });
  }

  // The public gazetteer is the whole curated guess pool, not just the
  // cities that happen to be correct answers in this content batch — if
  // it were filtered to answers-only, the searchable city selector would
  // list exactly the ten correct cities and get easier every round.
  // validateSourceCollection already guarantees every item's placeId and
  // acceptedPlaceIds resolve somewhere in this list, so no further
  // filtering or re-checking is needed here.
  const publicGazetteer = gazetteer;

  // "Deterministic" applies to contentHash, not the manifest file as a
  // whole: contentHash is derived from manifestItems AND the published
  // gazetteer, so the same source always produces the same hash.
  // Gazetteer data (coordinates, aliases) directly affects scoring, so a
  // curator correction there has to change the hash too — hashing only
  // manifestItems would let a coordinate fix silently change game
  // results while contentHash claimed nothing had changed. generatedAt
  // is deliberately wall-clock (useful for ops/debugging — "when was
  // this published") and will differ between two builds of identical
  // content. Compare contentHash, not the full JSON, when checking
  // whether a rebuild actually changed anything.
  const manifestBody = { manifestVersion: 1, items: manifestItems, gazetteer: publicGazetteer };
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

const STAGING_PREFIX = ".assets-build-";
const BACKUP_PREFIX = ".assets-backup-";

/**
 * Removes leftover staging/backup directories from a previous run that
 * crashed mid-build or mid-swap.
 *
 * Staging dirs are always safe to discard — they're never validated as
 * complete until the swap step. Backup dirs are NOT always safe to
 * discard: if a previous run crashed between "rename final aside to
 * backup" and "rename staging into final", finalAssetsDir doesn't exist
 * and the backup is the only good copy of the assets. Blindly deleting
 * every backup dir on startup — the original version of this function —
 * would destroy that copy outright, and if the resulting build then
 * also failed for any reason, finalAssetsDir would be left completely
 * empty with nothing left to recover from.
 *
 * So: if finalAssetsDir is missing and a backup exists, restore the most
 * recently modified one (there should only ever be one, but pick by
 * mtime defensively) before doing anything else, and only then clean up
 * any other stale backups. If finalAssetsDir already exists, every
 * backup dir found is a confirmed orphan from an already-completed swap
 * and is safe to delete.
 */
function cleanupStaleBuildArtifacts(assetsParentDir, finalAssetsDir) {
  if (!fs.existsSync(assetsParentDir)) return;

  const entries = fs.readdirSync(assetsParentDir);
  for (const name of entries) {
    if (name.startsWith(STAGING_PREFIX)) {
      fs.rmSync(path.join(assetsParentDir, name), { recursive: true, force: true });
    }
  }

  const backupDirs = entries.filter((name) => name.startsWith(BACKUP_PREFIX));
  if (backupDirs.length === 0) return;

  if (!fs.existsSync(finalAssetsDir)) {
    const withMtime = backupDirs.map((name) => ({ name, mtime: fs.statSync(path.join(assetsParentDir, name)).mtime }));
    withMtime.sort((a, b) => b.mtime - a.mtime);
    const [mostRecent, ...stale] = withMtime;
    console.error(`recovering from an interrupted build: restoring ${mostRecent.name} to ${path.basename(finalAssetsDir)}`);
    fs.renameSync(path.join(assetsParentDir, mostRecent.name), finalAssetsDir);
    for (const { name } of stale) fs.rmSync(path.join(assetsParentDir, name), { recursive: true, force: true });
  } else {
    for (const name of backupDirs) fs.rmSync(path.join(assetsParentDir, name), { recursive: true, force: true });
  }
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
 *
 * The swap itself renames the old assets dir aside (rather than deleting
 * it) before renaming staging into place, so a rename failure or process
 * interruption during the swap leaves the previous good assets sitting
 * in a recoverable backup dir instead of gone outright. This narrows,
 * but does not eliminate, the failure window — true all-or-nothing
 * atomicity across three separate resources (assets dir, manifest.json,
 * gazetteer.json) would need a versioned-directory-plus-pointer scheme,
 * which is more machinery than a solo-maintained build script warrants
 * right now.
 */
async function main() {
  const { sourceDir, contentOutDir: outDir, assetsOutDir: finalAssetsDir, minDimensionPx } = parseArgs(process.argv.slice(2));
  const assetsParentDir = path.dirname(finalAssetsDir);
  fs.mkdirSync(assetsParentDir, { recursive: true });
  cleanupStaleBuildArtifacts(assetsParentDir, finalAssetsDir);

  const stagingAssetsDir = path.join(assetsParentDir, `${STAGING_PREFIX}${crypto.randomUUID()}`);

  let result;
  try {
    const buildOptions = { sourceDir, assetsOutDir: stagingAssetsDir };
    if (minDimensionPx !== undefined) buildOptions.minDimensionPx = minDimensionPx;
    result = await buildManifest(buildOptions);
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

  // Everything that can fail on its own merits has already happened.
  // From here it's renames (atomic per-call on the same filesystem) plus
  // a backup step so the old assets are never simply deleted.
  const backupAssetsDir = path.join(assetsParentDir, `${BACKUP_PREFIX}${crypto.randomUUID()}`);
  const hadExistingAssets = fs.existsSync(finalAssetsDir);
  if (hadExistingAssets) {
    fs.renameSync(finalAssetsDir, backupAssetsDir);
  }
  fs.renameSync(stagingAssetsDir, finalAssetsDir);
  fs.renameSync(manifestTmpPath, path.join(outDir, "manifest.json"));
  fs.renameSync(gazetteerTmpPath, path.join(outDir, "gazetteer.json"));
  if (hadExistingAssets) {
    fs.rmSync(backupAssetsDir, { recursive: true, force: true });
  }

  console.log(`Build OK: ${approvedCount}/${totalCount} approved items published, ${gazetteer.length} gazetteer entries.`);
  console.log(`  -> ${path.relative(repoRoot, path.join(outDir, "manifest.json"))}`);
  console.log(`  -> ${path.relative(repoRoot, path.join(outDir, "gazetteer.json"))}`);
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  main().catch((err) => {
    console.error(err.message || err);
    process.exit(1);
  });
}

export { buildManifest, cleanupStaleBuildArtifacts, STAGING_PREFIX, BACKUP_PREFIX };
