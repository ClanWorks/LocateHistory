// Wave 6a: major-capital depth batch, continuing from Wave 5's stalled backlog.
// Rome and Vienna third images.
// Run once, from the repo root: node scripts/migrate-build-seed-items-wave6a.js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const itemsPath = path.join(__dirname, "..", "content", "source", "items.json");
const gazetteerPath = path.join(__dirname, "..", "content", "source", "gazetteer.json");

const APPROVED_AT = "2026-08-25T09:00:00.000Z";
const NOTES = "Wave 6 (backlog finishing pass, continued) batch: the curator personally downloaded (using the curl -4 IPv4 workaround), visually inspected, and cropped this image before approval.";

const SEED = [
  { id:"commons-rome-colosseum-meta-sudans", localName:"rome-colosseum-meta-sudans-1890s.jpg", workType:"photo", title:"Colosseum and Meta Sudans, Rome, Italy", artistOrCreator:null, depictedDate:{minYear:1890,maxYear:1899}, creationDate:{minYear:1890,maxYear:1899}, placeId:"rome-it", region:"Southern Europe", difficulty:1, landmarkCategory:"ancient-ruins", tags:["colosseum","meta-sudans","arch-of-constantine"], era:"1890s", license:"Public Domain (pre-1931)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Colosseum_and_Meta_Sudans,_Rome,_Italy,_1890s.jpg", creditText:"Detroit Publishing Co. / Photoglob Zürich", context:"The Colosseum and the ruined Meta Sudans fountain in Rome, photochrom print, 1890s.", curationNotes:"Cropped to remove a printed title ('...MA COLOSSEO CON META SUDANTE.') baked into the dirt road at the bottom edge of the photo itself — the same Photoglob Zürich 'P.Z.' series pattern documented elsewhere in this project." },
  { id:"commons-vienna-schoenbrunn-park-1900", localName:"vienna-schoenbrunn-park-1900.jpg", workType:"photo", title:"Wien, Schönbrunn Park", artistOrCreator:null, depictedDate:{minYear:1895,maxYear:1905}, creationDate:{minYear:1895,maxYear:1905}, placeId:"vienna-at", region:"Central Europe", difficulty:2, landmarkCategory:"palace-garden", tags:["gloriette","fountain","hedge-maze"], era:"1900s", license:"Public Domain (life+70 / CC-PD-Mark)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Schoenbrunn_1900.jpg", creditText:"Photoglob Zürich", context:"The Gloriette and fountain in the gardens of Schönbrunn Palace, Vienna, photochrom print, c.1900.", curationNotes:"Cropped to remove a printed title ('...WIEN. SCHÖNBRUNN. PARK.') baked into the gravel path at the bottom edge of the photo itself — the same Photoglob Zürich 'P.Z.' series pattern documented elsewhere in this project." },
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
