// Wave 5d: Central Europe (Austria) batch.
// Run once, from the repo root: node scripts/migrate-build-seed-items-wave5d.js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const itemsPath = path.join(__dirname, "..", "content", "source", "items.json");
const gazetteerPath = path.join(__dirname, "..", "content", "source", "gazetteer.json");

const APPROVED_AT = "2026-08-24T13:30:00.000Z";
const NOTES = "Wave 5 (backlog finishing pass) batch: the curator personally sourced, downloaded (using the curl -4 IPv4 workaround), visually inspected, and (where noted) cropped this image before approval.";

const SEED = [
  { id:"commons-graz-hauptplatz-1898", localName:"graz-hauptplatz-schlossberg-1898.jpg", workType:"photo", title:"Graz Hauptplatz - Blick zum Schlossberg", artistOrCreator:null, depictedDate:{minYear:1898,maxYear:1898}, creationDate:{minYear:1898,maxYear:1898}, placeId:"graz-at", region:"Central Europe", difficulty:3, landmarkCategory:"market-square", tags:["clock-tower","market-day","umbrellas"], era:"1890s", license:"Public Domain (life+70)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Graz_Hauptplatz_-_Blick_zum_Schlo%C3%9Fberg_-_1898.jpg", creditText:"Wikimedia Commons", context:"Market day on the Hauptplatz in Graz, with the Uhrturm clock tower visible on the Schlossberg above, 1898." },
  { id:"commons-salzburg-residenzplatz-1865", localName:"salzburg-residenzplatz-fountain-1865.jpg", workType:"photo", title:"Place de la Résidence, Salzbourg", artistOrCreator:null, depictedDate:{minYear:1860,maxYear:1870}, creationDate:{minYear:1860,maxYear:1870}, placeId:"salzburg-at", region:"Central Europe", difficulty:2, landmarkCategory:"fountain-plaza", tags:["residenzbrunnen","clock-tower","arcade"], era:"1860s", license:"CC0 (Rijksmuseum)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Gezicht_op_het_Residenzplatz_te_Salzburg,_RP-F-F08374.jpg", creditText:"Rijksmuseum", context:"The Residenzbrunnen fountain on Residenzplatz in Salzburg, 1860s stereograph.", curationNotes:"Original was a stereograph card with a printed caption in the mount border below; cropped to just the left photo panel." },
  { id:"commons-innsbruck-weisses-kreuz-1925", localName:"innsbruck-weisses-kreuz-street-1925.jpg", workType:"photo", title:"Gasthof Weisses Kreuz, Innsbruck", artistOrCreator:null, depictedDate:{minYear:1925,maxYear:1925}, creationDate:{minYear:1925,maxYear:1925}, placeId:"innsbruck-at", region:"Central Europe", difficulty:3, landmarkCategory:"street", tags:["gasthof","arcade","delivery-carts"], era:"1920s", license:"Public Domain (life+70 / CC-PD-Mark)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Gasthof_Weisses_Kreuz_-_Innsbruck_-_Ca._1900.jpg", creditText:"Wikimedia Commons", context:"A street in old Innsbruck with the Gasthof Weisses Kreuz inn and horse-carts, 1925.", curationNotes:"Cropped to remove a delivery truck on the left whose side panel spelled 'Innsbruck' directly; the inn's own name ('Weissen Kreuz') remains and is not disqualifying." },
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
