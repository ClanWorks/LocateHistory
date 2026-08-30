// Wave 3h: North America depth batch, finished centrally by the curator from the
// North America sourcing agent's fully-researched-but-undownloaded backlog
// (2026-08-23). Chicago, Boston, Philadelphia, San Francisco.
//
// Run once, from the repo root: node scripts/migrate-build-seed-items-wave3h.js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const itemsPath = path.join(__dirname, "..", "content", "source", "items.json");
const gazetteerPath = path.join(__dirname, "..", "content", "source", "gazetteer.json");

const APPROVED_AT = "2026-08-23T16:00:00.000Z";
const NOTES = "Wave 3 ('roll toward 1000') batch: sourcing agent left this candidate stalled/researched-only; the curator personally downloaded, visually inspected, and cropped it before approval.";

const SEED = [
  { id:"commons-chicago-columbian-exposition-1893", localName:"chicago-columbian-exposition-1893.jpg", workType:"drawing", title:"Grand Bird's-eye View of the Grounds and Buildings of the Great Columbian Exposition at Chicago, Illinois, 1892-3", artistOrCreator:"Currier & Ives", depictedDate:{minYear:1892,maxYear:1893}, creationDate:{minYear:1893,maxYear:1893}, placeId:"chicago-us", region:"North America", difficulty:3, landmarkCategory:"exposition", tags:["worlds-fair","lagoon","exposition-buildings"], era:"1890s", license:"Public Domain (CC-PD-Mark, pre-1931)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Grand_birds-eye_view_of_the_grounds_and_buildings_of_the_great_Columbian_exposition_at_Chicago,_Illinois,_1892-3...LCCN2001700243.jpg", creditText:"Currier & Ives", context:"A bird's-eye chromolithograph of the 1893 World's Columbian Exposition grounds in Chicago.", curationNotes:"Cropped to remove a printed title band and building-name legend below the illustration, in a separate white margin." },
  { id:"commons-boston-waterfront-1906", localName:"boston-waterfront-1906.jpg", workType:"photo", title:"Birdseye view of waterfront, Boston, Mass.", artistOrCreator:null, depictedDate:{minYear:1906,maxYear:1906}, creationDate:{minYear:1906,maxYear:1906}, placeId:"boston-us", region:"North America", difficulty:3, landmarkCategory:"waterfront", tags:["harbor","wharves","steamships"], era:"1900s", license:"Public Domain Mark 1.0 (pre-1931)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Bird%27s-eye_view_of_waterfront,_Boston,_Mass._LCCN2005691058.jpg", creditText:"Detroit Publishing Co.", context:"Boston Harbor's wharves and piers crowded with sailing ships and steamers, 1906.", curationNotes:"Cropped to remove a printed caption ('Birdseye view of Water Front, Boston, Mass.') at the bottom of the photo print itself." },
  { id:"commons-philadelphia-independence-hall-1900", localName:"philadelphia-independence-hall-1900.jpg", workType:"photo", title:"Independence Hall, Philadelphia", artistOrCreator:null, depictedDate:{minYear:1900,maxYear:1900}, creationDate:{minYear:1900,maxYear:1900}, placeId:"philadelphia-us", region:"North America", difficulty:2, landmarkCategory:"civic-building", tags:["independence-hall","clock-tower","trees"], era:"1900s", license:"Public Domain (PD-1923, pre-1931)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Independence_Hall,_Philadelphia-LCCN2008679522.jpg", creditText:"Detroit Photographic Co.", context:"Independence Hall in Philadelphia, seen through park trees, hand-colored photochrom, 1900.", curationNotes:"Cropped to remove a printed caption ('...INDEPENDENCE HALL. PHILADELPHIA.') at the bottom of the photo card, within the black mount border." },
  { id:"commons-san-francisco-market-street-1885", localName:"san-francisco-market-street-1885.jpg", workType:"photo", title:"Market St. - Taber Photo., San Francisco", artistOrCreator:"Isaiah West Taber", depictedDate:{minYear:1885,maxYear:1885}, creationDate:{minYear:1885,maxYear:1885}, placeId:"san-francisco-us", region:"North America", difficulty:3, landmarkCategory:"street", tags:["market-street","cable-cars","shopfronts"], era:"1880s", license:"Public Domain (pre-1931)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Market_St._-_Taber_Photo.,_San_Francisco._LCCN2015651519.jpg", creditText:"I.W. Taber", context:"A bird's-eye view of Market Street in San Francisco, with cable railroads and shopfronts, 1885.", curationNotes:"Cropped to remove a printed caption strip ('B2146 Market St. / Taber Photo., San Francisco.') in a separate mount border below the photo." },
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
