// Crop-salvage batch: previously-rejected spoiler-captioned images, recovered by
// cropping the caption/title out rather than discarding the item entirely.
// Each of these fills a genuine zero-coverage gap (Mosul, Tokyo, Jaffna all had
// no approved item before this). Sources re-verified fresh against the live
// Commons File: page (not reused from the original rejection's notes) since the
// old local filename for Mosul turned out, on re-check, to not match the
// candidate this batch actually ships (see CURATION_NOTES.md).
//
// Run once, from the repo root: node scripts/migrate-build-seed-items-crop-salvage.js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const itemsPath = path.join(__dirname, "..", "content", "source", "items.json");
const gazetteerPath = path.join(__dirname, "..", "content", "source", "gazetteer.json");

const APPROVED_AT = "2026-08-23T00:00:00.000Z";

const SEED = [
  {
    id: "commons-mosul-general-view-minaret-1932",
    localName: "mosul-general-view-minaret-1932-cropped.jpg",
    workType: "photo",
    title: "Iraq. Mosul. General view with tall minaret in center of picture",
    artistOrCreator: null,
    depictedDate: { minYear: 1932, maxYear: 1932 },
    creationDate: { minYear: 1932, maxYear: 1932 },
    placeId: "mosul-iq",
    region: "Middle East",
    difficulty: 4,
    landmarkCategory: "cityscape",
    tags: ["minaret", "rooftops", "ruins"],
    era: "1930s",
    license: "Public Domain (PD-US-no notice)",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Iraq._Mosul._General_view_with_tall_minaret_in_center_of_picture_LOC_matpc.16200.jpg",
    creditText: "Matson (G. Eric and Edith) Photograph Collection, Library of Congress",
    context: "A rooftop view over old Mosul toward the leaning minaret of the Great Mosque of al-Nuri, 1932.",
    curationNotes: "Cropped to remove the handwritten 'Mosul' annotation and negative number in the film mount's margin, both outside the photo frame itself. Replaces an earlier same-city candidate whose original source file could not be re-matched to a verifiable Commons record on re-check; that file and its provisional crop were discarded rather than shipped with an unverified citation.",
  },
  {
    id: "commons-tokyo-kyobashi-bridge-1890",
    localName: "tokyo-kyobashi-bridge-1890-cropped.png",
    workType: "photo",
    title: "Kyobashi (Capital Bridge) and Ginza Avenue, Tokyo",
    artistOrCreator: "Attributed to Adolfo Farsari",
    depictedDate: { minYear: 1890, maxYear: 1890 },
    creationDate: { minYear: 1890, maxYear: 1890 },
    placeId: "tokyo-jp",
    region: "East Asia",
    difficulty: 4,
    landmarkCategory: "street",
    tags: ["bridge", "hand-colored", "rickshaws", "telegraph-poles"],
    era: "1890s",
    license: "Public Domain (CC-PD-Mark)",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Kyobashi_Capital_Bridge_Tokyo_c1890.png",
    creditText: "Wikimedia Commons",
    context: "A hand-colored view of the Kyobashi bridge and Ginza avenue in old Tokyo, crowded with rickshaws and a horse-drawn tram.",
    curationNotes: "Cropped to remove a printed 'V 33 KYOBASHI TOKYO' caption box in the bottom-right corner of the print itself. In-scene Japanese shop signage elsewhere in the frame does not name the city and was not treated as disqualifying.",
  },
  {
    id: "commons-jaffna-birds-eye-1658",
    localName: "jaffna-birds-eye-1658-cropped.jpg",
    workType: "drawing",
    title: "Afbeeldinge van 't Casteel ende de Stad Jaffenapatnam (detail)",
    artistOrCreator: "Attributed to Johannes (van) Nessel",
    depictedDate: { minYear: 1658, maxYear: 1658 },
    creationDate: { minYear: 1658, maxYear: 1658 },
    placeId: "jaffna-lk",
    region: "South Asia",
    difficulty: 5,
    landmarkCategory: "fort",
    tags: ["map", "star-fort", "dutch", "engraving"],
    era: "1650s",
    license: "Public Domain (PD-US, published before 1931)",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:AMH-4491-NA_Bird%27s_eye_view_of_the_city_of_Jaffnapatnam.jpg",
    creditText: "Nationaal Archief (Dutch National Archives)",
    context: "A 1658 Dutch survey drawing of the star-shaped fort and street grid of Jaffna, made shortly after the VOC captured it from the Portuguese.",
    curationNotes: "Tightly cropped to the fort-and-city illustration on the right side of the sheet, excluding the large title cartouche, two blocks of Dutch cursive marginalia, and the legend table — all of which sit in blank parchment separate from the drawing itself and all of which name the city directly. Unlike the Goa map rejected earlier in this pool (title stamped across the map content itself), this sheet's text and picture are spatially separable, which is what makes the crop clean. Single-letter map-key labels (A, D, E, H, etc.) remain in the crop; these are legend references, not place names, and are not disqualifying.",
  },
];

function main() {
  const items = JSON.parse(fs.readFileSync(itemsPath, "utf8"));
  const gazetteer = JSON.parse(fs.readFileSync(gazetteerPath, "utf8"));
  const countryByPlaceId = new Map(gazetteer.map((g) => [g.id, g.country]));
  const existingIds = new Set(items.map((i) => i.id));
  let added = 0;
  for (const s of SEED) {
    if (existingIds.has(s.id)) {
      console.log(`skip: ${s.id}`);
      continue;
    }
    const country = countryByPlaceId.get(s.placeId);
    if (!country) throw new Error(`no gazetteer entry for placeId ${s.placeId} (item ${s.id})`);
    items.push({
      schemaVersion: 1,
      id: s.id,
      status: "approved",
      workType: s.workType,
      title: s.title,
      artistOrCreator: s.artistOrCreator,
      depictedDate: s.depictedDate,
      creationDate: s.creationDate,
      location: { placeId: s.placeId, acceptedPlaceIds: [] },
      classification: {
        region: s.region,
        difficulty: s.difficulty,
        landmarkCategory: s.landmarkCategory,
        tags: s.tags,
      },
      clues: { region: s.region, era: s.era, country },
      media: { originalPath: s.localName, focalPoint: null },
      attribution: {
        source: "Wikimedia Commons",
        license: s.license,
        sourceUrl: s.sourceUrl,
        creditText: s.creditText,
      },
      context: s.context,
      contentWarning: null,
      curation: {
        approvedBy: "andrew",
        approvedAt: APPROVED_AT,
        notes: s.curationNotes,
      },
      importSource: `commons:${s.id}`,
      createdAt: APPROVED_AT,
      updatedAt: APPROVED_AT,
    });
    added++;
  }
  fs.writeFileSync(itemsPath, JSON.stringify(items, null, 2) + "\n");
  console.log(`\n${added} item(s) added; ${items.length} total in items.json`);
}
main();
