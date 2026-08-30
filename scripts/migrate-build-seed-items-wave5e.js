// Wave 5e: Nuremberg, Leipzig (Central Europe batch continued).
// Run once, from the repo root: node scripts/migrate-build-seed-items-wave5e.js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const itemsPath = path.join(__dirname, "..", "content", "source", "items.json");
const gazetteerPath = path.join(__dirname, "..", "content", "source", "gazetteer.json");

const APPROVED_AT = "2026-08-24T14:00:00.000Z";
const NOTES = "Wave 5 (backlog finishing pass) batch: the curator personally sourced, downloaded (using the curl -4 IPv4 workaround), visually inspected, and (where noted) cropped this image before approval.";

const SEED = [
  { id:"commons-nuremberg-hauptmarkt-1890", localName:"nuremberg-hauptmarkt-1890.jpg", workType:"photo", title:"Hauptmarkt vor 1895", artistOrCreator:null, depictedDate:{minYear:1890,maxYear:1895}, creationDate:{minYear:1890,maxYear:1895}, placeId:"nuremberg-de", region:"Central Europe", difficulty:2, landmarkCategory:"market-square", tags:["frauenkirche","market-day","gothic-spires"], era:"1890s", license:"Public Domain (LOC, CC-PD-Mark)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Hauptmarkt_vor_1895.jpg", creditText:"Wikimedia Commons", context:"Market day on the Hauptmarkt in Nuremberg, with Gothic church spires visible behind, before 1895." },
  { id:"commons-leipzig-riverview-1850", localName:"leipzig-riverview-1850.jpg", workType:"drawing", title:"Leipzig", artistOrCreator:"L. Rohbock / Joh. Poppel", depictedDate:{minYear:1850,maxYear:1850}, creationDate:{minYear:1850,maxYear:1850}, placeId:"leipzig-de", region:"Central Europe", difficulty:3, landmarkCategory:"skyline", tags:["river","fishermen","church-spires"], era:"1850s", license:"Public Domain (PD-old)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Leipzig_Rohbock_Poppel.jpg", creditText:"L. Rohbock / Joh. Poppel", context:"Leipzig's skyline seen across a river, with fishermen in the foreground, 1850 steel engraving.", curationNotes:"Cropped to remove a printed title ('LEIPZIG.') and publisher credit in a separate white margin below the illustration." },
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
