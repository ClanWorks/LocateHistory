// Click-to-guess world map (GeoGuessr-style), built on static Natural
// Earth-derived GeoJSON (public/map-data/) rendered with MapLibre GL JS.
// MapLibre is vendored locally under ./vendor/ — no CDN, no API key, no
// external runtime call. See map-style.js for why this is a plain
// GeoJSON source rather than tiled vector data.
//
// This is a mouse/touch affordance only — the canvas it draws into isn't
// keyboard-operable, so it's marked aria-hidden by the caller and the
// text-based city search in app.js remains the fully accessible way to
// submit the exact same kind of guess (see wireGuessInputs).
import { Map as MapLibreMap, Marker } from "./vendor/maplibre-gl/maplibre-gl.mjs";
import { buildMapStyle, PALETTE, GUESS_MARKER_COLOR } from "./map-style.js";

/**
 * @param {{ containerId: string, onChange: (guess: {lat: number, lng: number}) => void }} options
 * @returns {{ getGuess: () => {lat:number,lng:number}|null, setGuess: (lat: number, lng: number) => void, destroy: () => void }}
 */
export function createGuessMap({ containerId, onChange }) {
  const map = new MapLibreMap({
    container: containerId,
    style: buildMapStyle(PALETTE),
    center: [0, 20],
    zoom: 0.2,
    minZoom: 0,
    maxZoom: 5,
  });
  map.dragRotate.disable();
  map.touchZoomRotate.disableRotation();

  let marker = null;
  let guess = null;

  function placeGuess(lngLat) {
    guess = { lat: lngLat.lat, lng: lngLat.lng };
    if (marker) {
      marker.setLngLat(lngLat);
    } else {
      marker = new Marker({ color: GUESS_MARKER_COLOR }).setLngLat(lngLat).addTo(map);
    }
    onChange(guess);
  }

  map.on("click", (e) => placeGuess(e.lngLat));

  return {
    getGuess: () => guess,
    setGuess(lat, lng) {
      placeGuess({ lat, lng });
      map.easeTo({ center: [lng, lat], duration: 300 });
    },
    destroy() {
      if (marker) marker.remove();
      map.remove();
    },
  };
}
