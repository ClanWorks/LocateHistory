// Wave 8a: 4 orphaned files recovered after a batch of retry agents hit a
// session-level API rate limit mid-task. Their real Commons File: pages were
// recovered from the agents' own transcripts and independently re-verified
// (license fetched fresh, image personally viewed for spoiler text) before
// integration — none of the sourceUrls here were guessed.
// Run once, from the repo root: node scripts/migrate-build-seed-items-wave8a.js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const itemsPath = path.join(__dirname, "..", "content", "source", "items.json");
const gazetteerPath = path.join(__dirname, "..", "content", "source", "gazetteer.json");

const APPROVED_AT = "2026-08-25T18:45:00.000Z";
const NOTES = "Wave 8 (recovered orphan) batch: downloaded by a sourcing agent that hit a session-level API rate limit before it could integrate; the curator independently re-fetched the Commons license page and personally re-verified the visual spoiler check before approval.";

const NEW_GAZETTEER = [
  { id: "wuxi-cn", displayName: "Wuxi", country: "China", countryCode: "CN", lat: 31.5900, lng: 120.3119, aliases: [], historicalNames: [] },
  { id: "zhenjiang-cn", displayName: "Zhenjiang", country: "China", countryCode: "CN", lat: 32.2044, lng: 119.4551, aliases: [], historicalNames: ["Chinkiang", "Chin-keang-foo"] },
];

const SEED = [
  { id:"commons-wuxi-old-library-1927", localName:"wuxi-old-library-1927.jpg", workType:"photo", title:"Wuxi Old Library, 1920s", artistOrCreator:null, depictedDate:{minYear:1927,maxYear:1927}, creationDate:{minYear:1927,maxYear:1927}, placeId:"wuxi-cn", region:"East Asia", difficulty:5, landmarkCategory:"civic-building", tags:["clock-tower","bare-trees","wrought-iron-gate"], era:"1920s", license:"Public Domain (PD-China)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Wuxi_Old_Library_1920s.jpg", creditText:"Wuxi Municipal Library collection", context:"The Wuxi County Library building in the 1920s, a Western-influenced clock tower and gatehouse behind bare winter trees.", curationNotes:"Chinese characters visible on the facade plaque are building signage identifying it as a library, not a place name — permitted under the landmark-naming exception." },
  { id:"commons-zhenjiang-chinkeangfoo-golden-island-1844", localName:"zhenjiang-chinkeangfoo-golden-island-1844.jpg", workType:"drawing", title:"Chin-keang-foo & Golden Island", artistOrCreator:"E. T. Wigan (engraver)", depictedDate:{minYear:1842,maxYear:1842}, creationDate:{minYear:1844,maxYear:1844}, placeId:"zhenjiang-cn", region:"East Asia", difficulty:5, landmarkCategory:"harbour", tags:["junks","pagoda","river-islands"], era:"1840s", license:"Public Domain Mark 1.0 (CC0)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Chin-keang-foo_%26_Golden_Island.jpg", creditText:"John Ouchterlony, The Chinese War (1844)", context:"An 1844 wood engraving of Golden Island (Jinshan) in the Yangtze near Zhenjiang, with junks under sail and a hilltop pagoda, from a First Opium War account." },
  { id:"commons-monterrey-obispado-cerro-de-la-silla-1904", localName:"monterrey-obispado-cerro-de-la-silla-1904.jpg", workType:"photo", title:"Monterrey entre el Obispado y el Cerro de la Silla, 1904", artistOrCreator:null, depictedDate:{minYear:1904,maxYear:1904}, creationDate:{minYear:1904,maxYear:1904}, placeId:"monterrey-mx", region:"North America", difficulty:3, landmarkCategory:"landmark-view", tags:["ruined-dome","saddle-mountain","hillside"], era:"1900s", license:"CC BY 2.0", sourceUrl:"https://commons.wikimedia.org/wiki/File:Monterrey_entre_el_Obispado_y_el_Cerro_de_la_Silla_1904.jpg", creditText:"Jorge Elías, via Elizabeth Visère McGary, An American Girl in Mexico (1904)", context:"The ruined dome of the Bishop's Palace (Palacio del Obispado) on a hillside above Monterrey, with the distinctive twin-peaked Cerro de la Silla behind, 1904." },
  { id:"commons-veracruz-puerto-1877", localName:"veracruz-port-aerial-lithograph-1877.png", workType:"drawing", title:"Puerto de Veracruz", artistOrCreator:"Casimiro Castro", depictedDate:{minYear:1877,maxYear:1877}, creationDate:{minYear:1877,maxYear:1877}, placeId:"veracruz-mx", region:"North America", difficulty:3, landmarkCategory:"cityscape-panorama", tags:["harbor","colored-lithograph","grid-streets"], era:"1870s", license:"Public Domain Mark 1.0", sourceUrl:"https://commons.wikimedia.org/wiki/File:01puertoDeVeracruz.png", creditText:"Casimiro Castro, Album del Ferrocarril Mexicano (1877)", context:"A colored lithograph bird's-eye view over the port and grid streets of Veracruz toward the Gulf coast, 1877." },
];

function main() {
  const items = JSON.parse(fs.readFileSync(itemsPath, "utf8"));
  const gazetteer = JSON.parse(fs.readFileSync(gazetteerPath, "utf8"));
  const existingGazIds = new Set(gazetteer.map((g) => g.id));
  for (const g of NEW_GAZETTEER) {
    if (existingGazIds.has(g.id)) { console.log(`skip gazetteer: ${g.id}`); continue; }
    gazetteer.push(g);
  }
  fs.writeFileSync(gazetteerPath, JSON.stringify(gazetteer, null, 2) + "\n");

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
