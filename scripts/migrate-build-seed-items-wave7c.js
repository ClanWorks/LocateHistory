// Wave 7c: Berbera, Somalia — sourced and personally spoiler-checked/cropped very
// early this session but its integration script was never run, leaving it an
// orphaned file in content/originals/ for the rest of the session.
// Run once, from the repo root: node scripts/migrate-build-seed-items-wave7c.js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const itemsPath = path.join(__dirname, "..", "content", "source", "items.json");
const gazetteerPath = path.join(__dirname, "..", "content", "source", "gazetteer.json");

const APPROVED_AT = "2026-08-25T13:00:00.000Z";
const NOTES = "Sourced and personally spoiler-checked/cropped much earlier this session; recovered and integrated in Wave 7 after being found as an orphaned file in content/originals/ with no items.json entry.";

const SEED = [
  { id:"commons-berbera-town-panorama-1921", localName:"berbera-town-panorama-1921.png", workType:"photo", title:"Berbera town", artistOrCreator:"Major Henry A. Rayne", depictedDate:{minYear:1921,maxYear:1921}, creationDate:{minYear:1921,maxYear:1921}, placeId:"berbera-so", region:"East Africa", difficulty:4, landmarkCategory:"colonial-townscape", tags:["mosque-minaret","whitewashed-buildings","palm-groves"], era:"1920s", license:"Public Domain (UK Government work)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Berbera_town.png", creditText:"Major Henry A. Rayne, Sun, Sand and Somals", context:"An elevated 1921 view over Berbera, then capital of British Somaliland, showing a mosque minaret and whitewashed colonial buildings toward the coast.", curationNotes:"Cropped to remove a printed caption ('BERBERA TOWN.') in the white margin below the photo." },
];

function main() {
  const items = JSON.parse(fs.readFileSync(itemsPath, "utf8"));
  const gazetteer = JSON.parse(fs.readFileSync(gazetteerPath, "utf8"));
  const countryByPlaceId = new Map(gazetteer.map((g) => [g.id, g.country]));
  const existingIds = new Set(items.map((i) => i.id));
  let added = 0;
  for (const s of SEED) {
    if (existingIds.has(s.id)) { console.log(`skip: ${s.id}`); continue; }
    const country = countryByPlaceId.get(s.placeId);
    if (!country) throw new Error(`no gazetteer entry for placeId ${s.placeId} (item ${s.id})`);
    items.push({
      schemaVersion: 1, id: s.id, status: "approved", workType: s.workType, title: s.title,
      artistOrCreator: s.artistOrCreator, depictedDate: s.depictedDate, creationDate: s.creationDate,
      location: { placeId: s.placeId, acceptedPlaceIds: [] },
      classification: { region: s.region, difficulty: s.difficulty, landmarkCategory: s.landmarkCategory, tags: s.tags },
      clues: { region: s.region, era: s.era, country },
      media: { originalPath: s.localName, focalPoint: null },
      attribution: { source: "Wikimedia Commons", license: s.license, sourceUrl: s.sourceUrl, creditText: s.creditText },
      context: s.context, contentWarning: null,
      curation: { approvedBy: "andrew", approvedAt: APPROVED_AT, notes: s.curationNotes ? `${NOTES} ${s.curationNotes}` : NOTES },
      importSource: `commons:${s.id}`, createdAt: APPROVED_AT, updatedAt: APPROVED_AT,
    });
    added++;
  }
  fs.writeFileSync(itemsPath, JSON.stringify(items, null, 2) + "\n");
  console.log(`\n${added} item(s) added; ${items.length} total in items.json`);
}
main();
