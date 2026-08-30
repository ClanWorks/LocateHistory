// Wave 5c: Central/Eastern Europe batch 1.
// Run once, from the repo root: node scripts/migrate-build-seed-items-wave5c.js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const itemsPath = path.join(__dirname, "..", "content", "source", "items.json");
const gazetteerPath = path.join(__dirname, "..", "content", "source", "gazetteer.json");

const APPROVED_AT = "2026-08-24T13:00:00.000Z";
const NOTES = "Wave 5 (backlog finishing pass) batch: sourcing agent left this candidate stalled; the curator personally downloaded (using the curl -4 IPv4 workaround), visually inspected, and (where noted) cropped it before approval.";

const SEED = [
  { id:"commons-poznan-alter-markt-1915", localName:"poznan-alter-markt-1915.jpg", workType:"photo", title:"Posen - Alter Markt", artistOrCreator:null, depictedDate:{minYear:1910,maxYear:1925}, creationDate:{minYear:1910,maxYear:1925}, placeId:"poznan-pl", region:"Central Europe", difficulty:3, landmarkCategory:"market-square", tags:["fountain-statue","shopfronts","crowd"], era:"1910s", license:"Public Domain (life+70)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Posen_-_Alter_Markt._1910-1925_(71295078).jpg", creditText:"Wikimedia Commons", context:"The Old Market square in Poznań, with a fountain and busy shopfronts, 1910s-20s postcard.", curationNotes:"Cropped to remove a printed title ('Posen Alter Markt.') stamped directly into the sky at the top of the photo." },
  { id:"commons-plzen-schafarik-promenade", localName:"plzen-schafarik-promenade-1910.jpg", workType:"photo", title:"Pilsen, Schafařik-Promenade", artistOrCreator:null, depictedDate:{minYear:1900,maxYear:1915}, creationDate:{minYear:1900,maxYear:1915}, placeId:"plzen-cz", region:"Central Europe", difficulty:3, landmarkCategory:"river-promenade", tags:["canal","tree-lined","domed-building"], era:"1900s", license:"Public Domain / GFDL", sourceUrl:"https://commons.wikimedia.org/wiki/File:Pilsen_(CZ),_Tschechien_-_Schafafik-Promenade_(Zeno_Ansichtskarten).jpg", creditText:"Zeno Ansichtskarten", context:"The Schafařik Promenade along a canal in Plzeň, with a domed building in the background.", curationNotes:"Cropped to remove a printed title ('PILSEN / Schafařik-Promenade') stamped directly into the sky at the top of the photo." },
  { id:"commons-kosice-fo-utca-1939", localName:"kosice-fo-utca-1939.jpg", workType:"photo", title:"Kassa 1939, Fő utca", artistOrCreator:null, depictedDate:{minYear:1939,maxYear:1939}, creationDate:{minYear:1939,maxYear:1939}, placeId:"kosice-sk", region:"Central Europe", difficulty:3, landmarkCategory:"street", tags:["pedestrian-street","shopfronts","tram"], era:"1930s", license:"CC BY-SA 3.0 (Fortepan)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Kassa_1939,_F%C5%91_utca._Fortepan_71228.jpg", creditText:"Fortepan", context:"The main pedestrian street in Košice, 1939." },
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
