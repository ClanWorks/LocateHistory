// Wave 6b: major-capital depth batch, continued. Berlin and Madrid third images.
// Run once, from the repo root: node scripts/migrate-build-seed-items-wave6b.js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const itemsPath = path.join(__dirname, "..", "content", "source", "items.json");
const gazetteerPath = path.join(__dirname, "..", "content", "source", "gazetteer.json");

const APPROVED_AT = "2026-08-25T09:30:00.000Z";
const NOTES = "Wave 6 (backlog finishing pass, continued) batch: the curator personally downloaded (using the curl -4 IPv4 workaround), visually inspected, and cropped this image before approval.";

const SEED = [
  { id:"commons-berlin-brandenburg-gate-1850", localName:"berlin-brandenburg-gate-1850.jpg", workType:"drawing", title:"Berlin, Brandenburger Tor, c.1850", artistOrCreator:"Loeillot", depictedDate:{minYear:1850,maxYear:1850}, creationDate:{minYear:1850,maxYear:1850}, placeId:"berlin-de", region:"Central Europe", difficulty:2, landmarkCategory:"monument-gate", tags:["brandenburg-gate","quadriga","carriages"], era:"1850s", license:"Public Domain (PD-Art, PD-old-70)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Berlin_Brandenburger_Tor_c1850.jpg", creditText:"Loeillot", context:"The Brandenburg Gate in Berlin with its quadriga, carriages and pedestrians in the foreground, 1850 lithograph." },
  { id:"commons-madrid-plaza-mayor-1900", localName:"madrid-plaza-mayor-1900.jpg", workType:"photo", title:"Madrid, Plaza Mayor", artistOrCreator:null, depictedDate:{minYear:1895,maxYear:1905}, creationDate:{minYear:1895,maxYear:1905}, placeId:"madrid-es", region:"Southern Europe", difficulty:2, landmarkCategory:"plaza", tags:["equestrian-statue","fountain","clock-towers"], era:"1900s", license:"Public Domain (pre-1931)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Madrid._Plaza_Mayor_LCCN2017660767.jpg", creditText:"Photoglob Zürich / Library of Congress", context:"The Plaza Mayor in Madrid with its equestrian statue and twin clock towers, photochrom print, c.1900.", curationNotes:"Cropped to remove a printed title ('5340. P.Z. - MADRID') baked into the pavement at the bottom-left edge of the photo itself — the same Photoglob Zürich 'P.Z.' series pattern documented elsewhere in this project." },
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
