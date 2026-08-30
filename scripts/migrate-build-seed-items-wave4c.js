// Wave 4c: Dalian, Qingdao (East Asia gap-closers), Charlotte Amalie (Caribbean
// gap-closer), from the second "roll toward 1000" push (2026-08-24).
// Run once, from the repo root: node scripts/migrate-build-seed-items-wave4c.js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const itemsPath = path.join(__dirname, "..", "content", "source", "items.json");
const gazetteerPath = path.join(__dirname, "..", "content", "source", "gazetteer.json");

const APPROVED_AT = "2026-08-24T10:00:00.000Z";
const NOTES = "Wave 4 (second 'roll toward 1000' push) batch, sourced by a background research agent and independently re-verified (sourceUrl/license re-checked against the live Commons page, image personally re-viewed) before approval.";

const SEED = [
  { id:"commons-dalian-dalny-1905", localName:"dalian-dalny-city-view-1905.jpg", workType:"photo", title:"Dalny, 4 January 1905", artistOrCreator:"Ernesto Burzagli", depictedDate:{minYear:1905,maxYear:1905}, creationDate:{minYear:1905,maxYear:1905}, placeId:"dalian-cn", region:"East Asia", difficulty:3, landmarkCategory:"colonial-building", tags:["administration-building","russo-japanese-war"], era:"1900s", license:"Public Domain", sourceUrl:"https://commons.wikimedia.org/wiki/File:Dalny2.jpg", creditText:"Ernesto Burzagli", context:"The city of Dalny (present-day Dalian) the day after the Japanese capture of Port Arthur, 1905." },
  { id:"commons-qingdao-panorama-1900", localName:"qingdao-panorama-1900.jpg", workType:"photo", title:"Qingdao, circa 1900", artistOrCreator:null, depictedDate:{minYear:1900,maxYear:1900}, creationDate:{minYear:1900,maxYear:1900}, placeId:"qingdao-cn", region:"East Asia", difficulty:3, landmarkCategory:"panorama", tags:["harbor","german-colonial","hillside-view"], era:"1900s", license:"Public Domain (CC-PD-Mark / PD-1923)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Qingdao_around_1900.jpg", creditText:"Wikimedia Commons", context:"A panoramic view of German-colonial Qingdao (Tsingtau) from a hillside, c.1900." },
  { id:"commons-charlotte-amalie-harbor-1893", localName:"charlotte-amalie-harbor-view-1893.jpg", workType:"photo", title:"St. Thomas, 1893", artistOrCreator:null, depictedDate:{minYear:1893,maxYear:1893}, creationDate:{minYear:1893,maxYear:1893}, placeId:"charlotte-amalie-vi", region:"Caribbean", difficulty:3, landmarkCategory:"harbor-town", tags:["harbour","sailing-ships","hillside-town"], era:"1890s", license:"Public Domain Mark 1.0 (pre-1931)", sourceUrl:"https://commons.wikimedia.org/wiki/File:ST._THOMAS_(1893).jpg", creditText:"Charles Augustus Stoddard, Cruising among the Caribbees (1893)", context:"An elevated harbor view of Charlotte Amalie, Danish West Indies, with numerous sailing vessels moored offshore, 1893.", curationNotes:"Cropped to remove a printed caption ('ST. THOMAS') in a separate margin below the photo." },
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
