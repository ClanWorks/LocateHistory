// Pure equirectangular projection math for the reveal map. No landmass
// outline is drawn — a graticule (lat/lng grid, equator and prime
// meridian highlighted) plus two labeled pins is honest about what it
// is and doesn't risk a garbled or inaccurate coastline. A real
// landmass illustration is a plausible later polish pass, not a v1
// requirement.

/**
 * @param {number} lat -90..90
 * @param {number} lng -180..180
 * @param {number} width
 * @param {number} height
 * @returns {{ x: number, y: number }}
 */
export function project(lat, lng, width, height) {
  const x = ((lng + 180) / 360) * width;
  const y = ((90 - lat) / 180) * height;
  return { x, y };
}

/**
 * Graticule lines every `stepDeg` degrees, as projected {x1,y1,x2,y2}
 * segments, each tagged so the renderer can style the equator/prime
 * meridian differently from ordinary grid lines.
 */
export function graticuleLines(width, height, stepDeg = 30) {
  const lines = [];
  for (let lng = -180; lng <= 180; lng += stepDeg) {
    const a = project(-90, lng, width, height);
    const b = project(90, lng, width, height);
    lines.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, emphasis: lng === 0 ? "prime-meridian" : "meridian" });
  }
  for (let lat = -90; lat <= 90; lat += stepDeg) {
    const a = project(lat, -180, width, height);
    const b = project(lat, 180, width, height);
    lines.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, emphasis: lat === 0 ? "equator" : "parallel" });
  }
  return lines;
}
