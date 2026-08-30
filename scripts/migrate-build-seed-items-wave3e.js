// Wave 3e: Belize City, Managua, Baltimore gap-closers, finished centrally by the
// curator after their sourcing agents left them stalled/rejected-with-alternatives
// (2026-08-23). Every item downloaded and personally visually inspected directly.
//
// Run once, from the repo root: node scripts/migrate-build-seed-items-wave3e.js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const itemsPath = path.join(__dirname, "..", "content", "source", "items.json");
const gazetteerPath = path.join(__dirname, "..", "content", "source", "gazetteer.json");

const APPROVED_AT = "2026-08-23T14:30:00.000Z";
const NOTES = "Wave 3 ('roll toward 1000') batch: sourcing agent left this candidate stalled or found only a lower-priority alternative; the curator personally downloaded, visually inspected, and (where noted) cropped it before approval.";

const SEED = [
  { id:"commons-belize-city-street-1900", localName:"belize-city-street-1900.jpg", workType:"painting", title:"Street in Belize - British Honduras", artistOrCreator:null, depictedDate:{minYear:1900,maxYear:1900}, creationDate:{minYear:1900,maxYear:1900}, placeId:"belize-city-bz", region:"Central America", difficulty:3, landmarkCategory:"street-scene", tags:["palm-trees","colonial-houses","watercolor"], era:"1900s", license:"Public Domain (author d.1913, pre-1931)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Street_in_Belize_-_British_Honduras.jpg", creditText:"Henry Robertson Blaney, The Golden Caribbean (1900)", context:"A watercolor of a residential street in Belize City, British Honduras, 1900.", curationNotes:"Cropped to the painting itself, removing the surrounding book-page margin and a printed caption below." },
  { id:"commons-managua-marine-airbase-1930", localName:"managua-marine-airbase-1930.jpg", workType:"photo", title:"US Marines air base at Managua", artistOrCreator:null, depictedDate:{minYear:1930,maxYear:1930}, creationDate:{minYear:1930,maxYear:1930}, placeId:"managua-ni", region:"Central America", difficulty:5, landmarkCategory:"airfield", tags:["aerial-view","airfield","lake"], era:"1930s", license:"Public Domain (US federal government work)", sourceUrl:"https://commons.wikimedia.org/wiki/File:US_Marines_air_base_at_Managua.jpg", creditText:"U.S. Marine Corps", context:"An aerial view of the U.S. Marines air base at Managua during the American occupation of Nicaragua, c.1930." },
  { id:"commons-baltimore-hurst-building-1904", localName:"baltimore-hurst-building-1904.jpg", workType:"drawing", title:"The John E. Hurst & Co. Building, Baltimore", artistOrCreator:null, depictedDate:{minYear:1904,maxYear:1904}, creationDate:{minYear:1904,maxYear:1904}, placeId:"baltimore-us", region:"North America", difficulty:4, landmarkCategory:"commercial-building", tags:["newspaper-illustration","great-baltimore-fire"], era:"1900s", license:"Public Domain (published 1904, pre-1931)", sourceUrl:"https://commons.wikimedia.org/wiki/File:John_E._Hurst_Building,_Baltimore.jpg", creditText:"Tacoma Times, Feb. 16, 1904", context:"The John E. Hurst & Co. Building in Baltimore, where the Great Baltimore Fire of 1904 originated, in a contemporary newspaper illustration.", curationNotes:"Cropped to inside the illustration's own frame border, removing a printed caption below it." },
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
