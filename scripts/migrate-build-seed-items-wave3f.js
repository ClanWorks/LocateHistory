// Wave 3f: South Asia gap-closers, finished centrally by the curator after the
// sourcing agent left them stalled (research complete, download blocked by
// Wikimedia rate-limiting) — completes all 12 originally-held South Asia cities
// plus a bonus 13th, Kandy (2026-08-23). Every item downloaded and personally
// visually inspected directly, several cropped to remove separable captions.
//
// Run once, from the repo root: node scripts/migrate-build-seed-items-wave3f.js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const itemsPath = path.join(__dirname, "..", "content", "source", "items.json");
const gazetteerPath = path.join(__dirname, "..", "content", "source", "gazetteer.json");

const APPROVED_AT = "2026-08-23T15:00:00.000Z";
const NOTES = "Wave 3 ('roll toward 1000') batch: sourcing agent left this candidate stalled (research complete, download blocked by Wikimedia rate-limiting); the curator personally downloaded, visually inspected, and (where noted) cropped it before approval.";

const SEED = [
  { id:"commons-surat-tapti-1782", localName:"surat-tapti-river-1782.jpg", workType:"drawing", title:"View of Surat from across the River Tapti", artistOrCreator:"A. van der Heen", depictedDate:{minYear:1782,maxYear:1782}, creationDate:{minYear:1782,maxYear:1782}, placeId:"surat-in", region:"South Asia", difficulty:4, landmarkCategory:"river-fort-view", tags:["river-tapti","fort","sailing-boats"], era:"1780s", license:"Public Domain (life+70 / CC-PD-Mark)", sourceUrl:"https://commons.wikimedia.org/wiki/File:View_of_Surat_from_across_the_River_Tapti;_by_A._van_der_Heen,_1782.jpg", creditText:"British Library", context:"Surat's fort and waterfront seen across the River Tapti, 1782 watercolor." },
  { id:"commons-indore-rajwada-palace", localName:"indore-rajwada-palace-1850s.jpg", workType:"drawing", title:"Gezigt op het Paleis van den Rajah van Indore", artistOrCreator:"A. Viejou (lithographer)", depictedDate:{minYear:1847,maxYear:1865}, creationDate:{minYear:1847,maxYear:1865}, placeId:"indore-in", region:"South Asia", difficulty:3, landmarkCategory:"palace", tags:["rajwada-palace","elephants","market"], era:"1850s", license:"CC0 (Rijksmuseum)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Gezicht_op_Rajwada_paleis_te_Indore_Gezigt_op_het_Paleis_van_den_Rajah_van_Indore_(titel_op_object),_RP-P-1937-297.jpg", creditText:"Rijksmuseum", context:"A tinted lithograph of the Rajwada Palace plaza in Indore with elephants and a busy crowd, mid-19th century.", curationNotes:"Cropped to remove a printed Dutch caption ('Gezigt op het Paleis van den Rajah van Indore') below the illustration, in a separate mount margin." },
  { id:"commons-amritsar-golden-temple-1858", localName:"amritsar-golden-temple-beato-1858.jpg", workType:"photo", title:"Sacred Temple - North East View", artistOrCreator:"Felice Beato", depictedDate:{minYear:1858,maxYear:1858}, creationDate:{minYear:1858,maxYear:1858}, placeId:"amritsar-in", region:"South Asia", difficulty:2, landmarkCategory:"religious", tags:["golden-temple","reflecting-pool","early-photograph"], era:"1850s", license:"Public Domain (life+100)", sourceUrl:"https://commons.wikimedia.org/wiki/File:'Sacred_Temple-_North_East_View',_by_Felice_Beato,_Amritsar,_ca.1858.jpg", creditText:"Felice Beato", context:"An early elevated view of the Golden Temple (Harmandir Sahib) in Amritsar, before its dome was fully gilded, 1858." },
  { id:"commons-srinagar-bridge-of-shops-1864", localName:"srinagar-bridge-of-shops-1864.jpg", workType:"photo", title:"Bridge of Shops, Srinagar, Kashmir", artistOrCreator:"Samuel Bourne", depictedDate:{minYear:1864,maxYear:1864}, creationDate:{minYear:1864,maxYear:1864}, placeId:"srinagar-in", region:"South Asia", difficulty:3, landmarkCategory:"bridge", tags:["wooden-bridge","river-jhelum","shops"], era:"1860s", license:"CC0 (Cleveland Museum of Art)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Samuel_Bourne_-_Bridge_of_Shops,_Srinagar,_Kashmir_-_1994.185_-_Cleveland_Museum_of_Art.tif", creditText:"Samuel Bourne", context:"A wooden bridge lined with shops over the Jhelum river in Srinagar, 1864." },
  { id:"commons-kanpur-magazine-bridge-1830", localName:"kanpur-magazine-bridge-1830.jpg", workType:"drawing", title:"Magazine Bridge, Cawnpoor", artistOrCreator:"Robert Smith", depictedDate:{minYear:1828,maxYear:1833}, creationDate:{minYear:1828,maxYear:1833}, placeId:"kanpur-in", region:"South Asia", difficulty:5, landmarkCategory:"bridge", tags:["stone-bridge","river","landscape"], era:"1830s", license:"Public Domain (life+100)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Magazine_Bridge,_Cawnpoor_2014HA0961.jpg", creditText:"Robert Smith", context:"A small arched bridge near Cawnpore (Kanpur), pencil drawing, c.1828-1833.", curationNotes:"Cropped to remove a handwritten caption ('Magazine bridge, Cawnpoor') below the drawing, in a separate mount margin." },
  { id:"commons-patna-golghar-1888", localName:"patna-golghar-1888.jpg", workType:"painting", title:"Golghar, Patna, 1888", artistOrCreator:null, depictedDate:{minYear:1888,maxYear:1888}, creationDate:{minYear:1888,maxYear:1888}, placeId:"patna-in", region:"South Asia", difficulty:2, landmarkCategory:"granary", tags:["golghar","beehive-dome","distinctive-shape"], era:"1880s", license:"Public Domain (author d.1912, pre-1931)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Golghar,_Patna,_1888.jpg", creditText:"Wikimedia Commons", context:"The distinctive beehive-shaped Golghar granary in Patna, watercolor, 1888.", curationNotes:"Cropped from the bottom to remove a handwritten date/place inscription ('Patna Oct 26. 1888') that bled into the painted ground; final crop sits exactly at the 480px minimum height." },
  { id:"commons-bhopal-lakeside-1929", localName:"bhopal-lakeside-1929.jpg", workType:"photo", title:"Bhopal lakeside, 1929", artistOrCreator:"Georg Morgenstierne", depictedDate:{minYear:1929,maxYear:1929}, creationDate:{minYear:1929,maxYear:1929}, placeId:"bhopal-in", region:"South Asia", difficulty:3, landmarkCategory:"lake-view", tags:["upper-lake","bridge","daily-life"], era:"1920s", license:"Public Domain (PD-Norway-50)", sourceUrl:"https://commons.wikimedia.org/wiki/File:NO-NB_BLDSA_GM2b241n.jpg", creditText:"Georg Morgenstierne / National Library of Norway", context:"People at the edge of one of Bhopal's lakes, with a causeway and palace buildings in the distance, 1929." },
  { id:"commons-multan-siege-1849", localName:"multan-siege-1849.jpg", workType:"drawing", title:"Moultan, from a sketch during the siege", artistOrCreator:null, depictedDate:{minYear:1848,maxYear:1849}, creationDate:{minYear:1849,maxYear:1849}, placeId:"multan-pk", region:"South Asia", difficulty:4, landmarkCategory:"siege-scene", tags:["explosion","fort","second-anglo-sikh-war"], era:"1840s", license:"Public Domain (CC-PD-Mark, pre-1931)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Moultan,_from_a_sketch_during_the_siege_-_ILN_1849.jpg", creditText:"The Illustrated London News, 1849", context:"A magazine explosion during the Siege of Multan, with the fort visible in the distance, Illustrated London News, 1849." },
  { id:"commons-rawalpindi-murree-road-1939", localName:"rawalpindi-murree-road-1939.jpg", workType:"photo", title:"Road in Rawalpindi, 1939", artistOrCreator:null, depictedDate:{minYear:1939,maxYear:1939}, creationDate:{minYear:1939,maxYear:1939}, placeId:"rawalpindi-pk", region:"South Asia", difficulty:4, landmarkCategory:"street", tags:["tree-lined-road","cyclist","empty-street"], era:"1930s", license:"CC BY-SA 2.0", sourceUrl:"https://commons.wikimedia.org/wiki/File:Road_in_Rawalpindi,_1939.jpg", creditText:"Wikimedia Commons", context:"An empty tree-lined road in Rawalpindi, with a cyclist, 1939." },
  { id:"commons-quetta-approach-fortress-1842", localName:"quetta-approach-fortress-1842.jpg", workType:"drawing", title:"The Approach to the Fortress of Kwettah", artistOrCreator:"James Atkinson", depictedDate:{minYear:1842,maxYear:1842}, creationDate:{minYear:1842,maxYear:1842}, placeId:"quetta-pk", region:"South Asia", difficulty:5, landmarkCategory:"landscape", tags:["caravan","hills","lithograph"], era:"1840s", license:"Public Domain (pre-1931)", sourceUrl:"https://commons.wikimedia.org/wiki/File:The_approach_to_the_fortress_of_Kwettah_LCCN2016647831.jpg", creditText:"James Atkinson / Louis and Charles Haghe", context:"A caravan and mounted officers approaching Quetta through open country, 1842 lithograph.", curationNotes:"Cropped to remove a printed title ('THE APPROACH TO THE FORTRESS OF KWETTAH') in a separate mount margin below the illustration." },
  { id:"commons-chittagong-hills-1813", localName:"chittagong-hills-view-1813.jpg", workType:"drawing", title:"A view of Chittagong (Bengal) showing European bungalows and river in distance", artistOrCreator:"James George", depictedDate:{minYear:1813,maxYear:1813}, creationDate:{minYear:1813,maxYear:1813}, placeId:"chittagong-bd", region:"South Asia", difficulty:5, landmarkCategory:"landscape", tags:["hills","bungalows","watercolor"], era:"1810s", license:"Public Domain (life+100)", sourceUrl:"https://commons.wikimedia.org/wiki/File:James_George_-_A_view_of_Chittagong_(Bengal)_showing_European_bungalows_and_river_in_distance._5_October_1813_WD336.jpg", creditText:"James George", context:"European bungalows on the hills above Chittagong, with the river in the distance, 1813 watercolor.", curationNotes:"Cropped to remove a small printed caption box reading 'Chittagong' below the painting, in a separate mount margin." },
  { id:"commons-kandy-temple-courtyard-1880", localName:"kandy-temple-courtyard-1880.jpg", workType:"photo", title:"Buddhist Temple in Kandy, Ceylon", artistOrCreator:"Skeen & Co.", depictedDate:{minYear:1880,maxYear:1880}, creationDate:{minYear:1880,maxYear:1880}, placeId:"kandy-lk", region:"South Asia", difficulty:4, landmarkCategory:"religious", tags:["temple-of-the-tooth","carved-columns","courtyard"], era:"1880s", license:"CC0 (Cleveland Museum of Art)", sourceUrl:"https://commons.wikimedia.org/wiki/File:Skeen_%26_Co._-_Buddhist_Temple_in_Kandy,_Ceylon_-_2014.649_-_Cleveland_Museum_of_Art.jpg", creditText:"Skeen & Co.", context:"The carved courtyard of a Buddhist temple in Kandy, 1880." },
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
