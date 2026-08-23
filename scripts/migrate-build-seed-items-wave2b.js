// Wave 2b: 3 items approved in Wave 2 batches but accidentally dropped
// during transcription of the large SEED script (caught by a post-hoc
// audit of content/originals/ against items.json). A 4th omission,
// Bilbao, could not be re-matched to a traceable Commons source on
// re-check and was dropped rather than guessed — see CURATION_NOTES.md.
//
// Run once, from the repo root: node scripts/migrate-build-seed-items-wave2b.js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const itemsPath = path.join(__dirname, "..", "content", "source", "items.json");
const gazetteerPath = path.join(__dirname, "..", "content", "source", "gazetteer.json");

const APPROVED_AT = "2026-08-23T00:00:00.000Z";
const NOTES = "Wave 2 item approved but accidentally omitted from the main wave2 script; added after a post-hoc audit of content/originals/ against items.json caught the gap.";

const SEED = [
  { id:"commons-riyadh-margab-fort-1939", localName:"riyadh-margab-fort-1939.jpg", workType:"photo", title:"Margab Fort, Riyadh", artistOrCreator:null, depictedDate:{minYear:1939,maxYear:1939}, creationDate:{minYear:1939,maxYear:1939}, placeId:"riyadh-sa", region:"Middle East", difficulty:4, landmarkCategory:"fort", tags:["fort","mudbrick","towers"], era:"1930s", license:"Public Domain", sourceUrl:"https://commons.wikimedia.org/wiki/File:Margab_Fort_Riyadh,_1939.jpg", creditText:"Wikimedia Commons", context:"The mudbrick towers of Margab Fort in early Riyadh, before the city's mid-20th-century growth." },
  { id:"commons-aarhus-gronnegade-1898", localName:"aarhus-gronnegade-street-1898.jpg", workType:"photo", title:"1898 Grønnegade", artistOrCreator:null, depictedDate:{minYear:1898,maxYear:1898}, creationDate:{minYear:1898,maxYear:1898}, placeId:"aarhus-dk", region:"Northern Europe", difficulty:3, landmarkCategory:"street", tags:["cobblestone","old-town","long-exposure"], era:"1890s", license:"Public Domain (life+70 expired)", sourceUrl:"https://commons.wikimedia.org/wiki/File:1898_Gr%C3%B8nnegade.jpg", creditText:"Wikimedia Commons", context:"A cobblestone street in old Aarhus, with period buildings and figures blurred by the long exposure." },
  { id:"commons-buenos-aires-vista-bossi-1859", localName:"buenos-aires-vista-bossi-1859.jpg", workType:"painting", title:"Vista de Buenos Aires, según Bossi", artistOrCreator:"Bartolomé Bossi", depictedDate:{minYear:1859,maxYear:1859}, creationDate:{minYear:1859,maxYear:1859}, placeId:"buenos-aires-ar", region:"South America", difficulty:3, landmarkCategory:"harbour", tags:["harbour","steamships","waterfront"], era:"1850s", license:"Public Domain (CC-PD-Mark)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Vista_de_Buenos_Aires,_seg%C3%BAn_Bossi.tif", creditText:"Bartolomé Bossi", context:"A hand-colored 1859 painting of the Buenos Aires waterfront, crowded with paddle steamers and sailing ships." },
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
