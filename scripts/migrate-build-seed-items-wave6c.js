// Wave 6c: major-capital depth batch, continued. Athens and Istanbul third images.
// Run once, from the repo root: node scripts/migrate-build-seed-items-wave6c.js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const itemsPath = path.join(__dirname, "..", "content", "source", "items.json");
const gazetteerPath = path.join(__dirname, "..", "content", "source", "gazetteer.json");

const APPROVED_AT = "2026-08-25T10:00:00.000Z";
const NOTES = "Wave 6 (backlog finishing pass, continued) batch: the curator personally downloaded (using the curl -4 IPv4 workaround) and visually inspected this image before approval.";

const SEED = [
  { id:"commons-athens-hadrians-arch-1890", localName:"athens-hadrians-arch-1890.jpg", workType:"drawing", title:"Hadrian's Arch", artistOrCreator:"Themistocles von Eckenbrecher", depictedDate:{minYear:1890,maxYear:1890}, creationDate:{minYear:1890,maxYear:1890}, placeId:"athens-gr", region:"Southern Europe", difficulty:2, landmarkCategory:"ancient-ruins", tags:["hadrians-arch","acropolis-backdrop","watercolor"], era:"1890s", license:"CC0 (National Gallery of Art)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Themistocles_von_Eckenbrecher,_Hadrian%27s_Arch,_1890,_NGA_56253.jpg", creditText:"Themistocles von Eckenbrecher / National Gallery of Art", context:"Hadrian's Arch in Athens with the Acropolis visible on the hill behind, 1890 watercolor and pen drawing." },
  { id:"commons-istanbul-blue-mosque-1880", localName:"istanbul-blue-mosque-obelisk-1880.jpg", workType:"photo", title:"Mosquée du Sultan Ahmed", artistOrCreator:"Abdullah Frères", depictedDate:{minYear:1880,maxYear:1893}, creationDate:{minYear:1880,maxYear:1893}, placeId:"istanbul-tr", region:"Middle East", difficulty:1, landmarkCategory:"religious-site", tags:["blue-mosque","obelisk-of-theodosius","hippodrome"], era:"1880s", license:"Public Domain (life+100 / pre-1931)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Mosque%C3%A9_du_Sultan_Ahmed_-_Abdullah_Fr%C3%A8res._LCCN2003677072.jpg", creditText:"Abdullah Frères / Library of Congress", context:"The Sultan Ahmed (Blue) Mosque and the Obelisk of Theodosius in the Hippodrome, Istanbul, c.1880-1893." },
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
