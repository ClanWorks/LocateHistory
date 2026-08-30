// Wave 4e: Southern/East Africa (9), Havana + Santo Domingo depth (2), from the
// second "roll toward 1000" push (2026-08-24). All agent-sourced and independently
// re-verified before approval.
//
// Run once, from the repo root: node scripts/migrate-build-seed-items-wave4e.js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const itemsPath = path.join(__dirname, "..", "content", "source", "items.json");
const gazetteerPath = path.join(__dirname, "..", "content", "source", "gazetteer.json");

const APPROVED_AT = "2026-08-24T11:00:00.000Z";
const NOTES = "Wave 4 (second 'roll toward 1000' push) batch, sourced by a background research agent and independently re-verified (sourceUrl/license re-checked against the live Commons page, image personally re-viewed) before approval.";

const SEED = [
  { id:"commons-bulawayo-regiment-1914", localName:"bulawayo-regiment-parade-1914.png", workType:"photo", title:"1st Rhodesia Regiment in Bulawayo, 1914", artistOrCreator:null, depictedDate:{minYear:1914,maxYear:1914}, creationDate:{minYear:1914,maxYear:1914}, placeId:"bulawayo-zw", region:"Southern Africa", difficulty:3, landmarkCategory:"town-square", tags:["military-parade","ww1"], era:"1910s", license:"Public Domain (PD-1923)", sourceUrl:"https://commons.wikimedia.org/wiki/File:1st_Rhodesia_Regiment_in_Bulawayo,_1914.png", creditText:"Wikimedia Commons", context:"Men of the 1st Rhodesia Regiment parade through Bulawayo, October 1914, en route to WWI deployment." },
  { id:"commons-kimberley-main-street-1896", localName:"kimberley-main-street-1896.jpg", workType:"photo", title:"Main Street, Kimberley", artistOrCreator:null, depictedDate:{minYear:1896,maxYear:1896}, creationDate:{minYear:1896,maxYear:1896}, placeId:"kimberley-za", region:"Southern Africa", difficulty:3, landmarkCategory:"street", tags:["clock-tower","carriages","diamond-town"], era:"1890s", license:"CC0 1.0 (Rijksmuseum)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Straatgezicht_van_Main_Street_te_Kimberley,_Zuid-Afrika,_RP-F-F01156-BD.jpg", creditText:"Rijksmuseum", context:"Main Street, Kimberley's diamond-boomtown centre, with horse carriages and the town clock tower, April 1896." },
  { id:"commons-east-london-oxford-street-1900", localName:"east-london-oxford-street-1900.jpg", workType:"photo", title:"Oxford Street, East London", artistOrCreator:null, depictedDate:{minYear:1900,maxYear:1900}, creationDate:{minYear:1900,maxYear:1900}, placeId:"east-london-za", region:"Southern Africa", difficulty:3, landmarkCategory:"street", tags:["electric-trams","town-hall","clock-tower"], era:"1900s", license:"CC BY-SA 3.0", sourceUrl:"https://commons.wikimedia.org/wiki/File:East_london,_approx_1900.jpg", creditText:"Wikimedia Commons", context:"Oxford Street, East London's main commercial thoroughfare, c.1900, with electric trams.", curationNotes:"Cropped to remove a printed caption ('Oxford Street, East London.') in a separate band below the photo." },
  { id:"commons-jinja-ripon-falls-1864", localName:"jinja-ripon-falls-1864.jpg", workType:"drawing", title:"The Ripon Falls — the Nile coming out of Lake Victoria", artistOrCreator:null, depictedDate:{minYear:1864,maxYear:1864}, creationDate:{minYear:1864,maxYear:1864}, placeId:"jinja-ug", region:"East Africa", difficulty:4, landmarkCategory:"waterfall", tags:["ripon-falls","nile-source","engraving"], era:"1860s", license:"Public Domain (pre-1931)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Le_Tour_du_monde-09-p365.jpg", creditText:"Le Tour du Monde", context:"The Ripon Falls at Jinja, where the White Nile begins its flow from Lake Victoria, 1864 engraving." },
  { id:"commons-kisumu-port-florence-1908", localName:"kisumu-port-florence-1908.jpg", workType:"photo", title:"Port Florence", artistOrCreator:null, depictedDate:{minYear:1908,maxYear:1908}, creationDate:{minYear:1908,maxYear:1908}, placeId:"kisumu-ke", region:"East Africa", difficulty:4, landmarkCategory:"harbor", tags:["lake-victoria","pier","boats"], era:"1900s", license:"Public Domain (PD-old-90-expired)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Il_Ruwenzori,_1908_-_BEIC_IE7203615_-_pagina_33_-_Port_Florence.jpg", creditText:"Luigi Amedeo di Savoia, Il Ruwenzori (1908)", context:"Port Florence (Kisumu's colonial-era name) on Lake Victoria, 1908." },
  { id:"commons-mombasa-vasco-da-gama-1913", localName:"mombasa-vasco-da-gama-street-1913.jpg", workType:"photo", title:"Rue Vasco-de-Gama à Mombasa", artistOrCreator:"Jules Leclercq", depictedDate:{minYear:1913,maxYear:1913}, creationDate:{minYear:1913,maxYear:1913}, placeId:"mombasa-ke", region:"East Africa", difficulty:3, landmarkCategory:"street", tags:["old-town","balconies","swahili-arab-architecture"], era:"1910s", license:"Public Domain", sourceUrl:"https://commons.wikimedia.org/wiki/File:Jules_Leclercq-_Aux_sources_du_Nil-1913-rue_Vasco-de-Gama_%C3%A0_Mombasa.jpg", creditText:"Jules Leclercq, Aux sources du Nil (1913)", context:"A narrow street in Mombasa's Old Town, 1913, Swahili-Arab balconied buildings.", curationNotes:"Cropped to remove a printed caption ('MOMBASA — LA RUE VASCO-DE-GAMA') in a separate margin below the framed picture." },
  { id:"commons-beira-military-command-1891", localName:"beira-view-military-command-1891.jpg", workType:"photo", title:"Vila da Beira — Vista geral tomada do comando militar", artistOrCreator:"Lt. Veiga da Cunha", depictedDate:{minYear:1891,maxYear:1891}, creationDate:{minYear:1891,maxYear:1891}, placeId:"beira-mz", region:"Southern Africa", difficulty:4, landmarkCategory:"waterfront", tags:["thatched-buildings","reed-fence","trading-post"], era:"1890s", license:"Public Domain (PD-1923)", sourceUrl:"https://commons.wikimedia.org/wiki/File:TT_CMZ-AF-GT_E_2-1_1_3_-_Vila_da_Beira_-_Vista_geral_tomada_do_comando_militar,_Aug_1891.jpg", creditText:"Lt. Veiga da Cunha", context:"The young Portuguese trading post of Vila da Beira, viewed from the military command post, August 1891.", curationNotes:"Cropped to remove a printed title and caption in the archival print border, outside the photo itself." },
  { id:"commons-mahajanga-rue-de-rova-1912", localName:"mahajanga-rue-de-rova-street-1912.jpg", workType:"photo", title:"Rue de Rova, Majunga", artistOrCreator:"Walter Kaudern", depictedDate:{minYear:1912,maxYear:1912}, creationDate:{minYear:1912,maxYear:1912}, placeId:"mahajanga-mg", region:"East Africa", difficulty:4, landmarkCategory:"street", tags:["indian-quarter","street-scene"], era:"1910s", license:"Public Domain (CC0 / Public Domain Mark 1.0)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Rue_de_Rova_,_gata_i_ett_indiskt_kvarter._Majunga,_Mahajanga._Madagaskar_-_SMVK_-_022010.tif", creditText:"Walter Kaudern / Swedish National Museums of World Culture", context:"A street in the Indian quarter of Majunga (Mahajanga), Madagascar, November 1912." },
  { id:"commons-nosy-be-village-1864", localName:"nosy-be-village-canoes-1864.jpg", workType:"drawing", title:"Coastal village on Nosy Be", artistOrCreator:"Évremond de Bérard (after Désiré Charnay)", depictedDate:{minYear:1864,maxYear:1864}, creationDate:{minYear:1864,maxYear:1864}, placeId:"nosy-be-mg", region:"East Africa", difficulty:4, landmarkCategory:"village", tags:["dugout-canoes","huts","palms"], era:"1860s", license:"Public Domain (PD-Mark)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Le_Tour_du_monde-10-p225.jpg", creditText:"Évremond de Bérard, after Désiré Charnay, Le Tour du Monde", context:"A coastal village on Nosy Be, Madagascar, 1864 engraving." },
  { id:"commons-havana-city-walls-1870", localName:"havana-city-walls-1870.jpg", workType:"photo", title:"City Walls of Havana, Cuba, in 1870", artistOrCreator:null, depictedDate:{minYear:1870,maxYear:1870}, creationDate:{minYear:1870,maxYear:1870}, placeId:"havana-cu", region:"Caribbean", difficulty:3, landmarkCategory:"cityscape", tags:["city-walls","promenade","skyline"], era:"1870s", license:"Public Domain (PD-Cuba)", sourceUrl:"https://commons.wikimedia.org/wiki/File:City_Walls_of_Havana,_Cuba,_in_1870.jpg", creditText:"Wikimedia Commons", context:"An elevated view over Havana's old city walls and a tree-lined promenade toward the skyline, 1870, before the walls were demolished." },
  { id:"commons-santo-domingo-cathedral-1899", localName:"santo-domingo-cathedral-columbus-park-1899.jpg", workType:"photo", title:"The Cathedral and Columbus Park, Santo Domingo City", artistOrCreator:null, depictedDate:{minYear:1899,maxYear:1899}, creationDate:{minYear:1899,maxYear:1899}, placeId:"santo-domingo-do", region:"Caribbean", difficulty:2, landmarkCategory:"cathedral", tags:["oldest-cathedral-americas","columbus-statue","plaza"], era:"1890s", license:"Public Domain (PD-1923)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Santo_Domingo_Cathedral_(1899).jpg", creditText:"Munsey's Magazine, February 1899", context:"The Catedral Santa María La Menor, the oldest cathedral in the Americas, seen from Columbus Park with its statue of Columbus, 1899.", curationNotes:"Cropped to remove a printed caption naming the city and describing the cathedral's history, in a separate margin below the photo." },
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
