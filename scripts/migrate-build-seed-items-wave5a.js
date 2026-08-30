// Wave 5a: South America batch, finished centrally by the curator from the South
// America sourcing agent's fully-researched backlog (2026-08-24), using the IPv4
// (curl -4) rate-limit workaround discovered this session.
//
// Run once, from the repo root: node scripts/migrate-build-seed-items-wave5a.js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const itemsPath = path.join(__dirname, "..", "content", "source", "items.json");
const gazetteerPath = path.join(__dirname, "..", "content", "source", "gazetteer.json");

const APPROVED_AT = "2026-08-24T12:00:00.000Z";
const NOTES = "Wave 5 (backlog finishing pass) batch: sourcing agent left this candidate stalled (research complete, download blocked by Wikimedia rate-limiting); the curator personally downloaded (using the curl -4 IPv4 workaround), visually inspected, and (where noted) cropped it before approval.";

const SEED = [
  { id:"commons-cochabamba-panorama-1915", localName:"cochabamba-panorama-1915.jpg", workType:"photo", title:"Cochabamba, Bolivia", artistOrCreator:"I.F. Scheeler", depictedDate:{minYear:1915,maxYear:1915}, creationDate:{minYear:1915,maxYear:1915}, placeId:"cochabamba-bo", region:"South America", difficulty:3, landmarkCategory:"panorama", tags:["wide-panorama","valley","mountains"], era:"1910s", license:"Public Domain (PD-1923)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Cochabamba,_Bolivia_LCCN2007663111.tif", creditText:"I.F. Scheeler / Library of Congress", context:"A wide panoramic view of Cochabamba in its mountain valley, 1915." },
  { id:"commons-georgetown-demerara-1888", localName:"georgetown-guyana-demerara-1888.png", workType:"drawing", title:"Georgetown, Demerara", artistOrCreator:"Melton Prior", depictedDate:{minYear:1888,maxYear:1888}, creationDate:{minYear:1888,maxYear:1888}, placeId:"georgetown-gy", region:"South America", difficulty:3, landmarkCategory:"cityscape", tags:["harbour","engraving","palm-trees"], era:"1880s", license:"Public Domain (life+100)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Georgetown_Demerara_1888.png", creditText:"Melton Prior, Illustrated London News", context:"An elevated engraved view over Georgetown, British Guiana, toward the harbour, 1888." },
  { id:"commons-paramaribo-haven-1900", localName:"paramaribo-haven-waterfront-1900.jpg", workType:"photo", title:"Gezicht op de haven van Paramaribo", artistOrCreator:null, depictedDate:{minYear:1890,maxYear:1910}, creationDate:{minYear:1890,maxYear:1910}, placeId:"paramaribo-sr", region:"South America", difficulty:3, landmarkCategory:"waterfront", tags:["riverfront","colonial-buildings"], era:"1900s", license:"CC0 (Rijksmuseum)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Gezicht_op_haven_van_Paramaribo_(titel_op_object),_NG-2015-4-1-5.jpg", creditText:"Rijksmuseum", context:"The waterfront at Paramaribo, Suriname, c.1890-1910.", curationNotes:"Cropped to just the lower of two stacked stereo photos on the album page, removing a printed title ('GEZICHT OP DE HAVEN VAN PARAMARIBO') in the page margin above." },
  { id:"commons-barranquilla-camellon-1903", localName:"barranquilla-camellon-abello-1903.jpg", workType:"photo", title:"Antiguo Camellón Abello", artistOrCreator:null, depictedDate:{minYear:1903,maxYear:1903}, creationDate:{minYear:1903,maxYear:1903}, placeId:"barranquilla-co", region:"South America", difficulty:3, landmarkCategory:"promenade", tags:["carriages","promenade","crowd"], era:"1900s", license:"Public Domain (Colombian Law 23/1982) / CC-PD-Mark", sourceUrl:"https://commons.wikimedia.org/wiki/File:Antiguo_Camell%C3%B3n_Abello_(Barranquilla,_1903).jpg", creditText:"Wikimedia Commons", context:"The promenade now known as Paseo de Bolívar in Barranquilla, 1903." },
  { id:"commons-maracaibo-customs-house", localName:"maracaibo-customs-house-1890s.jpg", workType:"photo", title:"Puerto de Maracaibo, siglo XIX", artistOrCreator:null, depictedDate:{minYear:1890,maxYear:1899}, creationDate:{minYear:1890,maxYear:1899}, placeId:"maracaibo-ve", region:"South America", difficulty:4, landmarkCategory:"waterfront", tags:["arcaded-building","waterfront"], era:"1890s", license:"Public Domain", sourceUrl:"https://commons.wikimedia.org/wiki/File:Puerto_de_Maracaibo._Siglo_XIX.jpg", creditText:"Wikimedia Commons", context:"An arcaded waterfront building at the port of Maracaibo, late 19th century.", curationNotes:"Original was a two-photo composite; cropped to the lower, more detailed photo alone." },
  { id:"commons-concepcion-bio-bio-bridge", localName:"concepcion-bio-bio-bridge-1890.png", workType:"drawing", title:"The Bridge over the Bio Bio", artistOrCreator:null, depictedDate:{minYear:1890,maxYear:1890}, creationDate:{minYear:1890,maxYear:1890}, placeId:"concepcion-cl", region:"South America", difficulty:5, landmarkCategory:"bridge", tags:["railway-bridge","engraving","river"], era:"1890s", license:"Public Domain", sourceUrl:"https://commons.wikimedia.org/wiki/File:A_Visit_to_Chile_1890_09.png", creditText:"A Visit to Chile (1890)", context:"The railway bridge over the Bío Bío River near Concepción, 1890 engraving, with the town visible on the far bank." },
  { id:"commons-buenos-aires-avenida-mayo-1915", localName:"buenos-aires-avenida-mayo-1915.jpg", workType:"photo", title:"Av. de Mayo y Lima", artistOrCreator:null, depictedDate:{minYear:1915,maxYear:1915}, creationDate:{minYear:1915,maxYear:1915}, placeId:"buenos-aires-ar", region:"South America", difficulty:2, landmarkCategory:"avenue", tags:["congress-dome","automobiles","carriages"], era:"1910s", license:"Public Domain", sourceUrl:"https://commons.wikimedia.org/wiki/File:Av._de_Mayo_y_Lima_(ca._1915).JPG", creditText:"Wikimedia Commons", context:"Avenida de Mayo looking toward the Congress dome, Buenos Aires, c.1915." },
  { id:"commons-rio-avenida-central-1910", localName:"rio-de-janeiro-avenida-central-1910.jpg", workType:"photo", title:"Avenida Central", artistOrCreator:null, depictedDate:{minYear:1905,maxYear:1915}, creationDate:{minYear:1905,maxYear:1915}, placeId:"rio-de-janeiro-br", region:"South America", difficulty:3, landmarkCategory:"avenue", tags:["gothic-revival-building","street-lamp"], era:"1910s", license:"Public Domain (life+100 / pre-1931)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Avenida_Central_(001AN02001005).jpg", creditText:"Instituto Moreira Salles Collection", context:"A Gothic Revival building on Avenida Central in Rio de Janeiro, c.1905-1915.", curationNotes:"Original was a stereograph card with a handwritten caption ('Avenida Central / Rio') in the mount margin; cropped to just the left photo panel." },
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
