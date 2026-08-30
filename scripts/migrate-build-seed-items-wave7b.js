// Wave 7b: India interior cities downloaded by an agent that was interrupted
// mid-task (local machine sleep) before it could write items.json entries.
// Recovered as orphaned files in content/originals/, personally re-verified
// (visual spoiler check) by the curator before integration.
// Run once, from the repo root: node scripts/migrate-build-seed-items-wave7b.js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const itemsPath = path.join(__dirname, "..", "content", "source", "items.json");
const gazetteerPath = path.join(__dirname, "..", "content", "source", "gazetteer.json");

const APPROVED_AT = "2026-08-25T12:30:00.000Z";
const NOTES = "Wave 7 (recovered orphan) batch: downloaded by a sourcing agent interrupted mid-task before it could integrate; the curator personally re-verified the visual spoiler check before approval.";

const SEED = [
  { id:"commons-ajmer-dargah-sharif-1893", localName:"ajmer-dargah-sharif-1893.jpg", workType:"photo", title:"Dargah Sharif, Ajmer, 1893", artistOrCreator:null, depictedDate:{minYear:1893,maxYear:1893}, creationDate:{minYear:1893,maxYear:1893}, placeId:"ajmer-in", region:"South Asia", difficulty:3, landmarkCategory:"religious", tags:["dargah","dome","courtyard-steps"], era:"1890s", license:"Public Domain (no known copyright restrictions, British Library Mechanical Curator collection)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Ajmer_Sharif_Dargah_1893.jpg", creditText:"British Library / James Douglas, Bombay and Western India", context:"The courtyard and dome of the Dargah Sharif shrine complex in Ajmer, 1893." },
  { id:"commons-bareilly-hafiz-rahmat-khan-1814", localName:"bareilly-hafiz-rahmat-khan-mausoleum-1814.jpg", workType:"drawing", title:"The mausoleum of Hafiz Rahmat Khan at Bareilly, 1814-15", artistOrCreator:"Sita Ram", depictedDate:{minYear:1814,maxYear:1815}, creationDate:{minYear:1814,maxYear:1815}, placeId:"bareilly-in", region:"South Asia", difficulty:4, landmarkCategory:"mausoleum", tags:["watercolor","gateway","chandelier"], era:"1810s", license:"Public Domain Mark 1.0 (life+100 / pre-1931)", sourceUrl:"https://commons.wikimedia.org/wiki/File:The_mausoleum_of_Hafiz_Rahmat_Khan_at_Bareilly,_1814-15.jpg", creditText:"Sita Ram", context:"The gateway to the mausoleum of Hafiz Rahmat Khan in Bareilly, 1814-15 watercolor by Sita Ram." },
  { id:"commons-gwalior-man-mandir-1882", localName:"gwalior-man-mandir-interior-1882.jpg", workType:"photo", title:"Interior of North Room, Man Mandir, Gwalior Fort", artistOrCreator:"Lala Deen Dayal", depictedDate:{minYear:1882,maxYear:1882}, creationDate:{minYear:1882,maxYear:1882}, placeId:"gwalior-in", region:"South Asia", difficulty:4, landmarkCategory:"palace-interior", tags:["carved-columns","fort-interior"], era:"1880s", license:"Public Domain Mark 1.0 (life+70)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Interior_of_North_Room,_Man_Mandir,_Gwalior_Fort..jpg", creditText:"Lala Deen Dayal", context:"The carved stone columns of the Man Mandir Palace inside Gwalior Fort, 1882." },
  { id:"commons-kolhapur-royal-palace-gateway-1872", localName:"kolhapur-royal-palace-gateway-1872.jpg", workType:"drawing", title:"Gateway of Royal Palace, Kolhapur", artistOrCreator:null, depictedDate:{minYear:1872,maxYear:1872}, creationDate:{minYear:1872,maxYear:1872}, placeId:"kolhapur-in", region:"South Asia", difficulty:4, landmarkCategory:"palace-gateway", tags:["triple-arch","engraving"], era:"1870s", license:"Public Domain (PD-India)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Gateway_of_Royal_Palace,_Kolhapur.jpg", creditText:"Diary of the late Rajah of Kolhapoor, during his visit to Europe in 1870", context:"The triple-arched gateway of the Royal Palace in Kolhapur, 1872 engraving." },
  { id:"commons-nashik-godavari-1880", localName:"nashik-godavari-riverside-1880.jpg", workType:"photo", title:"River Godavari, Nashik (c. 1880)", artistOrCreator:null, depictedDate:{minYear:1880,maxYear:1880}, creationDate:{minYear:1880,maxYear:1880}, placeId:"nashik-in", region:"South Asia", difficulty:4, landmarkCategory:"riverfront", tags:["ghats","pilgrims","hills"], era:"1880s", license:"Public Domain Mark 1.0", sourceUrl:"https://commons.wikimedia.org/wiki/File:River_Godavari,_Nashik_(c._1880).jpg", creditText:"Wikimedia Commons", context:"Pilgrims gathered on the Godavari riverbank at Nashik, an albumen photograph, c.1880." },
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
