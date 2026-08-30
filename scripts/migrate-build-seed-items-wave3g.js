// Wave 3g: final Southeast Asia gap-closers, finished centrally by the curator
// after the sourcing agent left them stalled (2026-08-23). Vientiane, Penang,
// Saigon, and Phnom Penh all had zero prior coverage.
//
// Run once, from the repo root: node scripts/migrate-build-seed-items-wave3g.js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const itemsPath = path.join(__dirname, "..", "content", "source", "items.json");
const gazetteerPath = path.join(__dirname, "..", "content", "source", "gazetteer.json");

const APPROVED_AT = "2026-08-23T15:30:00.000Z";
const NOTES = "Wave 3 ('roll toward 1000') batch: sourcing agent left this candidate stalled (research complete, download blocked by Wikimedia rate-limiting); the curator personally downloaded, visually inspected, and cropped it before approval.";

const SEED = [
  { id:"commons-vientiane-that-luang-1927", localName:"vientiane-that-luang-1927.jpg", workType:"photo", title:"Vientiane - Le That Luang", artistOrCreator:null, depictedDate:{minYear:1927,maxYear:1927}, creationDate:{minYear:1927,maxYear:1927}, placeId:"vientiane-la", region:"Southeast Asia", difficulty:2, landmarkCategory:"religious", tags:["that-luang","stupa","gilded"], era:"1920s", license:"Public Domain (France, life+70)", sourceUrl:"https://commons.wikimedia.org/wiki/File:68_cartes_postales_du_Laos,_don_1929_-_btv1b53216129c_(015_of_138).jpg", creditText:"Édition Laotienne Artistique & Sportive, Vientiane", context:"Pha That Luang, the great gilded stupa of Vientiane, 1927 postcard.", curationNotes:"Cropped to remove a handwritten Lao-script annotation in the top-right corner, overlaid on the sky, whose content could not be read/verified as non-identifying." },
  { id:"commons-penang-street-scene-1909", localName:"penang-street-scene-1909.jpg", workType:"photo", title:"Scène de rue sur Penang road", artistOrCreator:"Alfred Dutertre / Albert Kahn expedition", depictedDate:{minYear:1909,maxYear:1909}, creationDate:{minYear:1909,maxYear:1909}, placeId:"george-town-my", region:"Southeast Asia", difficulty:3, landmarkCategory:"street-scene", tags:["colonnade","rickshaw","street-vendor"], era:"1900s", license:"CC BY-SA 4.0", sourceUrl:"https://commons.wikimedia.org/wiki/File:Scène_de_rue_sur_Penang_road_-_D3142.jpg", creditText:"Musée Albert-Kahn", context:"A street scene on Penang Road in George Town, 1909, from the Albert Kahn Archives of the Planet.", curationNotes:"Original is a raw stereo glass-plate negative; cropped to just the left frame, removing the center gutter (a catalog number) and a 'PENANG ROAD' street sign visible at the frame's original right edge, which directly named the place." },
  { id:"commons-saigon-chateau-deau-1885", localName:"saigon-chateau-deau-water-tower-1885.jpg", workType:"photo", title:"Château d'eau de Saigon", artistOrCreator:null, depictedDate:{minYear:1880,maxYear:1890}, creationDate:{minYear:1880,maxYear:1890}, placeId:"ho-chi-minh-city-vn", region:"Southeast Asia", difficulty:3, landmarkCategory:"water-tower", tags:["water-tower","colonial-architecture"], era:"1880s", license:"Public Domain (PD-old-assumed / PD-1923)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Château_d'eau_de_Saigon.jpg", creditText:"Wikimedia Commons", context:"The Château d'eau (water tower) of colonial Saigon, c.1880-1890.", curationNotes:"Cropped tight to the photo itself, removing a faint handwritten caption in the page margin below and rotated text in the margin to the right, both illegible enough that their content couldn't be confirmed non-identifying." },
  { id:"commons-phnom-penh-wat-phnom-1931", localName:"phnom-penh-wat-phnom-1931.jpg", workType:"photo", title:"Phnom-Penh. La Pagode du Phnôm et son escalier monumental", artistOrCreator:null, depictedDate:{minYear:1931,maxYear:1931}, creationDate:{minYear:1931,maxYear:1931}, placeId:"phnom-penh-kh", region:"Southeast Asia", difficulty:2, landmarkCategory:"religious", tags:["wat-phnom","monumental-staircase","stupas"], era:"1930s", license:"CC BY-SA 4.0", sourceUrl:"https://commons.wikimedia.org/wiki/File:Les.Colonies.fran%C3%A7aises.Helio.Sadag.1931.Flammarion.Cambodge._Phnom-Penh._La_pagode_du_Pnohm_et_son_escalier_monumental.jpg", creditText:"Agence Économique de l'Indo-Chine, 1931", context:"Wat Phnom and its monumental staircase, the temple that gives Phnom Penh its name, 1931.", curationNotes:"Cropped to remove a printed caption naming 'Phnôm-Penh' below the photo and a 'CAMBODGE' header above it, both in a separate book-page margin." },
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
