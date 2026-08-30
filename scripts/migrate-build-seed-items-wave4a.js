// Wave 4a: first items from the second "roll toward 1000" push (2026-08-24), after
// Andrew's guidance that up to 5 images per large/historic city is fine as long as
// the overall pool stays broad. Darwin and Dunedin (Oceania gaps) plus a 3rd Paris
// and 3rd London image (major-capital depth).
//
// Run once, from the repo root: node scripts/migrate-build-seed-items-wave4a.js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const itemsPath = path.join(__dirname, "..", "content", "source", "items.json");
const gazetteerPath = path.join(__dirname, "..", "content", "source", "gazetteer.json");

const APPROVED_AT = "2026-08-24T09:00:00.000Z";
const NOTES = "Wave 4 (second 'roll toward 1000' push, after Andrew's up-to-5-per-major-city guidance) batch, sourced by a background research agent and independently re-verified (sourceUrl/license re-checked against the live Commons page, image personally re-viewed) before approval.";

const SEED = [
  { id:"commons-darwin-port-darwin-1873", localName:"darwin-port-darwin-1873.jpg", workType:"drawing", title:"Port Darwin (Northern Territory)", artistOrCreator:"J. Carr / J.C. Armytage", depictedDate:{minYear:1873,maxYear:1873}, creationDate:{minYear:1873,maxYear:1873}, placeId:"darwin-au", region:"Oceania", difficulty:4, landmarkCategory:"settlement", tags:["frontier-settlement","tents","harbour"], era:"1870s", license:"Public Domain (CC-PD-Mark / PD-old-70-expired)", sourceUrl:"https://commons.wikimedia.org/wiki/File:BOOTH(1873)_2.453_PORT_DARWIN_(NORTHERN_TERRITORY).jpg", creditText:"Booth, Australia (1873)", context:"The fledgling Port Darwin settlement, tents and huts along a cleared track, 1873 engraving." },
  { id:"commons-dunedin-first-church-1874", localName:"dunedin-first-church-spire-1874.jpg", workType:"photo", title:"Dunedin from First Church Spire, 1874", artistOrCreator:"Burton Brothers", depictedDate:{minYear:1874,maxYear:1874}, creationDate:{minYear:1874,maxYear:1874}, placeId:"dunedin-nz", region:"Oceania", difficulty:3, landmarkCategory:"cityscape", tags:["octagon","rooftops","hills"], era:"1870s", license:"Public Domain (CC-PD-Mark)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Dunedin_from_First_Church_Spire_1874.jpg", creditText:"Burton Brothers", context:"An elevated view over Dunedin's city centre from First Church spire, 1874." },
  { id:"commons-paris-place-concorde-degas-1875", localName:"paris-place-de-la-concorde-degas-1875.jpg", workType:"painting", title:"Place de la Concorde", artistOrCreator:"Edgar Degas", depictedDate:{minYear:1875,maxYear:1875}, creationDate:{minYear:1875,maxYear:1875}, placeId:"paris-fr", region:"Western Europe", difficulty:5, landmarkCategory:"square", tags:["oil-painting","figures","dog"], era:"1870s", license:"Public Domain (life+70 expired)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Edgar_Degas_Place_de_la_Concorde.jpg", creditText:"Edgar Degas / Hermitage Museum", context:"Vicomte Lepic and his daughters strolling across the Place de la Concorde, 1875 oil painting." },
  { id:"commons-london-trafalgar-whitehall-1839", localName:"london-trafalgar-square-whitehall-1839.jpg", workType:"photo", title:"View of Whitehall from Trafalgar Square, 1839", artistOrCreator:"M. de St. Croix", depictedDate:{minYear:1839,maxYear:1839}, creationDate:{minYear:1839,maxYear:1839}, placeId:"london-gb", region:"Northern Europe", difficulty:4, landmarkCategory:"square", tags:["daguerreotype","equestrian-statue","shopfronts"], era:"1830s", license:"Public Domain (pre-1931 / CC-PD-Mark)", sourceUrl:"https://commons.wikimedia.org/wiki/File:View_of_Whitehall_from_Trafalgar_Square_which_is_blurred_with_pedestrian_and_carriage_traffic,_London,_1839.jpg", creditText:"M. de St. Croix", context:"An 1839 daguerreotype looking down Whitehall from Trafalgar Square, one of the earliest surviving photographs of London." },
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
