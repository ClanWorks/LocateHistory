// Wave 3d: East Africa + Caribbean gap-closers, finished centrally by the curator
// after their sourcing agents left them stalled on Wikimedia rate-limiting
// (2026-08-23). Every item downloaded and personally visually inspected by the
// curator directly (not just re-checked from an agent's claim), since these were
// never actually seen by the agent that researched them.
//
// Run once, from the repo root: node scripts/migrate-build-seed-items-wave3d.js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const itemsPath = path.join(__dirname, "..", "content", "source", "items.json");
const gazetteerPath = path.join(__dirname, "..", "content", "source", "gazetteer.json");

const APPROVED_AT = "2026-08-23T14:00:00.000Z";
const NOTES = "Wave 3 ('roll toward 1000') batch: sourcing agent left this candidate stalled (research complete, download blocked by Wikimedia rate-limiting); the curator personally downloaded, visually inspected, and (where noted) cropped it before approval.";

const SEED = [
  { id:"commons-mogadishu-marketplace-1882", localName:"mogadishu-marketplace-1882.jpg", workType:"drawing", title:"Mogadishu marketplace, 1882", artistOrCreator:null, depictedDate:{minYear:1882,maxYear:1882}, creationDate:{minYear:1882,maxYear:1882}, placeId:"mogadishu-so", region:"East Africa", difficulty:3, landmarkCategory:"market", tags:["camels","market","city-wall"], era:"1880s", license:"Public Domain (PD-Art / PD-old-70)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Mogadishu_marketplace_1882.jpg", creditText:"E. Cerulli, Somalia, Scritti Vari Editi ed Inediti", context:"The Mogadishu marketplace in 1882, with camel caravans and the old town wall behind." },
  { id:"commons-asmara-avenue-1930s", localName:"asmara-avenue-1930s.jpg", workType:"photo", title:"Avenue in Asmara (1930s)", artistOrCreator:null, depictedDate:{minYear:1930,maxYear:1939}, creationDate:{minYear:1930,maxYear:1939}, placeId:"asmara-er", region:"East Africa", difficulty:3, landmarkCategory:"street-scene", tags:["tree-lined-avenue","italian-colonial","cars"], era:"1930s", license:"Public Domain (PD-old-70-1923)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Avenue_in_Asmara_(1930s).jpg", creditText:"Istituto Italiano per l'Africa e l'Oriente, Rome", context:"A tree-lined avenue in Italian Asmara in the 1930s, with period cars." },
  { id:"commons-djibouti-panorama-1930s", localName:"djibouti-panorama-1930s.jpg", workType:"photo", title:"Djibouti, Panorama, circa 1930-35", artistOrCreator:"Basuyau, Toulouse", depictedDate:{minYear:1930,maxYear:1935}, creationDate:{minYear:1930,maxYear:1935}, placeId:"djibouti-city-dj", region:"East Africa", difficulty:4, landmarkCategory:"coastal-panorama", tags:["rooftops","postcard"], era:"1930s", license:"Public Domain (PD Mark 1.0)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Djibouti._Panorama,_circa_1930-35.jpg", creditText:"Basuyau, Toulouse", context:"A panoramic postcard view over the rooftops of Djibouti City, French Somaliland, c.1930-35." },
  { id:"commons-entebbe-general-view-1908", localName:"entebbe-general-view-1908.jpg", workType:"photo", title:"Vista generale di Entebbe", artistOrCreator:null, depictedDate:{minYear:1908,maxYear:1908}, creationDate:{minYear:1908,maxYear:1908}, placeId:"entebbe-ug", region:"East Africa", difficulty:3, landmarkCategory:"town-panorama", tags:["lakeside","thatched-roofs","protectorate"], era:"1900s", license:"Public Domain (life+90 or fewer)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Il_Ruwenzori,_1908_-_BEIC_IE7203615_-_vista_generale_di_Entebbe.jpg", creditText:"Luigi Amedeo di Savoia, Il Ruwenzori (Hoepli, 1908) / BEIC", context:"A general view of Entebbe in 1908, seat of the British Uganda Protectorate government, overlooking Lake Victoria." },
  { id:"commons-port-of-spain-street-1900", localName:"port-of-spain-street-scene-1900.jpg", workType:"photo", title:"Street scene, Port of Spain, Trinidad and Tobago", artistOrCreator:null, depictedDate:{minYear:1900,maxYear:1900}, creationDate:{minYear:1900,maxYear:1900}, placeId:"port-of-spain-tt", region:"Caribbean", difficulty:3, landmarkCategory:"street-scene", tags:["ironwork-balconies","horse-carriage","shopfronts"], era:"1900s", license:"Public Domain Mark 1.0 (LOC)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Street_scene,_Port_of_Spain,_Trinidad_and_Tobago_LCCN2006679496.jpg", creditText:"Library of Congress", context:"A street of ornate ironwork-balconied buildings in Port of Spain, 1900." },
  { id:"commons-willemstad-breedestraat-1895", localName:"willemstad-breedestraat-1895.jpg", workType:"photo", title:"Breedestraat in Punda te Willemstad, Curaçao", artistOrCreator:"Soublette et Fils", depictedDate:{minYear:1895,maxYear:1895}, creationDate:{minYear:1895,maxYear:1895}, placeId:"willemstad-cw", region:"Caribbean", difficulty:3, landmarkCategory:"street-scene", tags:["dutch-colonial","shopfronts","gable-roofs"], era:"1890s", license:"CC BY 4.0", sourceUrl:"https://commons.wikimedia.org/wiki/File:Breedestraat_in_Punda_te_Willemstad,_Cura%C3%A7ao,_KITLV_10000.tiff", creditText:"Soublette et Fils / KITLV, Leiden University", context:"Breedestraat in the Punda district of Willemstad, Curaçao, 1895, lined with Dutch colonial gabled shopfronts." },
  { id:"commons-st-pierre-martinique-1893", localName:"st-pierre-martinique-panorama-1893.jpg", workType:"photo", title:"St. Pierre, Martinique", artistOrCreator:null, depictedDate:{minYear:1893,maxYear:1893}, creationDate:{minYear:1893,maxYear:1893}, placeId:"st-pierre-mq", region:"Caribbean", difficulty:4, landmarkCategory:"town-panorama", tags:["cathedral-spire","pre-1902-eruption","harbour"], era:"1890s", license:"Public Domain (pre-1931)", sourceUrl:"https://commons.wikimedia.org/wiki/File:FORT_DE_FRANCE,_MARTINIQUE_(1893).jpg", creditText:"British Library / Mechanical Curator collection", context:"A panoramic view of St. Pierre, Martinique, in 1893, before the town was destroyed by the 1902 eruption of Mount Pelée.", curationNotes:"IMPORTANT: this Commons file's title says 'Fort de France' but its own printed caption reads 'ST. PIERRE — MARTINIQUE' and the depicted cathedral/townscape matches St. Pierre, not Fort-de-France — the Commons filename is mislabeled. Sourced this batch as a Fort-de-France candidate but re-attributed to St. Pierre after reading the image's own caption; Fort-de-France itself remains uncovered. Cropped to remove the printed caption in a separate margin below the photo." },
  { id:"commons-basseterre-st-kitts-1893", localName:"basseterre-st-kitts-1893.jpg", workType:"photo", title:"Basse Terre, St. Kitts", artistOrCreator:null, depictedDate:{minYear:1893,maxYear:1893}, creationDate:{minYear:1893,maxYear:1893}, placeId:"basseterre-kn", region:"Caribbean", difficulty:4, landmarkCategory:"harbor-town", tags:["waterfront","sailing-ships","mountains"], era:"1890s", license:"Public Domain (pre-1931)", sourceUrl:"https://commons.wikimedia.org/wiki/File:BASS_TERRE_-_ST.KITTS_(1893).jpg", creditText:"British Library / Mechanical Curator collection", context:"The waterfront of Basseterre, St. Kitts, 1893, with sailing ships at the quay.", curationNotes:"Cropped to remove a printed caption ('BASSE TERRE — ST. KITTS') in a separate margin below the photo." },
  { id:"commons-st-georges-grenada-1893", localName:"st-georges-grenada-1893.jpg", workType:"photo", title:"St. Georges, Island of Grenada", artistOrCreator:null, depictedDate:{minYear:1893,maxYear:1893}, creationDate:{minYear:1893,maxYear:1893}, placeId:"st-georges-gd", region:"Caribbean", difficulty:3, landmarkCategory:"harbor-town", tags:["harbour","hillside-town","church-spires"], era:"1890s", license:"Public Domain (pre-1931)", sourceUrl:"https://commons.wikimedia.org/wiki/File:GRENADA,_ST._GEORGES_(1893).jpg", creditText:"British Library / Mechanical Curator collection", context:"St. George's, Grenada, 1893, its hillside town and harbour seen from above.", curationNotes:"Cropped to remove a printed caption ('ST. GEORGES — ISLAND OF GRENADA') in a separate margin below the photo." },
  { id:"commons-castries-harbour-1910", localName:"castries-harbour-town-1910.jpg", workType:"photo", title:"Harbour and Town, Castries, St. Lucia", artistOrCreator:null, depictedDate:{minYear:1910,maxYear:1910}, creationDate:{minYear:1910,maxYear:1910}, placeId:"castries-lc", region:"Caribbean", difficulty:3, landmarkCategory:"harbor-town", tags:["harbour","palm-trees","postcard"], era:"1910s", license:"Public Domain (pre-1931 / CC-PD-Mark)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Saint_Lucia_-_Harbour_and_Town,_Castries.jpg", creditText:"Wikimedia Commons", context:"The harbour and town of Castries, St. Lucia, c.1910, collotype postcard.", curationNotes:"Cropped to remove a printed caption ('Harbour and Town Castries, St. Lucia.') baked across the sky at the top of the photo itself." },
  { id:"commons-oranjestad-pier-1930", localName:"oranjestad-pier-1930.jpg", workType:"photo", title:"De pier in Oranjestad met barken", artistOrCreator:null, depictedDate:{minYear:1930,maxYear:1930}, creationDate:{minYear:1930,maxYear:1930}, placeId:"oranjestad-aw", region:"Caribbean", difficulty:4, landmarkCategory:"waterfront", tags:["pier","sailing-barques","dockworkers"], era:"1930s", license:"Public Domain (anonymous, copyright expired)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Collectie_NMvWereldculturen,_TM-10021447,_Stereonegatief_%27De_pier_in_Oranjestad_met_barken,_die_beladen_met_vruchten_uit_Venezuela_zijn_aangekomen%27,_fotograaf_niet_bekend,_1930.jpg", creditText:"Nationaal Museum van Wereldculturen", context:"The pier in Oranjestad, Aruba, with barques loaded with fruit from Venezuela, 1930.", curationNotes:"Original is a stereo (twin-frame) negative with handwritten text in the black center gutter between the two frames; cropped to just the left frame, entirely removing the gutter and its handwriting." },
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
