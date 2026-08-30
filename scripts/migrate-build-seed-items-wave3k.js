// Wave 3k: North America depth batch 4 (final), finished centrally by the curator
// from the North America sourcing agent's researched backlog (2026-08-23).
// A second New York City image and a second Mexico City image — this completes
// the entire North America depth backlog left over from the original agent.
//
// Run once, from the repo root: node scripts/migrate-build-seed-items-wave3k.js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const itemsPath = path.join(__dirname, "..", "content", "source", "items.json");
const gazetteerPath = path.join(__dirname, "..", "content", "source", "gazetteer.json");

const APPROVED_AT = "2026-08-23T17:30:00.000Z";
const NOTES = "Wave 3 ('roll toward 1000') batch: sourcing agent left this candidate stalled/researched-only; the curator personally downloaded and visually inspected it before approval.";

const SEED = [
  { id:"commons-new-york-east-river-bridge-1902", localName:"new-york-brooklyn-bridge-east-river-1902.jpg", workType:"photo", title:"East River Bridge, New York City, 1902", artistOrCreator:"Irving Underhill", depictedDate:{minYear:1902,maxYear:1902}, creationDate:{minYear:1902,maxYear:1902}, placeId:"new-york-us", region:"North America", difficulty:2, landmarkCategory:"bridge", tags:["brooklyn-bridge","steamships","rooftops"], era:"1900s", license:"Public Domain Mark 1.0", sourceUrl:"https://commons.wikimedia.org/wiki/File:East_River_Bridge,_New_York_City_1902_(24905020583).jpg", creditText:"Irving Underhill", context:"The Brooklyn Bridge over the East River, seen from a rooftop amid steamships and warehouses, 1902." },
  { id:"commons-mexico-city-cathedral-zocalo-1880", localName:"mexico-city-cathedral-zocalo-1880.jpg", workType:"drawing", title:"Mexico City cathedral and zocalo, circa 1880", artistOrCreator:null, depictedDate:{minYear:1880,maxYear:1880}, creationDate:{minYear:1887,maxYear:1887}, placeId:"mexico-city-mx", region:"North America", difficulty:2, landmarkCategory:"cathedral", tags:["metropolitan-cathedral", "zocalo", "engraving"], era:"1880s", license:"Public Domain (published 1887, pre-1931)", sourceUrl:"https://commons.wikimedia.org/wiki/File:ASOM_D010_Mexico_city_cathedral_and_zocalo_circa_1880.jpg", creditText:"A Study of Mexico (1887)", context:"The Metropolitan Cathedral overlooking the Zócalo in Mexico City, engraving, c.1880." },
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
      curation: { approvedBy: "andrew", approvedAt: APPROVED_AT, notes: NOTES },
      importSource: `commons:${s.id}`, createdAt: APPROVED_AT, updatedAt: APPROVED_AT,
    });
    added++;
  }
  fs.writeFileSync(itemsPath, JSON.stringify(items, null, 2) + "\n");
  console.log(`\n${added} item(s) added; ${items.length} total in items.json`);
}
main();
