// Real M2 media pipeline: decodes the original with sharp, enforces a
// minimum dimension, strips metadata, and generates a small set of
// responsive JPEG widths — replacing M1's PNG-only, no-resize stub.
// See plan.md §13 steps 5-10.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";

export const MIN_DIMENSION_PX = 480;
// Target output widths for the srcset. Sorted ascending; the largest one
// that's <= the original width becomes image.src. Never upscales past
// the original.
export const TARGET_WIDTHS = [480, 960, 1600];
const JPEG_QUALITY = 82;

/**
 * Resolves item.media.originalPath against originalsDir and rejects any
 * result that escapes it (e.g. "../../../etc/passwd" or an absolute
 * path). See plan.md §13 step 12 ("fail on ... unsafe paths").
 */
export function resolveConfinedPath(baseDir, relativePath) {
  const resolvedBase = path.resolve(baseDir);
  const resolvedPath = path.resolve(resolvedBase, relativePath);
  const isInside = resolvedPath === resolvedBase || resolvedPath.startsWith(resolvedBase + path.sep);
  if (!isInside) {
    throw new Error(`unsafe media path escapes originals directory: "${relativePath}"`);
  }
  return resolvedPath;
}

/**
 * Decodes one original, validates it, and writes a set of responsive
 * JPEG variants (each under an opaque, checksum-derived name — never the
 * original filename) into assetsOutDir.
 *
 * Metadata stripping is implicit: sharp only preserves EXIF/ICC/XMP when
 * `.withMetadata()` is called, so simply not calling it strips all of
 * that from every output file — no separate strip step needed.
 *
 * @param {{ id: string, media: { originalPath: string } }} item
 * @param {{ originalsDir: string, assetsOutDir: string, minDimensionPx?: number }} options
 * @returns {Promise<{ src: string, srcset: string, width: number, height: number, placeholder: null }>}
 */
export async function processMedia(item, { originalsDir, assetsOutDir, minDimensionPx = MIN_DIMENSION_PX }) {
  const originalPath = resolveConfinedPath(originalsDir, item.media.originalPath);
  if (!fs.existsSync(originalPath)) {
    throw new Error(`missing original asset for "${item.id}": ${originalPath}`);
  }

  const bytes = fs.readFileSync(originalPath);
  const image = sharp(bytes);
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error(`could not read dimensions for "${item.id}" (${originalPath}) — corrupt or unsupported image`);
  }
  if (metadata.width < minDimensionPx || metadata.height < minDimensionPx) {
    throw new Error(
      `"${item.id}" is ${metadata.width}x${metadata.height}, below the ${minDimensionPx}px minimum on at least one side (${originalPath})`
    );
  }

  // Opaque name derived from the ORIGINAL file's bytes, not the output —
  // keeps one stable identity per source image across all its resized
  // variants, and never leaks the source filename.
  const checksum = crypto.createHash("sha256").update(bytes).digest("hex").slice(0, 16);

  // Clamp each target to the original width rather than dropping targets
  // that exceed it — e.g. an 800px original against [480, 960, 1600]
  // should produce [480, 800], using its full native resolution as the
  // largest/default variant, not filter down to just [480] and throw
  // away 320px of real detail.
  const widths = [...new Set(TARGET_WIDTHS.map((w) => Math.min(w, metadata.width)))].sort((a, b) => a - b);

  fs.mkdirSync(assetsOutDir, { recursive: true });

  const variants = [];
  for (const targetWidth of widths) {
    const resized = sharp(bytes).resize({ width: targetWidth, withoutEnlargement: true });
    const { data, info } = await resized.jpeg({ quality: JPEG_QUALITY }).toBuffer({ resolveWithObject: true });
    const assetName = `${checksum}-${info.width}w.jpg`;
    fs.writeFileSync(path.join(assetsOutDir, assetName), data);
    variants.push({ src: `assets/${assetName}`, width: info.width, height: info.height });
  }

  const largest = variants[variants.length - 1];
  const srcset = variants.map((v) => `${v.src} ${v.width}w`).join(", ");

  return { src: largest.src, srcset, width: largest.width, height: largest.height, placeholder: null };
}
