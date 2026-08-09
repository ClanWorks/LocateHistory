import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";
import addFormats from "ajv-formats";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemasDir = path.join(__dirname, "..", "..", "content", "schemas");

const ajv = new Ajv({ allErrors: true, strict: true });
addFormats(ajv);

function loadSchema(name) {
  const raw = fs.readFileSync(path.join(schemasDir, name), "utf8");
  return JSON.parse(raw);
}

const validateItemSchema = ajv.compile(loadSchema("item.schema.json"));
const validateGazetteerEntrySchema = ajv.compile(loadSchema("gazetteer-entry.schema.json"));
const validateManifestSchema = ajv.compile(loadSchema("manifest.schema.json"));

/** @typedef {{ path: string, message: string }} ValidationError */

function formatAjvErrors(errors) {
  return (errors || []).map((e) => ({
    path: e.instancePath || "(root)",
    message: e.message,
  }));
}

/**
 * Validate a single curator source item against the schema only.
 * Does not check cross-references (gazetteer resolution, duplicate IDs) —
 * use validateSourceCollection for that.
 * @returns {ValidationError[]} empty array when valid
 */
export function validateItem(item) {
  const ok = validateItemSchema(item);
  return ok ? [] : formatAjvErrors(validateItemSchema.errors);
}

/** @returns {ValidationError[]} empty array when valid */
export function validateGazetteerEntry(entry) {
  const ok = validateGazetteerEntrySchema(entry);
  return ok ? [] : formatAjvErrors(validateGazetteerEntrySchema.errors);
}

/** @returns {ValidationError[]} empty array when valid */
export function validateManifest(manifest) {
  const ok = validateManifestSchema(manifest);
  return ok ? [] : formatAjvErrors(validateManifestSchema.errors);
}

/**
 * Cross-referential validation across the whole source collection.
 * Implements plan.md §13 steps 1-4 (schema, duplicate IDs, unresolved
 * gazetteer IDs, date ranges, attribution presence).
 * @param {object[]} items
 * @param {object[]} gazetteer
 * @returns {{ id: string | null, errors: ValidationError[] }[]} one entry
 *   per item that failed, each with its accumulated errors. Items that
 *   pass are omitted.
 */
export function validateSourceCollection(items, gazetteer) {
  const failures = [];
  const seenIds = new Map();
  const gazetteerIds = new Set(gazetteer.map((g) => g.id));

  const seenGazetteerIds = new Map();
  const gazetteerErrors = [];
  gazetteer.forEach((entry, index) => {
    const errors = validateGazetteerEntry(entry);
    const label = entry.id ?? `gazetteer[${index}]`;

    // A Set silently collapses duplicate ids, which would leave two
    // entries claiming the same canonical place with city lookup and
    // scoring picking one arbitrarily. Track first occurrence, same as
    // content item ids below, and report the collision instead.
    if (entry.id) {
      if (seenGazetteerIds.has(entry.id)) {
        errors.push({ path: "/id", message: `duplicate gazetteer id, also used at gazetteer[${seenGazetteerIds.get(entry.id)}]` });
      } else {
        seenGazetteerIds.set(entry.id, index);
      }
    }

    if (errors.length) {
      gazetteerErrors.push({ id: label, errors });
    }
  });
  if (gazetteerErrors.length) failures.push(...gazetteerErrors);

  items.forEach((item, index) => {
    const errors = validateItem(item);
    const label = item.id ?? `items[${index}]`;

    if (item.id) {
      if (seenIds.has(item.id)) {
        errors.push({ path: "/id", message: `duplicate content id, also used at items[${seenIds.get(item.id)}]` });
      } else {
        seenIds.set(item.id, index);
      }
    }

    if (item.location) {
      const allPlaceIds = [item.location.placeId, ...(item.location.acceptedPlaceIds || [])];
      for (const placeId of allPlaceIds) {
        if (placeId && !gazetteerIds.has(placeId)) {
          errors.push({ path: "/location", message: `unresolved gazetteer id "${placeId}"` });
        }
      }
    }

    if (item.depictedDate && item.depictedDate.minYear > item.depictedDate.maxYear) {
      errors.push({ path: "/depictedDate", message: "minYear must be <= maxYear" });
    }
    if (item.creationDate && item.creationDate.minYear > item.creationDate.maxYear) {
      errors.push({ path: "/creationDate", message: "minYear must be <= maxYear" });
    }

    if (item.status === "approved") {
      if (!item.attribution || !item.attribution.license || !item.attribution.license.trim()) {
        errors.push({ path: "/attribution/license", message: "approved items require a non-empty license" });
      }
      if (!item.attribution || !item.attribution.sourceUrl) {
        errors.push({ path: "/attribution/sourceUrl", message: "approved items require a sourceUrl" });
      }
    }

    if (errors.length) failures.push({ id: label, errors });
  });

  return failures;
}
