// Wave 3i: North America depth batch 2, finished centrally by the curator from the
// North America sourcing agent's researched backlog (2026-08-23).
// New Orleans, Toronto, Montreal, Quebec City, Vancouver.
//
// Run once, from the repo root: node scripts/migrate-build-seed-items-wave3i.js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const itemsPath = path.join(__dirname, "..", "content", "source", "items.json");
const gazetteerPath = path.join(__dirname, "..", "content", "source", "gazetteer.json");

const APPROVED_AT = "2026-08-23T16:30:00.000Z";
const NOTES = "Wave 3 ('roll toward 1000') batch: sourcing agent left this candidate stalled/researched-only; the curator personally downloaded, visually inspected, and (where noted) cropped it before approval.";

const SEED = [
  { id:"commons-new-orleans-camp-street-1905", localName:"new-orleans-camp-street-1905.jpg", workType:"photo", title:"Camp Street looking up from Canal Street, New Orleans, LA", artistOrCreator:null, depictedDate:{minYear:1901,maxYear:1906}, creationDate:{minYear:1901,maxYear:1906}, placeId:"new-orleans-us", region:"North America", difficulty:4, landmarkCategory:"street", tags:["streetcar","office-building","shopfronts"], era:"1900s", license:"Public Domain (pre-1931)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Camp_Street_looking_up_from_Canal_Street_New_Orleans_LA_Detroit_Pub_Co.jpg", creditText:"Detroit Photographic Co.", context:"Camp Street looking up from Canal Street in New Orleans, with a streetcar and office buildings, c.1901-1906.", curationNotes:"Cropped to remove a printed caption ('Camp Street, New Orleans, La.') etched into the negative at the bottom edge." },
  { id:"commons-toronto-king-street-1900", localName:"toronto-king-street-1900.jpg", workType:"photo", title:"King Street looking east from Yonge, 1900, Toronto", artistOrCreator:null, depictedDate:{minYear:1900,maxYear:1900}, creationDate:{minYear:1900,maxYear:1900}, placeId:"toronto-ca", region:"North America", difficulty:4, landmarkCategory:"street", tags:["streetcar","cyclists","shopfronts"], era:"1900s", license:"Public Domain (Canada / PD-1923)", sourceUrl:"https://commons.wikimedia.org/wiki/File:King_Street_looking_east_from_Yonge_1900_Toronto.jpg", creditText:"Underwood & Underwood", context:"King Street looking east from Yonge Street in Toronto, with a streetcar and cyclists, 1900." },
  { id:"commons-montreal-notre-dame-1905", localName:"montreal-notre-dame-viauville-1905.jpg", workType:"photo", title:"Montréal 1900-10. Rue Notre-Dame, Est.", artistOrCreator:null, depictedDate:{minYear:1900,maxYear:1910}, creationDate:{minYear:1900,maxYear:1910}, placeId:"montreal-ca", region:"North America", difficulty:5, landmarkCategory:"street", tags:["hotel","utility-poles","nondescript"], era:"1900s", license:"CC BY 2.0", sourceUrl:"https://commons.wikimedia.org/wiki/File:Montréal_1900-10._Rue_Notre-Dame,_Est._(5404707311).jpg", creditText:"Philippe Du Berger / BAnQ, E.Z. Massicotte album", context:"The former Hôtel Lépine on Rue Notre-Dame Est in Montreal's Viauville district, c.1900-1910." },
  { id:"commons-quebec-city-chateau-frontenac-1895", localName:"quebec-city-chateau-frontenac-1895.jpg", workType:"photo", title:"Vue vers le Château Frontenac et la terrasse Dufferin, vers 1895", artistOrCreator:null, depictedDate:{minYear:1895,maxYear:1895}, creationDate:{minYear:1895,maxYear:1895}, placeId:"quebec-city-ca", region:"North America", difficulty:2, landmarkCategory:"château", tags:["chateau-frontenac","terrasse-dufferin","overlook"], era:"1890s", license:"Public Domain Mark 1.0 (pre-1931)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Vue_vers_le_Chateau_Frontenac_et_la_terrasse_Dufferin,_vers_1895.jpg", creditText:"National Photo Company Collection / Library of Congress", context:"A family group overlooking the St. Lawrence toward Château Frontenac and the Dufferin Terrace, Quebec City, c.1895." },
  { id:"commons-vancouver-granville-dunsmuir-1900s", localName:"vancouver-granville-dunsmuir-1900s.jpg", workType:"photo", title:"Streetcar passing Granville Street and Dunsmuir - 1900s", artistOrCreator:"Philip Timms", depictedDate:{minYear:1909,maxYear:1909}, creationDate:{minYear:1909,maxYear:1909}, placeId:"vancouver-ca", region:"North America", difficulty:4, landmarkCategory:"street", tags:["streetcar","furniture-store","rain-slicked-street"], era:"1900s", license:"Public Domain (Canada, pre-1949)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Streetcar_passing_Granville_Street_and_Dunsmuir_-_1900s.jpg", creditText:"Philip Timms / City of Vancouver Archives", context:"A streetcar at Granville and Dunsmuir in Vancouver, rain-slicked street, 1909." },
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
