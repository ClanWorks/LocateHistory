// Wave 4b: San Salvador second image, from the second "roll toward 1000" push (2026-08-24).
// Run once, from the repo root: node scripts/migrate-build-seed-items-wave4b.js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const itemsPath = path.join(__dirname, "..", "content", "source", "items.json");
const gazetteerPath = path.join(__dirname, "..", "content", "source", "gazetteer.json");

const APPROVED_AT = "2026-08-24T09:30:00.000Z";
const NOTES = "Wave 4 (second 'roll toward 1000' push) batch, sourced by a background research agent and independently re-verified (sourceUrl/license re-checked against the live Commons page, image personally re-viewed) before approval.";

const SEED = [
  { id:"commons-san-salvador-brickyard-1910s", localName:"san-salvador-brickyard-1910s.jpg", workType:"photo", title:"Brick yard, San Salvador", artistOrCreator:null, depictedDate:{minYear:1909,maxYear:1920}, creationDate:{minYear:1909,maxYear:1920}, placeId:"san-salvador-sv", region:"Central America", difficulty:4, landmarkCategory:"genre-scene", tags:["brickyard","kiln","workers"], era:"1910s", license:"Public Domain (National Photo Company, PD-old-70-1923)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Brick_yard,_San_Salvador_LCCN2016821916.jpg", creditText:"National Photo Company Collection / Library of Congress", context:"A brickyard on the outskirts of San Salvador, with rows of sun-dried bricks and a kiln, 1910s." },
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
