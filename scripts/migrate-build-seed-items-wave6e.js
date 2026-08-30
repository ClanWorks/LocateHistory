// Wave 6e: Stuttgart, Dusseldorf (Central Europe batch continued).
// Run once, from the repo root: node scripts/migrate-build-seed-items-wave6e.js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const itemsPath = path.join(__dirname, "..", "content", "source", "items.json");
const gazetteerPath = path.join(__dirname, "..", "content", "source", "gazetteer.json");

const APPROVED_AT = "2026-08-25T11:00:00.000Z";
const NOTES = "Wave 6 (backlog finishing pass, continued) batch: the curator personally downloaded (using the curl -4 IPv4 workaround), visually inspected, and (where noted) cropped this image before approval.";

const SEED = [
  { id:"commons-stuttgart-schlossplatz-1880", localName:"stuttgart-schlossplatz-1880.jpg", workType:"photo", title:"Schlossplatz, Stuttgart", artistOrCreator:null, depictedDate:{minYear:1870,maxYear:1890}, creationDate:{minYear:1870,maxYear:1890}, placeId:"stuttgart-de", region:"Central Europe", difficulty:3, landmarkCategory:"plaza", tags:["fountain","jubilee-column","bandstand"], era:"1880s", license:"CC0 (Rijksmuseum)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Gezicht_op_de_Schlossplatz_te_Stuttgart,_RP-F-F06179.jpg", creditText:"Rijksmuseum", context:"The Schlossplatz in Stuttgart with its Jubilee Column and fountain, seen across the park, 1870s-90s stereograph.", curationNotes:"Original was a stereograph card with a handwritten caption ('Schlossplatz, Stuttgart') in the mount margin to the left; cropped to just the left photo panel." },
  { id:"commons-dusseldorf-flingerthor-1830", localName:"dusseldorf-flingerthor-villa-1830.jpg", workType:"drawing", title:"Ansicht Düsseldorf, Flingerthor", artistOrCreator:null, depictedDate:{minYear:1820,maxYear:1840}, creationDate:{minYear:1820,maxYear:1840}, placeId:"dusseldorf-de", region:"Central Europe", difficulty:5, landmarkCategory:"park-villa", tags:["villa","poplar-avenue","pond"], era:"1830s", license:"Public Domain Mark 1.0", sourceUrl:"https://commons.wikimedia.org/wiki/File:Ansicht_D%C3%BCsseldorf,_Flingerthor.jpg", creditText:"Wikimedia Commons", context:"A villa and poplar-lined avenue near the Flingerthor in Düsseldorf, early 19th-century engraving." },
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
