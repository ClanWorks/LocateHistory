// Wave 6d: major-capital depth batch, final. Amsterdam and Prague third images —
// completes the whole 8-capital depth pass (Rome, Vienna, Berlin, Madrid, Athens,
// Istanbul, Amsterdam, Prague).
// Run once, from the repo root: node scripts/migrate-build-seed-items-wave6d.js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const itemsPath = path.join(__dirname, "..", "content", "source", "items.json");
const gazetteerPath = path.join(__dirname, "..", "content", "source", "gazetteer.json");

const APPROVED_AT = "2026-08-25T10:30:00.000Z";
const NOTES = "Wave 6 (backlog finishing pass, continued) batch: the curator personally downloaded (using the curl -4 IPv4 workaround) and visually inspected this image before approval.";

const SEED = [
  { id:"commons-amsterdam-rijksmuseum-1895", localName:"amsterdam-rijksmuseum-1895.jpg", workType:"photo", title:"Rijksmuseum Amsterdam, ca. 1895", artistOrCreator:null, depictedDate:{minYear:1895,maxYear:1895}, creationDate:{minYear:1895,maxYear:1895}, placeId:"amsterdam-nl", region:"Western Europe", difficulty:2, landmarkCategory:"museum", tags:["rijksmuseum","bridge","horse-carts"], era:"1890s", license:"Public Domain (pre-1931)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Rijksmuseum_Amsterdam_ca_1895.jpg", creditText:"Library of Congress (photochrom)", context:"The Rijksmuseum building and its approach bridge in Amsterdam, photochrom print, c.1895." },
  { id:"commons-prague-staromestske-namesti-1835", localName:"prague-staromestske-namesti-1835.jpg", workType:"drawing", title:"Praha, Staroměstské náměstí, c.1835", artistOrCreator:null, depictedDate:{minYear:1835,maxYear:1835}, creationDate:{minYear:1835,maxYear:1835}, placeId:"prague-cz", region:"Central Europe", difficulty:3, landmarkCategory:"square", tags:["old-town-hall","astronomical-clock-tower","marian-column"], era:"1830s", license:"Public Domain (PD-old)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Praha_Staromestske_namesti_c1835.jpg", creditText:"Wikimedia Commons", context:"The Old Town Square in Prague with the Old Town Hall tower, c.1835 engraving." },
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
