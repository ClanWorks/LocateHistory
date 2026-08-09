// Pure search over the gazetteer for the searchable city selector
// (plan.md §5 — a searchable selector, not fuzzy free text or a map
// pin). No DOM, no I/O — easy to test and reason about independently of
// how it's rendered.

const COMBINING_DIACRITICS = /[̀-ͯ]/g;

function normalize(str) {
  return str
    .normalize("NFD")
    .replace(COMBINING_DIACRITICS, "") // so "Bogota" matches "Bogotá"
    .toLowerCase()
    .trim();
}

function matchStrength(normalizedQuery, normalizedCandidate) {
  if (normalizedCandidate === normalizedQuery) return 3;
  if (normalizedCandidate.startsWith(normalizedQuery)) return 2;
  if (normalizedCandidate.includes(normalizedQuery)) return 1;
  return 0;
}

/**
 * Best match strength for a query against every name a gazetteer entry
 * is known by (display name, aliases, historical names).
 */
function bestEntryMatch(entry, normalizedQuery) {
  const candidates = [entry.displayName, ...entry.aliases, ...entry.historicalNames];
  let best = 0;
  for (const candidate of candidates) {
    const strength = matchStrength(normalizedQuery, normalize(candidate));
    if (strength > best) best = strength;
  }
  return best;
}

/**
 * @param {object[]} gazetteer
 * @param {string} query
 * @param {number} [limit]
 * @returns {object[]} matching gazetteer entries, best matches first,
 *   ties broken alphabetically by displayName. Empty query returns [].
 */
export function searchGazetteer(gazetteer, query, limit = 8) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return [];

  const scored = [];
  for (const entry of gazetteer) {
    const strength = bestEntryMatch(entry, normalizedQuery);
    if (strength > 0) scored.push({ entry, strength });
  }

  scored.sort((a, b) => b.strength - a.strength || a.entry.displayName.localeCompare(b.entry.displayName));
  return scored.slice(0, limit).map((s) => s.entry);
}
