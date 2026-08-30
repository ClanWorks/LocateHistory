// Wave 9a: 1 orphaned file (Zhenjiang junk on the Grand Canal) — the China
// interior sourcing agent reported it as integrated, but its final write was
// evidently clobbered by a concurrent write from another agent sharing the
// same items.json/gazetteer.json files. Recovered via orphan audit; license
// and spoiler-check independently re-verified by the curator.
// Run once, from the repo root: node scripts/migrate-build-seed-items-wave9a.js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const itemsPath = path.join(__dirname, "..", "content", "source", "items.json");
const gazetteerPath = path.join(__dirname, "..", "content", "source", "gazetteer.json");

const APPROVED_AT = "2026-08-25T20:15:00.000Z";
const NOTES = "Wave 9 (recovered orphan) item: the sourcing agent's own final report claimed this was integrated, but its write was evidently clobbered by a concurrent write to items.json/gazetteer.json from another agent sharing the same files. Recovered via orphan audit; the curator independently re-fetched the Commons license page and personally re-verified the visual spoiler check before approval.";

const SEED = [
  { id:"commons-zhenjiang-junk-grand-canal-1905", localName:"zhenjiang-junk-grand-canal-1905.png", workType:"photo", title:"Junk on the Grand Canal, Zhenjiang, loaded with dry reed grass", artistOrCreator:null, depictedDate:{minYear:1905,maxYear:1905}, creationDate:{minYear:1905,maxYear:1905}, placeId:"zhenjiang-cn", region:"East Asia", difficulty:5, landmarkCategory:"harbour", tags:["junk","grand-canal","reed-grass-cargo"], era:"1900s", license:"Public Domain (PD-US, published 1905)", sourceUrl:"https://commons.wikimedia.org/wiki/File:PSM_V67_D522_Junk_on_the_grand_canal_zhenjiang_loaded_with_dry_reed_grass.png", creditText:"Popular Science Monthly, vol. 67 (1905)", context:"A heavily loaded junk stacked high with dry reed grass on the Grand Canal near Zhenjiang, from a 1905 Popular Science Monthly article." },
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
