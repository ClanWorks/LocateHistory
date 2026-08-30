// Wave 3c: Caucasus + Central Asia batch from the "roll toward 1000" push (2026-08-23).
// 9 zero-coverage gap-closers (Ashgabat, Khiva, Kashgar, Almaty, Astana, Batumi,
// Sukhumi, Gyumri, Nakhchivan) plus a second image each for Samarkand and Bukhara.
// Every item independently re-verified (sourceUrl/license re-checked, image
// personally re-viewed) before being added here.
//
// Run once, from the repo root: node scripts/migrate-build-seed-items-wave3c.js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const itemsPath = path.join(__dirname, "..", "content", "source", "items.json");
const gazetteerPath = path.join(__dirname, "..", "content", "source", "gazetteer.json");

const APPROVED_AT = "2026-08-23T13:30:00.000Z";
const NOTES = "Wave 3 ('roll toward 1000') batch, sourced by a background research agent and independently re-verified (sourceUrl/license re-checked against the live Commons page, image personally re-viewed) before approval.";

const SEED = [
  { id:"commons-ashgabat-garrison-church-1902", localName:"ashgabat-garrison-church-1902.jpg", workType:"photo", title:"Collegiate Church of Archangel Michael, Askhabad", artistOrCreator:null, depictedDate:{minYear:1902,maxYear:1902}, creationDate:{minYear:1902,maxYear:1902}, placeId:"ashgabat-tm", region:"Central Asia", difficulty:3, landmarkCategory:"religious", tags:["church","onion-domes","garrison"], era:"1900s", license:"Public Domain (PD-US, pre-1923)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Collegiate_Church_of_Archangel_Michael_Ashabad82.jpg", creditText:"Wikimedia Commons", context:"The garrison's Collegiate Church of Archangel Michael in Askhabad (now Ashgabat), 1902 postal card.", curationNotes:"Cropped to remove a printed title band above and credit line below in a separate white margin outside the photo frame." },
  { id:"commons-khiva-russians-entering-1873", localName:"khiva-russians-entering-1873.jpg", workType:"drawing", title:"Russian Troops Entering the City of Khiva", artistOrCreator:null, depictedDate:{minYear:1873,maxYear:1873}, creationDate:{minYear:1873,maxYear:1873}, placeId:"khiva-uz", region:"Central Asia", difficulty:2, landmarkCategory:"fortification-cityscape", tags:["city-walls","engraving","conquest"], era:"1870s", license:"Public Domain (CC-PD-Mark)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Russians_entering_khiva_1873.jpg", creditText:"Illustrated London News", context:"Russian troops entering Khiva at the Hazar-Asp Gate during the Russian conquest, 1873 engraving.", curationNotes:"Cropped to the framed illustration only, removing a printed caption in a separate white margin below plus journal masthead text in the right margin." },
  { id:"commons-kashgar-city-wall-1915", localName:"kashgar-city-wall-panorama-1915.jpg", workType:"photo", title:"The City of Kashgar", artistOrCreator:null, depictedDate:{minYear:1915,maxYear:1915}, creationDate:{minYear:1915,maxYear:1915}, placeId:"kashgar-cn", region:"Central Asia", difficulty:3, landmarkCategory:"cityscape", tags:["mud-brick","city-wall","oasis"], era:"1910s", license:"Public Domain", sourceUrl:"https://commons.wikimedia.org/wiki/File:The_City_of_Kashgar.jpg", creditText:"Wikimedia Commons", context:"Kashgar's mud-brick rooftops and city wall toward the surrounding oasis, 1915." },
  { id:"commons-almaty-verny-palace-square-1887", localName:"almaty-verny-palace-square-1887.jpg", workType:"photo", title:"Верный, Дворцовая пл., гимназия", artistOrCreator:null, depictedDate:{minYear:1885,maxYear:1887}, creationDate:{minYear:1885,maxYear:1887}, placeId:"almaty-kz", region:"Central Asia", difficulty:4, landmarkCategory:"street", tags:["palace-square","gymnasium","pre-earthquake"], era:"1880s", license:"Public Domain", sourceUrl:"https://commons.wikimedia.org/wiki/File:Верный._Дворцовая_пл.,_гимназия.(N1129)Ордэн,~1887_Альбом.1-4.Кавказ_и_Ср.Азия_13_4a7c020a91_o_e1.jpg", creditText:"Wikimedia Commons", context:"Palace Square and the gymnasium in Verny (now Almaty), before the 1887 earthquake.", curationNotes:"Cropped to remove a small etched annotation at the bottom edge over the plain dirt road." },
  { id:"commons-astana-akmolinsk-fortress-1900s", localName:"astana-akmolinsk-fortress-remains-1900s.jpg", workType:"photo", title:"Акмолинская казачья крепость", artistOrCreator:null, depictedDate:{minYear:1900,maxYear:1909}, creationDate:{minYear:1900,maxYear:1909}, placeId:"astana-kz", region:"Central Asia", difficulty:4, landmarkCategory:"fortification", tags:["cossack-fortress","remains","postcard"], era:"1900s", license:"Public Domain", sourceUrl:"https://commons.wikimedia.org/wiki/File:Акмолинская_казачья_крепость.jpg", creditText:"State Archive of Astana City", context:"Remains of the old Cossack fortress in Akmolinsk, the pre-Soviet name of Astana, early 1900s.", curationNotes:"Cropped to remove a printed caption across the top sky band." },
  { id:"commons-samarkand-registan-ulugbek-1910", localName:"samarkand-registan-ulugbek-madrasah-1910.jpg", workType:"photo", title:"Ulugh Beg Madrasah, Registan Square", artistOrCreator:"Sergei Prokudin-Gorsky", depictedDate:{minYear:1905,maxYear:1915}, creationDate:{minYear:1905,maxYear:1915}, placeId:"samarkand-uz", region:"Central Asia", difficulty:1, landmarkCategory:"religious-monument", tags:["registan","madrasah","color-photograph"], era:"1910s", license:"Public Domain", sourceUrl:"https://commons.wikimedia.org/wiki/File:Gorskii_21724u.jpg", creditText:"Sergei Prokudin-Gorsky / Library of Congress", context:"An early color photograph of the Ulugh Beg Madrasah on Registan Square, Samarkand, c.1910." },
  { id:"commons-bukhara-ark-sentry-1910", localName:"bukhara-ark-sentry-cannons-1910.jpg", workType:"photo", title:"Sentry at the palace, and old cannons, Bukhara", artistOrCreator:"Sergei Prokudin-Gorsky", depictedDate:{minYear:1905,maxYear:1915}, creationDate:{minYear:1905,maxYear:1915}, placeId:"bukhara-uz", region:"Central Asia", difficulty:3, landmarkCategory:"fortress-palace", tags:["ark-fortress","sentry","cannons"], era:"1910s", license:"Public Domain", sourceUrl:"https://commons.wikimedia.org/wiki/File:Sergei_Michailowitsch_Prokudin-Gorski_-_Sentry_at_the_palace,_and_old_cannons._Bukhara.jpg", creditText:"Sergei Prokudin-Gorsky / Library of Congress", context:"A sentry and old cannons at the Ark palace in Bukhara, snow on the ground, c.1910." },
  { id:"commons-batumi-port-1884", localName:"batumi-port-harbor-engraving-1884.jpg", workType:"drawing", title:"Port of Batum", artistOrCreator:"Hermann Roskoschny", depictedDate:{minYear:1884,maxYear:1884}, creationDate:{minYear:1884,maxYear:1884}, placeId:"batumi-ge", region:"Caucasus", difficulty:4, landmarkCategory:"harbor", tags:["sailing-ships","engraving","mountains"], era:"1880s", license:"Public Domain", sourceUrl:"https://commons.wikimedia.org/wiki/File:Port_of_Batum_(Roskoschny,_1884).JPG", creditText:"Hermann Roskoschny, 1884", context:"Batum's harbor with sailing ships and a steamer, the Adjara mountains behind, 1884 engraving." },
  { id:"commons-sukhumi-vereshchagin-1870s", localName:"sukhumi-vereshchagin-painting-1870s.jpg", workType:"painting", title:"Sukhum-Kale", artistOrCreator:"Pyotr Vereshchagin", depictedDate:{minYear:1870,maxYear:1879}, creationDate:{minYear:1870,maxYear:1879}, placeId:"sukhumi-ge", region:"Caucasus", difficulty:4, landmarkCategory:"landscape-harbor", tags:["waterfront","cypress-trees","oil-painting"], era:"1870s", license:"Public Domain", sourceUrl:"https://commons.wikimedia.org/wiki/File:Vereschagin_Sukhum-kale.jpg", creditText:"Pyotr Vereshchagin", context:"The Sukhum-Kale waterfront with its cypress-lined promenade and pier, 19th-century oil painting." },
  { id:"commons-gyumri-alexandropol-1915", localName:"gyumri-alexandropol-panorama-1915.jpg", workType:"photo", title:"Gyumri in 1915-1920", artistOrCreator:null, depictedDate:{minYear:1915,maxYear:1920}, creationDate:{minYear:1915,maxYear:1920}, placeId:"gyumri-am", region:"Caucasus", difficulty:3, landmarkCategory:"cityscape", tags:["holy-savior-church","skyline","panorama"], era:"1910s", license:"Public Domain", sourceUrl:"https://commons.wikimedia.org/wiki/File:Gyumri_in_1915-1920.jpg", creditText:"Wikimedia Commons", context:"A panoramic view of Alexandropol (now Gyumri) with the domed Holy Savior Church on the skyline, 1915-1920.", curationNotes:"Cropped to remove a handwritten label and plate number at the top over blank sky." },
  { id:"commons-nakhchivan-approach-caravan-1854", localName:"nakhchivan-approach-caravan-1854.jpg", workType:"drawing", title:"Aux approches de Nakhitschevan", artistOrCreator:null, depictedDate:{minYear:1854,maxYear:1854}, creationDate:{minYear:1854,maxYear:1854}, placeId:"nakhchivan-az", region:"Caucasus", difficulty:4, landmarkCategory:"genre-scene", tags:["caravan","lithograph","city-walls"], era:"1850s", license:"Public Domain", sourceUrl:"https://commons.wikimedia.org/wiki/File:Plate_6._Aux_approches_de_Nakhitschevan_-_'Voyage_en_Persee.'_Troisi%C3%A8me_%C3%89dition._L._Curmer_%26_V._Lecou,_Paris_(1854).jpg", creditText:"Voyage en Perse, L. Curmer & V. Lecou, Paris, 1854", context:"A mounted caravan approaching Nakhitschevan (now Nakhchivan), with the town's walls in the distance, 1854 lithograph.", curationNotes:"Cropped to the illustration only, removing a printed title and credit lines in a separate white page margin below." },
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
