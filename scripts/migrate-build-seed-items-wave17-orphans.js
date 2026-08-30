// Wave 17 orphan recovery: 3 depth images (Podgorica, Pristina, Thessaloniki) were
// downloaded by the Eastern Europe wave-17 agent but never integrated before it hit
// a session rate limit. Recovered via orphan audit; real Commons sourceUrls found by
// visually matching each orphaned file against Commons search candidates (not guessed)
// and independently re-verified (license + spoiler-check) by the curator.
// Run once, from the repo root: node scripts/migrate-build-seed-items-wave17-orphans.js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const itemsPath = path.join(__dirname, "..", "content", "source", "items.json");
const gazetteerPath = path.join(__dirname, "..", "content", "source", "gazetteer.json");

const APPROVED_AT = "2026-08-28T12:30:00.000Z";
const NOTES = "Wave 17 (recovered orphan): downloaded by a sourcing agent that hit a session-level rate limit before it could integrate; the curator found the real Commons source by visually matching the orphaned file against Commons search candidates (not guessed), independently re-verified the license fresh, and personally re-confirmed the visual spoiler check before approval.";

const SEED = [
  { id:"commons-podgorica-ribnica-fortress-1916", localName:"podgorica-ribnica-fortress-1916.jpg", workType:"photo", title:"Views of Podgorica, taken February 1916 (Ribnica fortress)", artistOrCreator:null, depictedDate:{minYear:1916,maxYear:1916}, creationDate:{minYear:1916,maxYear:1916}, placeId:"podgorica-me", region:"Balkans", difficulty:4, landmarkCategory:"fortress", tags:["fortress-wall","riverside","radio-mast","houses"], era:"1910s", license:"Public Domain", sourceUrl:"https://commons.wikimedia.org/wiki/File:Ansichten_aus_Podgorica._Aufgenommen_im_Februar_1916._(BildID_15454686).jpg", creditText:"German WWI military archive (Bundesarchiv-style BildID series)", context:"The Ribnica fortress walls on a rocky bluff above the river, with a row of houses at the waterline and a wireless radio mast on the hilltop behind, February 1916." },
  { id:"commons-pristina-district-administration-1913", localName:"pristina-district-administration-1913.jpg", workType:"photo", title:"District Administration in Pristina (Okružno načelstvo u Prištini)", artistOrCreator:null, depictedDate:{minYear:1913,maxYear:1913}, creationDate:{minYear:1913,maxYear:1913}, placeId:"pristina-xk", region:"Balkans", difficulty:4, landmarkCategory:"government-building", tags:["administration-building","minaret","trees"], era:"1910s", license:"Public Domain", sourceUrl:"https://commons.wikimedia.org/wiki/File:Okru%C5%BEno_na%C4%8Delstvo_u_Pri%C5%A1tini.jpg", creditText:"Wikimedia Commons", context:"The District Administration building in Pristina, 1913, with a minaret visible behind the trees to its left." },
  { id:"commons-thessaloniki-white-tower-promenade-1919", localName:"thessaloniki-white-tower-promenade.jpg", workType:"drawing", title:"La Tour Blanche à Salonique, avant 1919", artistOrCreator:null, depictedDate:{minYear:1910,maxYear:1919}, creationDate:{minYear:1919,maxYear:1919}, placeId:"thessaloniki-gr", region:"Balkans", difficulty:2, landmarkCategory:"tower", tags:["waterfront","promenade","hand-colored"], era:"1910s", license:"Public Domain", sourceUrl:"https://commons.wikimedia.org/wiki/File:Salonique-La_tour_blanche_1919.jpg", creditText:"Wikimedia Commons", context:"A hand-colored postcard view of the White Tower and the seaside promenade of Thessaloniki, the favorite walk of the city's residents, before 1919." },
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
      curation: { approvedBy: "andrew", approvedAt: APPROVED_AT, notes: NOTES },
      importSource: `commons:${s.id}`, createdAt: APPROVED_AT, updatedAt: APPROVED_AT,
    });
    added++;
  }
  fs.writeFileSync(itemsPath, JSON.stringify(items, null, 2) + "\n");
  console.log(`\n${added} item(s) added; ${items.length} total in items.json`);
}
main();
