// A deliberately minimal MapLibre style, sourced from two small static
// GeoJSON files (public/map-data/) derived from Natural Earth's public-
// domain 110m-resolution land and country-boundary datasets — coarse by
// design, since this only ever renders at zoom 0-5. Plain GeoJSON rather
// than tiled vector data (the earlier approach, self-hosted Protomaps/
// PMTiles) deliberately: PMTiles reads via HTTP byte-range requests, and
// Cloudflare Pages does not yet return spec-compliant 206 responses for
// them (confirmed both in Cloudflare's own docs and by testing the
// deployed site directly — the pmtiles client correctly refused to run
// against it). A GeoJSON source is one ordinary fetch, so it has no such
// dependency and works identically everywhere, including here.
//
// Country name labels ARE shown on both the guessing map and the reveal
// map — this isn't a spoiler risk the way a place-name label near the
// answer's own pin would be: real GeoGuessr's own guessing map shows
// country names too, and knowing a landmass is labeled "Kazakhstan"
// doesn't tell a player which city in it the photo shows. Labels use
// Natural Earth's own LABELRANK field (kept as `labelrank` in
// countries.geojson) as MapLibre's symbol-sort-key, so at low zoom only
// the most prominent countries' names render and MapLibre's built-in
// collision detection thins the rest — the same mechanism real basemaps
// use, not a hand-rolled zoom cutoff. Font glyphs are a self-hosted
// subset (public/js/vendor/fonts/), Basic Latin + Latin-1 Supplement +
// Latin Extended-A/B (ranges 0-255 and 256-511 of Noto Sans Regular) —
// enough for every country's common English name, including diacritics
// (Curaçao, Réunion, São Tomé and Príncipe), without vendoring the full
// multi-script glyph set no country name here actually needs.

// Shared between guess-map.js (the click-to-guess round map) and
// reveal-map.js (the round-result map) so both render as the same
// object. A dark map to match the dark "light table" identity — water
// reads as the room's darkness, land as a lit-from-below tan surface,
// so the map itself feels like part of the same lit-object language as
// the photo frame rather than a bright rectangle dropped onto a dark
// page.
export const PALETTE = {
  land: "#3a3226",
  water: "#12171f",
  border: "#6b5c42",
  labelText: "#d8cbb0",
  labelHalo: "#12171f",
};
export const ANSWER_MARKER_COLOR = "#2fae5a";
export const GUESS_MARKER_COLOR = "#e8a23c";

/** @param {{ land: string, water: string, border: string, labelText: string, labelHalo: string }} palette */
export function buildMapStyle(palette) {
  // Built by hand (not new URL(...).href) because MapLibre substitutes
  // the literal "{fontstack}"/"{range}" placeholders into this template
  // itself — the URL constructor would percent-encode the braces first
  // and silently break glyph loading.
  const glyphsBase = new URL("js/vendor/fonts/", document.baseURI).href;

  return {
    version: 8,
    glyphs: `${glyphsBase}{fontstack}/{range}.pbf`,
    sources: {
      land: { type: "geojson", data: new URL("map-data/land.geojson", document.baseURI).href },
      countries: {
        type: "geojson",
        data: new URL("map-data/countries.geojson", document.baseURI).href,
        attribution: '&copy; <a href="https://www.naturalearthdata.com" target="_blank" rel="noopener noreferrer">Natural Earth</a>',
      },
    },
    layers: [
      { id: "background", type: "background", paint: { "background-color": palette.water } },
      { id: "land", type: "fill", source: "land", paint: { "fill-color": palette.land } },
      {
        id: "borders",
        type: "line",
        source: "countries",
        paint: { "line-color": palette.border, "line-width": 0.75 },
      },
      {
        id: "country-labels",
        type: "symbol",
        source: "countries",
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Noto Sans Regular"],
          "text-size": 10,
          "text-max-width": 7,
          "symbol-sort-key": ["get", "labelrank"],
        },
        paint: {
          "text-color": palette.labelText,
          "text-halo-color": palette.labelHalo,
          "text-halo-width": 1.2,
        },
      },
    ],
  };
}
