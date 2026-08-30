// Wave 5b: South America depth batch 2 (completes the South America backlog).
// Run once, from the repo root: node scripts/migrate-build-seed-items-wave5b.js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const itemsPath = path.join(__dirname, "..", "content", "source", "items.json");
const gazetteerPath = path.join(__dirname, "..", "content", "source", "gazetteer.json");

const APPROVED_AT = "2026-08-24T12:30:00.000Z";
const NOTES = "Wave 5 (backlog finishing pass) batch: sourcing agent left this candidate stalled; the curator personally downloaded (using the curl -4 IPv4 workaround), visually inspected, and (where noted) cropped it before approval.";

const SEED = [
  { id:"commons-lima-calle-mercaderes", localName:"lima-calle-mercaderes-1910.jpg", workType:"photo", title:"Lima (Perú). Calle de Mercaderes", artistOrCreator:"Courret Hermanos", depictedDate:{minYear:1901,maxYear:1901}, creationDate:{minYear:1901,maxYear:1901}, placeId:"lima-pe", region:"South America", difficulty:2, landmarkCategory:"street-scene", tags:["cathedral-dome","tram","carriages"], era:"1900s", license:"Public Domain (PD-1996 / PD-old)", sourceUrl:"https://commons.wikimedia.org/wiki/File:%22Calle_de_Mercaderes%22_photographed_by_Courret_Hermanos_in_Lima,_Peru.jpg", creditText:"Courret Hermanos", context:"Calle de Mercaderes in Lima, with a cathedral dome visible in the distance, 1901.", curationNotes:"Cropped to remove a printed title ('LIMA (Perú). Calle de Mercaderes.') stamped directly across the top of the photo itself." },
  { id:"commons-santiago-alameda-1863", localName:"santiago-alameda-night-1863.jpg", workType:"drawing", title:"Alameda de Santiago de Chile", artistOrCreator:null, depictedDate:{minYear:1863,maxYear:1863}, creationDate:{minYear:1863,maxYear:1863}, placeId:"santiago-cl", region:"South America", difficulty:3, landmarkCategory:"avenue", tags:["tree-lined-promenade","crowd","crescent-moon"], era:"1860s", license:"Public Domain (life+100)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Alameda_de_Santiago_de_Chile_1863.JPG", creditText:"Wikimedia Commons", context:"A crowded evening promenade along the Alameda in Santiago, 1863 lithograph." },
  { id:"commons-bogota-birdseye-1893", localName:"bogota-birdseye-view-1893.jpg", workType:"photo", title:"Bogotá, bird's-eye view", artistOrCreator:null, depictedDate:{minYear:1893,maxYear:1893}, creationDate:{minYear:1893,maxYear:1893}, placeId:"bogota-co", region:"South America", difficulty:3, landmarkCategory:"panorama", tags:["rooftops","bird's-eye-view"], era:"1890s", license:"Public Domain (pre-1931)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Bogota_Bird-eye_view,_1893.jpg", creditText:"Wikimedia Commons", context:"A bird's-eye view over the rooftops of Bogotá, 1893." },
  { id:"commons-sao-paulo-largo-rosario-1880", localName:"sao-paulo-largo-do-rosario-1880.jpg", workType:"painting", title:"Largo do Rosário, 1880", artistOrCreator:"José Wasth Rodrigues", depictedDate:{minYear:1880,maxYear:1880}, creationDate:{minYear:1920,maxYear:1920}, placeId:"sao-paulo-br", region:"South America", difficulty:3, landmarkCategory:"plaza", tags:["colonial-street","shopfronts","oil-painting"], era:"1880s", license:"CC BY-SA 4.0", sourceUrl:"https://commons.wikimedia.org/wiki/File:Jos%C3%A9_Wasth_Rodrigues_-_Largo_do_Ros%C3%A1rio,_1880,_Acervo_do_Museu_Paulista_da_USP.jpg", creditText:"José Wasth Rodrigues / Museu Paulista da USP", context:"Largo do Rosário in São Paulo, 1880, retrospective oil painting by José Wasth Rodrigues." },
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
