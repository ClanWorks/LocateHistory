// Wave 6f: Essen, Bremen, Hanover, Rostock, Lviv — completes the entire 16-city
// Central/Eastern Europe backlog from Wave 5's research.
// Run once, from the repo root: node scripts/migrate-build-seed-items-wave6f.js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const itemsPath = path.join(__dirname, "..", "content", "source", "items.json");
const gazetteerPath = path.join(__dirname, "..", "content", "source", "gazetteer.json");

const APPROVED_AT = "2026-08-25T11:30:00.000Z";
const NOTES = "Wave 6 (backlog finishing pass, continued) batch: the curator personally downloaded (using the curl -4 IPv4 workaround), visually inspected, and (where noted) cropped this image before approval.";

const SEED = [
  { id:"commons-essen-kettwiger-strasse-1895", localName:"essen-kettwiger-strasse-1895.jpg", workType:"photo", title:"Essen, Kettwiger Straße, 1895", artistOrCreator:null, depictedDate:{minYear:1895,maxYear:1895}, creationDate:{minYear:1895,maxYear:1895}, placeId:"essen-de", region:"Central Europe", difficulty:4, landmarkCategory:"street", tags:["half-timbered-houses","shopfronts","pedestrians"], era:"1890s", license:"Public Domain", sourceUrl:"https://commons.wikimedia.org/wiki/File:Essen,_Kettwiger_Stra%C3%9Fe,_1895.jpg", creditText:"Wikimedia Commons", context:"Kettwiger Straße in Essen with half-timbered shopfronts, 1895." },
  { id:"commons-bremen-neue-borse-1890s", localName:"bremen-neue-borse-1890s.jpg", workType:"photo", title:"Neue Börse, Bremen", artistOrCreator:null, depictedDate:{minYear:1890,maxYear:1899}, creationDate:{minYear:1890,maxYear:1899}, placeId:"bremen-de", region:"Central Europe", difficulty:3, landmarkCategory:"civic-building", tags:["gothic-revival","clock","stone-steps"], era:"1890s", license:"Public Domain Mark 1.0", sourceUrl:"https://commons.wikimedia.org/wiki/File:Neue_B%C3%B6rse_-_Bremen_-_19th_century.jpg", creditText:"Wikimedia Commons", context:"The Neue Börse (New Stock Exchange) building in Bremen, 19th century.", curationNotes:"Cropped to remove a tram in the bottom-left corner whose side-panel lettering was too blurred to confirm as non-identifying." },
  { id:"commons-hanover-friedrichstrasse-1860", localName:"hanover-friedrichstrasse-1860.jpg", workType:"drawing", title:"Hannover, Friedrichstraße", artistOrCreator:"Wilhelm Kretschmer", depictedDate:{minYear:1855,maxYear:1865}, creationDate:{minYear:1855,maxYear:1865}, placeId:"hanover-de", region:"Central Europe", difficulty:3, landmarkCategory:"street", tags:["carriages","tree-lined-street","balcony"], era:"1860s", license:"Public Domain (author d.1897)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Wilhelm_Kretschmer_Hannover_Friedrichstra%C3%9Fe.jpg", creditText:"Wilhelm Kretschmer", context:"Friedrichstraße in Hanover with horse-drawn carriages, mid-19th-century colored lithograph." },
  { id:"commons-rostock-gertrudenplatz-1809", localName:"rostock-gertrudenplatz-view-1809.jpg", workType:"painting", title:"Ansicht Rostocks vom Gertrudenplatz aus", artistOrCreator:"Kersting", depictedDate:{minYear:1809,maxYear:1809}, creationDate:{minYear:1809,maxYear:1809}, placeId:"rostock-de", region:"Central Europe", difficulty:3, landmarkCategory:"skyline", tags:["half-timbered-cottages","church-spires","pond"], era:"1800s", license:"Public Domain", sourceUrl:"https://commons.wikimedia.org/wiki/File:Kersting_-_Ansicht_Rostocks_vom_Gertrudenplatz_aus_1809.jpg", creditText:"Kersting", context:"A view of Rostock's church spires from Gertrudenplatz, with half-timbered cottages in the foreground, 1809 painting." },
  { id:"commons-lviv-market-square-1900", localName:"lviv-market-square-1900.jpg", workType:"photo", title:"Lwów, Rynek (Market Square)", artistOrCreator:null, depictedDate:{minYear:1895,maxYear:1905}, creationDate:{minYear:1895,maxYear:1905}, placeId:"lviv-ua", region:"Eastern Europe", difficulty:3, landmarkCategory:"market-square", tags:["market-vendors","shopfronts","cobblestones"], era:"1900s", license:"Public Domain", sourceUrl:"https://commons.wikimedia.org/wiki/File:Lw%C3%B3w,_Rynek_-_Lviv,_Market_Square_(01).jpg", creditText:"Wikimedia Commons", context:"A market-day crowd in Lviv's Rynek (Market Square), c.1895-1905." },
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
