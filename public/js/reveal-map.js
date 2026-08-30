// Static (non-guessing) map for the round-result screen: the correct
// location and — unless the round timed out — the player's guess, with a
// dashed line between them. Replaces the earlier lat/lng-grid-only SVG
// (map-projection.js): now that guess-map.js already renders a real
// basemap for the round screen, reusing it here means both maps read as
// the same object instead of two different styles of "map."
import { Map as MapLibreMap, Marker, LngLatBounds } from "./vendor/maplibre-gl/maplibre-gl.mjs";
import { buildMapStyle, PALETTE, ANSWER_MARKER_COLOR, GUESS_MARKER_COLOR } from "./map-style.js";

const CONNECTOR_ID = "connector";
// Coarser than the guess map's cap only in spirit — both use 5 because
// the underlying data (Natural Earth 110m) starts looking chunky past
// that regardless of which map is showing it.
const MAX_ZOOM = 5;

/**
 * @param {{ containerId: string, answer: {lat:number,lng:number}, guess: {lat:number,lng:number}|null }} options
 * @returns {{ destroy: () => void }}
 */
export function createRevealMap({ containerId, answer, guess }) {
  const map = new MapLibreMap({
    container: containerId,
    style: buildMapStyle(PALETTE),
    center: [answer.lng, answer.lat],
    zoom: guess ? 1 : 3,
    maxZoom: MAX_ZOOM,
  });
  map.dragRotate.disable();
  map.touchZoomRotate.disableRotation();

  new Marker({ color: ANSWER_MARKER_COLOR }).setLngLat([answer.lng, answer.lat]).addTo(map);

  if (guess) {
    new Marker({ color: GUESS_MARKER_COLOR }).setLngLat([guess.lng, guess.lat]).addTo(map);

    map.on("load", () => {
      map.addSource(CONNECTOR_ID, {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: [
              [guess.lng, guess.lat],
              [answer.lng, answer.lat],
            ],
          },
        },
      });
      map.addLayer({
        id: CONNECTOR_ID,
        type: "line",
        source: CONNECTOR_ID,
        paint: { "line-color": "#1a1a1a", "line-width": 1.5, "line-dasharray": [2, 1.5] },
      });
    });

    // A pair straddling the antimeridian (a guess near Alaska, an answer
    // just across the date line in Russia) would otherwise fit-bound the
    // "long way" around the entire world. Wrap the guess's longitude to
    // whichever side keeps the pair close before computing bounds.
    let guessLng = guess.lng;
    if (Math.abs(guessLng - answer.lng) > 180) {
      guessLng += guessLng < answer.lng ? 360 : -360;
    }
    const bounds = new LngLatBounds([answer.lng, answer.lat], [answer.lng, answer.lat]);
    bounds.extend([guessLng, guess.lat]);
    map.fitBounds(bounds, { padding: 48, maxZoom: MAX_ZOOM, duration: 0 });
  }

  return {
    destroy() {
      map.remove();
    },
  };
}
