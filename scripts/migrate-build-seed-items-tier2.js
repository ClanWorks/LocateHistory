// Tier 2: 13 curator source items from genuinely new sourcing (the
// original Firestore export was fully exhausted by Tier 1 — every
// remaining record was checked and either approved, rejected, or
// held; see CURATION_NOTES.md). These 13 came from direct Wikimedia
// Commons category browsing, chosen for geographic diversity against
// gaps in the post-Tier-1 pool (no East/Southeast Asia beyond Seoul,
// no Southern Europe, no Central Europe beyond Prague, no Russia
// beyond Kazan, thin Africa/South America). Same two-gate process as
// every prior batch: real Commons license verification, then a direct
// visual inspection of every image for baked-in spoiler text. 17
// candidates were sourced; 1 (Melbourne) was too small; 3 more
// (Tokyo, Buenos Aires, Rio) were confirmed spoilers and pulled.
//
// Run once, from the repo root: node scripts/migrate-build-seed-items-tier2.js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const itemsPath = path.join(__dirname, "..", "content", "source", "items.json");
const gazetteerPath = path.join(__dirname, "..", "content", "source", "gazetteer.json");

const APPROVED_AT = "2026-08-12T00:00:00.000Z";
const NOTES = "Tier 2: new sourcing beyond the original Firestore export. License verified against Commons file page and image visually inspected for baked-in spoiler text before approval.";

const SEED = [
  {
    id: "commons-rome-piazza-venezia-1895", localName: "rome-piazza-venezia-1895.jpg", workType: "photo",
    title: "Piazza Venezia, Rome, ca. 1895", artistOrCreator: null,
    depictedDate: { minYear: 1895, maxYear: 1895 }, creationDate: { minYear: 1890, maxYear: 1900 },
    placeId: "rome-it", region: "Southern Europe", difficulty: 3, landmarkCategory: "plaza",
    tags: ["street", "shops", "tram"], era: "1890s",
    license: "CC BY 2.0 (Photochrom print, Photoglob Zürich, via Library of Congress Photochrom Collection; Flickr Commons upload)",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Flickr_-_%E2%80%A6trialsanderrors_-_Piazza_Venezia,_Rome,_Italy,_ca._1895.jpg", creditText: "Photoglob Zürich / Library of Congress",
    context: "Piazza Venezia's arcaded shopfronts and horse-drawn omnibuses, photographed not long before the Vittoriano monument rose over the square's eastern side.",
  },
  {
    id: "commons-cairo-vue-du-caire", localName: "cairo-vue-du-caire.jpg", workType: "painting",
    title: "Vue du Caire", artistOrCreator: "Charles-Théodore Frère",
    depictedDate: { minYear: 1850, maxYear: 1888 }, creationDate: { minYear: 1850, maxYear: 1888 },
    placeId: "cairo-eg", region: "North Africa", difficulty: 5, landmarkCategory: null,
    tags: ["caravan", "desert", "painting"], era: "mid-1800s",
    license: "CC BY-SA 4.0 (photograph of a public domain painting; Charles-Théodore Frère, 1814–1888, life+100 expired)",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Charles-Th%C3%A9odore_Fr%C3%A8re_-_Vue_du_Caire_01.jpg", creditText: "Charles-Théodore Frère",
    context: "Orientalist painter Charles-Théodore Frère spent decades based in Cairo; this caravan resting outside a domed gateway is one of his many studies of the city's outskirts.",
  },
  {
    id: "commons-bangkok-wat-arun-1865", localName: "bangkok-wat-arun-panorama-1865.jpg", workType: "photo",
    title: "Bangkok Panorama from Wat Arun", artistOrCreator: "John Thomson",
    depictedDate: { minYear: 1865, maxYear: 1865 }, creationDate: { minYear: 1865, maxYear: 1865 },
    placeId: "bangkok-th", region: "Southeast Asia", difficulty: 2, landmarkCategory: "temple",
    tags: ["temple", "river", "panorama"], era: "1860s",
    license: "Public Domain (John Thomson, 1837–1921; life+100 expired)",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Bangkok_Panorama_from_Wat_Arun_by_John_Thomson_1865.jpg", creditText: "John Thomson",
    context: "Pioneering photographer John Thomson captured the Chao Phraya River and the Grand Palace's temple roofs from atop Wat Arun, one of the earliest photographic panoramas of Bangkok.",
  },
  {
    id: "commons-shanghai-the-bund-1890", localName: "shanghai-the-bund-1890.jpg", workType: "photo",
    title: "The Bund, Shanghai, c.1890s", artistOrCreator: null,
    depictedDate: { minYear: 1890, maxYear: 1899 }, creationDate: { minYear: 1890, maxYear: 1899 },
    placeId: "shanghai-cn", region: "East Asia", difficulty: 3, landmarkCategory: "waterfront",
    tags: ["waterfront", "colonial", "boats"], era: "1890s",
    license: "Public Domain (published before 1931 in the US)",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:The_Bund,_Shanghai,_c1890s.jpg", creditText: "Wikimedia Commons",
    context: "The Bund's row of foreign trading-house buildings along the Huangpu River made it the commercial face of treaty-port Shanghai.",
  },
  {
    id: "commons-stockholm-drottninggatan", localName: "stockholm-drottninggatan-1880.jpg", workType: "photo",
    title: "Drottninggatan, Stockholm", artistOrCreator: "Ole Tobias Olsen",
    depictedDate: { minYear: 1860, maxYear: 1883 }, creationDate: { minYear: 1860, maxYear: 1883 },
    placeId: "stockholm-se", region: "Northern Europe", difficulty: 4, landmarkCategory: "street",
    tags: ["street", "waterfront", "shops"], era: "1870s",
    license: "Public Domain (PD-Norway50; Ole Tobias Olsen, 1830–1924)",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:341._Stockholm._Parti_av_Drottninggatan_%28retouched%29.jpg", creditText: "Ole Tobias Olsen, National Library of Norway",
    context: "Antiquities dealers and tailors' shops line a waterside stretch of Drottninggatan, one of central Stockholm's oldest streets.",
  },
  {
    id: "commons-istanbul-galata-bridge", localName: "istanbul-galata-bridge-1890.jpg", workType: "photo",
    title: "Bridge and Galata Area, Istanbul", artistOrCreator: "Abdullah Frères",
    depictedDate: { minYear: 1880, maxYear: 1893 }, creationDate: { minYear: 1880, maxYear: 1893 },
    placeId: "istanbul-tr", region: "Middle East", difficulty: 2, landmarkCategory: "bridge",
    tags: ["bridge", "tower", "harbour"], era: "1880s",
    license: "Public Domain (Abdul Hamid II Collection, Library of Congress; no known copyright restrictions)",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Bridge_and_Galata_Area,_Istanbul,_Turkey_by_Abdullah_Fr%C3%A8res,_ca._1880-1893_(LOC).jpg", creditText: "Abdullah Frères, Library of Congress",
    context: "The medieval Galata Tower rises over the Golden Horn beyond the crowded Galata Bridge, a crossing point between old Constantinople and its European quarter.",
  },
  {
    id: "commons-cape-town-adderley-street", localName: "cape-town-adderley-street-1897.jpg", workType: "photo",
    title: "Adderley Street, Cape Town, looking NE, ca. 1897", artistOrCreator: null,
    depictedDate: { minYear: 1897, maxYear: 1897 }, creationDate: { minYear: 1897, maxYear: 1897 },
    placeId: "cape-town-za", region: "Southern Africa", difficulty: 4, landmarkCategory: "street",
    tags: ["street", "colonial", "shops"], era: "1890s",
    license: "Public Domain (South African Copyright Act No. 98 of 1978)",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Adderley_Street,_Cape_Town,_looking_NE_-_ca._1897.jpg", creditText: "Wikimedia Commons",
    context: "Adderley Street, Cape Town's main commercial thoroughfare since Dutch colonial times, crowded with carriages and department-store awnings by the 1890s.",
  },
  {
    id: "commons-vienna-naschmarkt-1898", localName: "vienna-naschmarkt-1898.jpg", workType: "photo",
    title: "Naschmarkt, Vienna, c.1898", artistOrCreator: "August Stauda",
    depictedDate: { minYear: 1898, maxYear: 1898 }, creationDate: { minYear: 1898, maxYear: 1898 },
    placeId: "vienna-at", region: "Central Europe", difficulty: 3, landmarkCategory: "market",
    tags: ["market", "street", "tram"], era: "1890s",
    license: "Public Domain (August Stauda, 1861–1928; life+70 expired)",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Naschmarkt_um_1898.jpg", creditText: "August Stauda",
    context: "Vienna's Naschmarkt, still the city's best-known market today, already stretched along the Wienfluss under a sea of vendor umbrellas by the 1890s.",
  },
  {
    id: "commons-moscow-vshivaya-gorka", localName: "moscow-vshivaya-gorka-1884.jpg", workType: "photo",
    title: "View across the River from Vshivaya Gorka, Moscow", artistOrCreator: "Nikolay Naidenov",
    depictedDate: { minYear: 1884, maxYear: 1884 }, creationDate: { minYear: 1884, maxYear: 1884 },
    placeId: "moscow-ru", region: "Eastern Europe", difficulty: 4, landmarkCategory: "riverside",
    tags: ["church", "river", "skyline"], era: "1880s",
    license: "Public Domain (Nikolay Naidenov, 1834–1905; published before 1931 in the US)",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Vshivaya_Gorka,_View_across_the_River_Moscow.jpg", creditText: "Nikolay Naidenov",
    context: "Onion-domed church towers rise above the Moskva riverbank in this view from Vshivaya Gorka, photographed for Naidenov's survey of Moscow's historic districts.",
  },
  {
    id: "commons-manila-view-1826", localName: "manila-view-1826.png", workType: "drawing",
    title: "View of Manila, Capital of Luzon Island", artistOrCreator: "Friedrich Heinrich von Kittlitz",
    depictedDate: { minYear: 1826, maxYear: 1826 }, creationDate: { minYear: 1826, maxYear: 1826 },
    placeId: "manila-ph", region: "Southeast Asia", difficulty: 5, landmarkCategory: null,
    tags: ["mission", "genre-scene", "colonial"], era: "1820s",
    license: "Public Domain (Friedrich Heinrich von Kittlitz, 1799–1874; life+70 expired)",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:View_of_Manila,_Capital_of_Luzon_Island,_Philippine_Islands,_1826-1829.png", creditText: "Friedrich Heinrich von Kittlitz, National Library of Russia",
    context: "Naturalist-artist Friedrich Heinrich von Kittlitz sketched this scene of a Manila church and outlying houses during the Russian corvette Seniavin's 1826–1829 voyage of exploration.",
  },
  {
    id: "commons-batavia-kali-besar-1875", localName: "batavia-kali-besar-1875.jpg", workType: "photo",
    title: "De rede van Batavia, de Kali Besar en de Kleine Boom", artistOrCreator: "Woodbury & Page",
    depictedDate: { minYear: 1875, maxYear: 1875 }, creationDate: { minYear: 1875, maxYear: 1875 },
    placeId: "jakarta-id", region: "Southeast Asia", difficulty: 3, landmarkCategory: "canal",
    tags: ["canal", "warehouse", "colonial"], era: "1870s",
    license: "Public Domain (Woodbury & Page; life+70 expired)",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Collectie_NMvWereldculturen,_RV-A131-32,_Foto,_%27De_rede_van_Batavia,_de_Kali_Besar_en_de_Kleine_Boom_met_de_Hoenderpasarbrug_en_pakhuizen%27,_fotograaf_Woodbury_%26_Page,_ca._1875.jpg", creditText: "Woodbury & Page, Nationaal Museum van Wereldculturen",
    context: "Warehouses line the Kali Besar canal at Batavia's roadstead — colonial Jakarta's harbor district, and still the site of the old town today.",
  },
  {
    id: "commons-algiers-bay-1899", localName: "algiers-bay-1899.jpg", workType: "photo",
    title: "Algiers Bay, ca. 1899", artistOrCreator: null,
    depictedDate: { minYear: 1890, maxYear: 1905 }, creationDate: { minYear: 1890, maxYear: 1905 },
    placeId: "algiers-dz", region: "North Africa", difficulty: 3, landmarkCategory: "harbour",
    tags: ["harbour", "hillside", "panorama"], era: "1890s",
    license: "Public Domain (photochrom print, published before 1931 in the US)",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Algiers_bay_1899.jpg", creditText: "Library of Congress",
    context: "\"Algiers the White\" climbs the hillside above its bay in this photochrom print, its terraced Ottoman-and-French-era skyline still recognizable today.",
  },
  {
    id: "commons-lima-plaza-mayor-1870", localName: "lima-plaza-mayor-1870.jpg", workType: "photo",
    title: "Plaza Mayor de Lima, ca. 1870", artistOrCreator: "Eugenio Courret",
    depictedDate: { minYear: 1870, maxYear: 1870 }, creationDate: { minYear: 1870, maxYear: 1870 },
    placeId: "lima-pe", region: "South America", difficulty: 2, landmarkCategory: "cathedral",
    tags: ["cathedral", "plaza", "colonial"], era: "1870s",
    license: "Public Domain (PD-Peru-photo; PD-1923)",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Plaza_mayor_de_Lima,_a%C3%B1o_1870.jpg", creditText: "Eugenio Courret",
    context: "Lima Cathedral's twin bell towers dominate the Plaza Mayor, the same square where Francisco Pizarro founded the city in 1535.",
  },
];

function main() {
  const items = JSON.parse(fs.readFileSync(itemsPath, "utf8"));
  const gazetteer = JSON.parse(fs.readFileSync(gazetteerPath, "utf8"));
  const countryByPlaceId = new Map(gazetteer.map((g) => [g.id, g.country]));
  const existingIds = new Set(items.map((i) => i.id));
  let added = 0;

  for (const s of SEED) {
    if (existingIds.has(s.id)) {
      console.log(`skip (already present): ${s.id}`);
      continue;
    }
    const country = countryByPlaceId.get(s.placeId);
    if (!country) throw new Error(`no gazetteer entry for placeId ${s.placeId}`);
    items.push({
      schemaVersion: 1,
      id: s.id,
      status: "approved",
      workType: s.workType,
      title: s.title,
      artistOrCreator: s.artistOrCreator,
      depictedDate: s.depictedDate,
      creationDate: s.creationDate,
      location: { placeId: s.placeId, acceptedPlaceIds: [] },
      classification: { region: s.region, difficulty: s.difficulty, landmarkCategory: s.landmarkCategory, tags: s.tags },
      clues: { region: s.region, era: s.era, country },
      media: { originalPath: s.localName, focalPoint: null },
      attribution: { source: "Wikimedia Commons", license: s.license, sourceUrl: s.sourceUrl, creditText: s.creditText },
      context: s.context,
      contentWarning: null,
      curation: { approvedBy: "andrew", approvedAt: APPROVED_AT, notes: NOTES },
      importSource: `commons:${s.id}`,
      createdAt: APPROVED_AT,
      updatedAt: APPROVED_AT,
    });
    added++;
  }

  fs.writeFileSync(itemsPath, JSON.stringify(items, null, 2) + "\n");
  console.log(`\n${added} item(s) added; ${items.length} total in items.json`);
}

main();
