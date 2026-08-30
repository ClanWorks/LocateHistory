// Wave 5f: Livingstone, Tanga (Southern/East Africa gap-closers).
// Run once, from the repo root: node scripts/migrate-build-seed-items-wave5f.js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const itemsPath = path.join(__dirname, "..", "content", "source", "items.json");
const gazetteerPath = path.join(__dirname, "..", "content", "source", "gazetteer.json");

const APPROVED_AT = "2026-08-24T14:30:00.000Z";
const NOTES = "Wave 5 (backlog finishing pass) batch: sourced by a resumed background research agent and independently re-verified (sourceUrl/license re-checked against the live Commons page, image personally re-viewed) before approval.";

const SEED = [
  { id:"commons-livingstone-coillard-chapel-1906", localName:"livingstone-coillard-chapel-1906.jpg", workType:"photo", title:"Chapelle commémorative Coillard à Livingstone", artistOrCreator:"Louis Jalla", depictedDate:{minYear:1906,maxYear:1906}, creationDate:{minYear:1906,maxYear:1906}, placeId:"livingstone-zm", region:"Southern Africa", difficulty:4, landmarkCategory:"religious-colonial", tags:["mission-chapel","veranda","group-portrait"], era:"1900s", license:"Public Domain (pre-1931 / PD Mark 1.0)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Zamb%C3%A8ze-Chapelle_comm%C3%A9morative_Coillard_%C3%A0_Livingstone_(cropped).jpg", creditText:"Louis Jalla", context:"The veranda of the Coillard Memorial Chapel in Livingstone, then capital of Northern Rhodesia, with mission-station residents, 1906." },
  { id:"commons-tanga-dhau-harbor-1910", localName:"tanga-dhau-harbor-1910.jpg", workType:"photo", title:"Deutsch-Ostafrika, Tanga, Hafen", artistOrCreator:"Walther Dobbertin", depictedDate:{minYear:1906,maxYear:1918}, creationDate:{minYear:1906,maxYear:1918}, placeId:"tanga-tz", region:"East Africa", difficulty:3, landmarkCategory:"harbor-waterfront", tags:["dhow","breakwater","sailing-vessels"], era:"1910s", license:"CC BY-SA 3.0 DE (Bundesarchiv)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Bundesarchiv_Bild_105-DOA0428,_Deutsch-Ostafrika,_Tanga,_Hafen.jpg", creditText:"Bundesarchiv, Bild 105-DOA0428 / Walther Dobbertin", context:"Dhow sailing vessels moored in Tanga harbor behind a breakwater, German East Africa, c.1906-1918." },
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
