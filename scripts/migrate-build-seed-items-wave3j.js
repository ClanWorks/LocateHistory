// Wave 3j: North America depth batch 3, finished centrally by the curator from the
// North America sourcing agent's researched backlog (2026-08-23).
// Ottawa, Cincinnati, Charleston, Savannah, St. Louis.
//
// Run once, from the repo root: node scripts/migrate-build-seed-items-wave3j.js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const itemsPath = path.join(__dirname, "..", "content", "source", "items.json");
const gazetteerPath = path.join(__dirname, "..", "content", "source", "gazetteer.json");

const APPROVED_AT = "2026-08-23T17:00:00.000Z";
const NOTES = "Wave 3 ('roll toward 1000') batch: sourcing agent left this candidate stalled/researched-only; the curator personally downloaded, visually inspected, and cropped it before approval.";

const SEED = [
  { id:"commons-ottawa-parliament-major-hill-1901", localName:"ottawa-parliament-major-hill-park-1901.jpg", workType:"photo", title:"Parliament buildings from Major Hill Park, Ottawa, Canada, 1901", artistOrCreator:null, depictedDate:{minYear:1901,maxYear:1901}, creationDate:{minYear:1901,maxYear:1901}, placeId:"ottawa-ca", region:"North America", difficulty:2, landmarkCategory:"government-building", tags:["parliament","river-ottawa","pre-1916-fire"], era:"1900s", license:"Public Domain (Canada / PD-1923)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Parliament_buildings_from_Major_Hill_Park,_Ottawa,_Canada,_1901.jpg", creditText:"Detroit Publishing Co.", context:"The original (pre-1916-fire) Parliament Buildings in Ottawa, seen from Major's Hill Park across the river, 1901.", curationNotes:"Cropped to remove a printed caption ('PARLIAMENT BUILDINGS FROM MAJOR HILL PARK, OTTAWA') at the bottom of the photochrom print itself." },
  { id:"commons-cincinnati-panoramic-1900", localName:"cincinnati-panoramic-view-1900.jpg", workType:"drawing", title:"Panoramic View, City of Cincinnati, U.S.A. 1900", artistOrCreator:"J.J. Stoner", depictedDate:{minYear:1900,maxYear:1900}, creationDate:{minYear:1900,maxYear:1900}, placeId:"cincinnati-us", region:"North America", difficulty:3, landmarkCategory:"panorama", tags:["bird's-eye-view","ohio-river","bridges"], era:"1900s", license:"Public Domain (PD-1923)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Cincinnati-aerial-view-1900.jpg", creditText:"John L. Trout / Henderson Litho. Co.", context:"A panoramic bird's-eye view of Cincinnati and the Ohio River, 1900.", curationNotes:"Cropped to remove a printed title ('PANORAMIC VIEW / CITY OF CINCINNATI, U.S.A. 1900.') in a separate white margin below the illustration." },
  { id:"commons-charleston-east-battery-1902", localName:"charleston-east-battery-1902.jpg", workType:"photo", title:"East Battery, Charleston (Apr 5 1902)", artistOrCreator:null, depictedDate:{minYear:1902,maxYear:1902}, creationDate:{minYear:1902,maxYear:1902}, placeId:"charleston-us", region:"North America", difficulty:3, landmarkCategory:"street", tags:["antebellum-mansions","palmettos","seawall"], era:"1900s", license:"Public Domain (PD-1923)", sourceUrl:"https://commons.wikimedia.org/wiki/File:East_Battery_(Apr_5_1902).jpg", creditText:"Wikimedia Commons", context:"Antebellum mansions along the East Battery seawall in Charleston, 1902.", curationNotes:"Cropped to remove a handwritten caption ('4/5/02 Battery Park.') in a separate album-page margin below the photo." },
  { id:"commons-savannah-bull-street-1901", localName:"savannah-bull-street-1901.jpg", workType:"photo", title:"Bull Street, Savannah, GA, 1901", artistOrCreator:null, depictedDate:{minYear:1901,maxYear:1901}, creationDate:{minYear:1901,maxYear:1901}, placeId:"savannah-us", region:"North America", difficulty:3, landmarkCategory:"street", tags:["monument-square","courthouse","church-spires"], era:"1900s", license:"Public Domain (PD-1923)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Detroit_Photographic_Company_(0324)_-_Bull_Street,_Savannah,_GA_1901.jpg", creditText:"Detroit Photographic Co.", context:"Bull Street in Savannah toward Johnson/Wright Square, viewed from a rooftop, 1901.", curationNotes:"Cropped the right edge of the frame to remove a legible 'SAVANNAH STEAM LAUNDRY' rooftop sign that directly named the city; a solid-color patch over just the sign was tried first and rejected as visually obtrusive, per this project's established preference for cropping over redaction." },
  { id:"commons-st-louis-worlds-fair-1904", localName:"st-louis-worlds-fair-1904.jpg", workType:"drawing", title:"World's Fair, St. Louis, 1904", artistOrCreator:"Gray Lithographic Company", depictedDate:{minYear:1904,maxYear:1904}, creationDate:{minYear:1904,maxYear:1904}, placeId:"st-louis-us", region:"North America", difficulty:3, landmarkCategory:"exposition", tags:["worlds-fair","fountains","exposition-palaces"], era:"1900s", license:"Public Domain (PD-1923)", sourceUrl:"https://commons.wikimedia.org/wiki/File:%22World%27s_Fair,_St._Louis,_1904.%22_(Birdseye_view_of_the_1904_Worlds_Fair).jpg", creditText:"Gray Lithographic Company", context:"A bird's-eye chromolithograph of the 1904 World's Fair grounds in St. Louis.", curationNotes:"Cropped to remove a printed title, subtitle, and a table comparing prior world's fairs, all in a separate white margin below the illustration." },
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
