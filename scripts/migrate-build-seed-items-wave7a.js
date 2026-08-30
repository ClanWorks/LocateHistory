// Wave 7a: Southern Africa batch that was fully vetted much earlier this session
// (Pretoria, Bloemfontein, Port Elizabeth, Maseru, Port Louis, a 2nd Cape Town
// image) but never actually got its integration script run. Recovered by finding
// these files as "orphans" in content/originals/ not referenced by any item.
// Run once, from the repo root: node scripts/migrate-build-seed-items-wave7a.js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const itemsPath = path.join(__dirname, "..", "content", "source", "items.json");
const gazetteerPath = path.join(__dirname, "..", "content", "source", "gazetteer.json");

const APPROVED_AT = "2026-08-25T12:00:00.000Z";
const NOTES = "Sourced and personally spoiler-checked earlier this session; recovered and integrated in Wave 7 after being found as an orphaned file in content/originals/ with no items.json entry.";

const SEED = [
  { id:"commons-pretoria-kerkstraat-1890s", localName:"pretoria-kerkstraat-street-1890s.jpg", workType:"photo", title:"Kerkstraat, Pretoria, 1890s", artistOrCreator:null, depictedDate:{minYear:1890,maxYear:1899}, creationDate:{minYear:1890,maxYear:1899}, placeId:"pretoria-za", region:"Southern Africa", difficulty:3, landmarkCategory:"street-scene", tags:["shopfronts","church-spire","victorian-architecture"], era:"1890s", license:"Public Domain Mark 1.0 (PD-old-70-expired / PD South-Africa)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Kerkstraat,_Pretoria_1890s.jpg", creditText:"Wikimedia Commons", context:"Church Street (Kerkstraat), Pretoria, a busy commercial street with ornate Victorian-era shopfronts, 1890s." },
  { id:"commons-bloemfontein-railway-1900", localName:"bloemfontein-railway-station-1900.jpg", workType:"photo", title:"Bloemfontein Railway Station, c.1900", artistOrCreator:null, depictedDate:{minYear:1900,maxYear:1900}, creationDate:{minYear:1900,maxYear:1900}, placeId:"bloemfontein-za", region:"Southern Africa", difficulty:4, landmarkCategory:"railway-station", tags:["sandstone-construction","anglo-boer-war","tents"], era:"1900s", license:"Public Domain Mark 1.0 (PD-old-70-expired / PD South-Africa)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Historical_Bloemfontein_railway_station.jpg", creditText:"Wikimedia Commons", context:"Bloemfontein's sandstone railway station building, c.1900, Anglo-Boer War era with tents and a horse-cart in the foreground." },
  { id:"commons-port-elizabeth-tram-1900", localName:"port-elizabeth-double-decker-tram-1900.jpg", workType:"photo", title:"Port Elizabeth double-decker tram, c.1900", artistOrCreator:null, depictedDate:{minYear:1900,maxYear:1900}, creationDate:{minYear:1900,maxYear:1900}, placeId:"port-elizabeth-za", region:"Southern Africa", difficulty:4, landmarkCategory:"street-scene", tags:["electric-tram","arcaded-facade","advertisement"], era:"1900s", license:"Public Domain (South African Copyright Act No. 98 of 1978)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Port_Elizabeth_tram,_double-decker_-_ca._1900.jpg", creditText:"Wikimedia Commons", context:"A Port Elizabeth double-decker electric tram on Main Street with a Victorian arcaded building facade, c.1900." },
  { id:"commons-maseru-basutoland-1887", localName:"maseru-basutoland-village-1887.jpg", workType:"drawing", title:"Maseru, Basutoland, 1887", artistOrCreator:null, depictedDate:{minYear:1887,maxYear:1887}, creationDate:{minYear:1887,maxYear:1887}, placeId:"maseru-ls", region:"Southern Africa", difficulty:5, landmarkCategory:"landscape", tags:["hillside-view","marching-column","colonial-outpost"], era:"1880s", license:"Public Domain Mark 1.0 (PD-old-70-expired)", sourceUrl:"https://commons.wikimedia.org/wiki/File:IY188_pg389_MASERU,_BASUTOLAND.jpg", creditText:"British Library", context:"A hillside view over the small colonial outpost of Maseru, Basutoland, with a marching column and scattered homesteads, 1887 engraving.", curationNotes:"Cropped to remove a book-chapter header and a bold caption ('MASERU, BASUTOLAND') in the margin below the illustration's border." },
  { id:"commons-port-louis-harbour-1835", localName:"port-louis-mauritius-harbour-1835.jpg", workType:"drawing", title:"Port-Louis (Maurice), 1835", artistOrCreator:"Cyrille Laplace", depictedDate:{minYear:1835,maxYear:1835}, creationDate:{minYear:1835,maxYear:1835}, placeId:"port-louis-mu", region:"East Africa", difficulty:3, landmarkCategory:"harbour", tags:["tall-ships","hand-colored-engraving","waterfront"], era:"1830s", license:"Public Domain (PD-old)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Port-Louis_(Maurice)_1835.jpg", creditText:"Cyrille Laplace", context:"A hand-colored 1835 engraving of the Port-Louis harbour, Mauritius, with tall ships and dockworkers on the waterfront." },
  { id:"commons-cape-town-blaauwberg-1850", localName:"cape-town-table-bay-blaauwberg-1850.jpg", workType:"painting", title:"Table Bay from Blaauwberg", artistOrCreator:"Thomas William Bowler", depictedDate:{minYear:1850,maxYear:1850}, creationDate:{minYear:1850,maxYear:1850}, placeId:"cape-town-za", region:"Southern Africa", difficulty:2, landmarkCategory:"landmark-view", tags:["table-mountain","lions-head","fishing-boats"], era:"1850s", license:"CC0 1.0", sourceUrl:"https://commons.wikimedia.org/wiki/File:Thomas_William_Bowler-Table_Bay_from_Blaauwberg-0677.jpg", creditText:"Thomas William Bowler", context:"Table Mountain and Lion's Head seen across Table Bay, with fishing figures on the shore, c.1850 oil painting.", curationNotes:"Cropped tightly to the artwork itself, removing a museum wall placard and artist nameplate visible in the original photo of the framed painting." },
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
