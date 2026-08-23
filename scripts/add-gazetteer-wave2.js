import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const gazetteerPath = path.join(__dirname, "..", "content", "source", "gazetteer.json");

const additions = [
  // South Asia
  { id: "agra-in", displayName: "Agra", country: "India", countryCode: "IN", lat: 27.1767, lng: 78.0081, aliases: [], historicalNames: [] },
  { id: "ahmedabad-in", displayName: "Ahmedabad", country: "India", countryCode: "IN", lat: 23.0225, lng: 72.5714, aliases: [], historicalNames: [] },
  // East Asia
  { id: "shenyang-cn", displayName: "Shenyang", country: "China", countryCode: "CN", lat: 41.8057, lng: 123.4315, aliases: [], historicalNames: ["Mukden"] },
  { id: "nanjing-cn", displayName: "Nanjing", country: "China", countryCode: "CN", lat: 32.0603, lng: 118.7969, aliases: [], historicalNames: ["Nanking"] },
  { id: "xian-cn", displayName: "Xi'an", country: "China", countryCode: "CN", lat: 34.3416, lng: 108.9398, aliases: [], historicalNames: ["Sian"] },
  { id: "chengdu-cn", displayName: "Chengdu", country: "China", countryCode: "CN", lat: 30.5728, lng: 104.0668, aliases: [], historicalNames: [] },
  { id: "wuhan-cn", displayName: "Wuhan", country: "China", countryCode: "CN", lat: 30.5928, lng: 114.3055, aliases: [], historicalNames: ["Hankow"] },
  { id: "tianjin-cn", displayName: "Tianjin", country: "China", countryCode: "CN", lat: 39.3434, lng: 117.3616, aliases: [], historicalNames: ["Tientsin"] },
  { id: "xiamen-cn", displayName: "Xiamen", country: "China", countryCode: "CN", lat: 24.4798, lng: 118.0894, aliases: [], historicalNames: ["Amoy"] },
  { id: "fuzhou-cn", displayName: "Fuzhou", country: "China", countryCode: "CN", lat: 26.0745, lng: 119.2965, aliases: [], historicalNames: ["Foochow"] },
  { id: "ningbo-cn", displayName: "Ningbo", country: "China", countryCode: "CN", lat: 29.8683, lng: 121.5440, aliases: [], historicalNames: ["Ningpo"] },
  { id: "suzhou-cn", displayName: "Suzhou", country: "China", countryCode: "CN", lat: 31.2989, lng: 120.5853, aliases: [], historicalNames: ["Soochow"] },
  { id: "hangzhou-cn", displayName: "Hangzhou", country: "China", countryCode: "CN", lat: 30.2741, lng: 120.1551, aliases: [], historicalNames: [] },
  { id: "chongqing-cn", displayName: "Chongqing", country: "China", countryCode: "CN", lat: 29.5630, lng: 106.5516, aliases: [], historicalNames: ["Chungking"] },
  { id: "harbin-cn", displayName: "Harbin", country: "China", countryCode: "CN", lat: 45.8038, lng: 126.5350, aliases: [], historicalNames: [] },
  { id: "yokohama-jp", displayName: "Yokohama", country: "Japan", countryCode: "JP", lat: 35.4437, lng: 139.6380, aliases: [], historicalNames: [] },
  { id: "kobe-jp", displayName: "Kobe", country: "Japan", countryCode: "JP", lat: 34.6901, lng: 135.1955, aliases: [], historicalNames: [] },
  { id: "sapporo-jp", displayName: "Sapporo", country: "Japan", countryCode: "JP", lat: 43.0618, lng: 141.3545, aliases: [], historicalNames: [] },
  { id: "nara-jp", displayName: "Nara", country: "Japan", countryCode: "JP", lat: 34.6851, lng: 135.8048, aliases: [], historicalNames: [] },
  // Middle East / Central Asia
  { id: "aleppo-sy", displayName: "Aleppo", country: "Syria", countryCode: "SY", lat: 36.2021, lng: 37.1343, aliases: [], historicalNames: [] },
  { id: "homs-sy", displayName: "Homs", country: "Syria", countryCode: "SY", lat: 34.7324, lng: 36.7137, aliases: [], historicalNames: ["Emesa"] },
  { id: "kirkuk-iq", displayName: "Kirkuk", country: "Iraq", countryCode: "IQ", lat: 35.4681, lng: 44.3922, aliases: [], historicalNames: [] },
  { id: "gaza-ps", displayName: "Gaza", country: "Palestine", countryCode: "PS", lat: 31.5017, lng: 34.4668, aliases: [], historicalNames: [] },
  { id: "haifa-il", displayName: "Haifa", country: "Israel", countryCode: "IL", lat: 32.7940, lng: 34.9896, aliases: [], historicalNames: [] },
  { id: "jaffa-il", displayName: "Jaffa", country: "Israel", countryCode: "IL", lat: 32.0523, lng: 34.7519, aliases: [], historicalNames: [] },
  { id: "port-said-eg", displayName: "Port Said", country: "Egypt", countryCode: "EG", lat: 31.2653, lng: 32.3019, aliases: [], historicalNames: [] },
  { id: "manama-bh", displayName: "Manama", country: "Bahrain", countryCode: "BH", lat: 26.2285, lng: 50.5860, aliases: [], historicalNames: [] },
  { id: "kuwait-city-kw", displayName: "Kuwait City", country: "Kuwait", countryCode: "KW", lat: 29.3759, lng: 47.9774, aliases: [], historicalNames: [] },
  { id: "jeddah-sa", displayName: "Jeddah", country: "Saudi Arabia", countryCode: "SA", lat: 21.4858, lng: 39.1925, aliases: [], historicalNames: [] },
  { id: "samarkand-uz", displayName: "Samarkand", country: "Uzbekistan", countryCode: "UZ", lat: 39.6270, lng: 66.9750, aliases: [], historicalNames: [] },
  { id: "bukhara-uz", displayName: "Bukhara", country: "Uzbekistan", countryCode: "UZ", lat: 39.7747, lng: 64.4286, aliases: [], historicalNames: [] },
  { id: "tashkent-uz", displayName: "Tashkent", country: "Uzbekistan", countryCode: "UZ", lat: 41.2995, lng: 69.2401, aliases: [], historicalNames: [] },
  // Western / Southern Europe
  { id: "naples-it", displayName: "Naples", country: "Italy", countryCode: "IT", lat: 40.8518, lng: 14.2681, aliases: [], historicalNames: [] },
  { id: "venice-it", displayName: "Venice", country: "Italy", countryCode: "IT", lat: 45.4408, lng: 12.3155, aliases: [], historicalNames: [] },
  { id: "florence-it", displayName: "Florence", country: "Italy", countryCode: "IT", lat: 43.7696, lng: 11.2558, aliases: [], historicalNames: [] },
  { id: "turin-it", displayName: "Turin", country: "Italy", countryCode: "IT", lat: 45.0703, lng: 7.6869, aliases: [], historicalNames: [] },
  { id: "genoa-it", displayName: "Genoa", country: "Italy", countryCode: "IT", lat: 44.4056, lng: 8.9463, aliases: [], historicalNames: [] },
  { id: "palermo-it", displayName: "Palermo", country: "Italy", countryCode: "IT", lat: 38.1157, lng: 13.3615, aliases: [], historicalNames: [] },
  { id: "milan-it", displayName: "Milan", country: "Italy", countryCode: "IT", lat: 45.4642, lng: 9.1900, aliases: [], historicalNames: [] },
  { id: "bologna-it", displayName: "Bologna", country: "Italy", countryCode: "IT", lat: 44.4949, lng: 11.3426, aliases: [], historicalNames: [] },
  { id: "seville-es", displayName: "Seville", country: "Spain", countryCode: "ES", lat: 37.3891, lng: -5.9845, aliases: [], historicalNames: [] },
  { id: "valencia-es", displayName: "Valencia", country: "Spain", countryCode: "ES", lat: 39.4699, lng: -0.3763, aliases: [], historicalNames: [] },
  { id: "porto-pt", displayName: "Porto", country: "Portugal", countryCode: "PT", lat: 41.1579, lng: -8.6291, aliases: [], historicalNames: [] },
  { id: "rotterdam-nl", displayName: "Rotterdam", country: "Netherlands", countryCode: "NL", lat: 51.9244, lng: 4.4777, aliases: [], historicalNames: [] },
  { id: "thehague-nl", displayName: "The Hague", country: "Netherlands", countryCode: "NL", lat: 52.0705, lng: 4.3007, aliases: [], historicalNames: [] },
  { id: "antwerp-be", displayName: "Antwerp", country: "Belgium", countryCode: "BE", lat: 51.2194, lng: 4.4025, aliases: [], historicalNames: [] },
  { id: "ghent-be", displayName: "Ghent", country: "Belgium", countryCode: "BE", lat: 51.0543, lng: 3.7174, aliases: [], historicalNames: [] },
  { id: "cologne-de", displayName: "Cologne", country: "Germany", countryCode: "DE", lat: 50.9375, lng: 6.9603, aliases: [], historicalNames: ["Köln"] },
  { id: "dresden-de", displayName: "Dresden", country: "Germany", countryCode: "DE", lat: 51.0504, lng: 13.7373, aliases: [], historicalNames: [] },
  // Eastern Europe / Caucasus
  { id: "krakow-pl", displayName: "Krakow", country: "Poland", countryCode: "PL", lat: 50.0647, lng: 19.9450, aliases: [], historicalNames: [] },
  { id: "gdansk-pl", displayName: "Gdansk", country: "Poland", countryCode: "PL", lat: 54.3520, lng: 18.6466, aliases: [], historicalNames: ["Danzig"] },
  { id: "wroclaw-pl", displayName: "Wroclaw", country: "Poland", countryCode: "PL", lat: 51.1079, lng: 17.0385, aliases: [], historicalNames: ["Breslau"] },
  { id: "lodz-pl", displayName: "Lodz", country: "Poland", countryCode: "PL", lat: 51.7592, lng: 19.4560, aliases: [], historicalNames: [] },
  { id: "belgrade-rs", displayName: "Belgrade", country: "Serbia", countryCode: "RS", lat: 44.7866, lng: 20.4489, aliases: [], historicalNames: [] },
  { id: "sarajevo-ba", displayName: "Sarajevo", country: "Bosnia and Herzegovina", countryCode: "BA", lat: 43.8563, lng: 18.4131, aliases: [], historicalNames: [] },
  { id: "tirana-al", displayName: "Tirana", country: "Albania", countryCode: "AL", lat: 41.3275, lng: 19.8187, aliases: [], historicalNames: [] },
  { id: "chisinau-md", displayName: "Chisinau", country: "Moldova", countryCode: "MD", lat: 47.0105, lng: 28.8638, aliases: [], historicalNames: [] },
  { id: "vilnius-lt", displayName: "Vilnius", country: "Lithuania", countryCode: "LT", lat: 54.6872, lng: 25.2797, aliases: [], historicalNames: [] },
  { id: "riga-lv", displayName: "Riga", country: "Latvia", countryCode: "LV", lat: 56.9496, lng: 24.1052, aliases: [], historicalNames: [] },
  { id: "tallinn-ee", displayName: "Tallinn", country: "Estonia", countryCode: "EE", lat: 59.4370, lng: 24.7536, aliases: [], historicalNames: [] },
  { id: "odessa-ua", displayName: "Odessa", country: "Ukraine", countryCode: "UA", lat: 46.4825, lng: 30.7233, aliases: [], historicalNames: [] },
  { id: "kharkiv-ua", displayName: "Kharkiv", country: "Ukraine", countryCode: "UA", lat: 49.9935, lng: 36.2304, aliases: [], historicalNames: ["Kharkov"] },
  { id: "yerevan-am", displayName: "Yerevan", country: "Armenia", countryCode: "AM", lat: 40.1792, lng: 44.4991, aliases: [], historicalNames: ["Erivan"] },
  // Africa
  { id: "fes-ma", displayName: "Fes", country: "Morocco", countryCode: "MA", lat: 34.0181, lng: -5.0078, aliases: ["Fez"], historicalNames: [] },
  { id: "marrakesh-ma", displayName: "Marrakesh", country: "Morocco", countryCode: "MA", lat: 31.6295, lng: -7.9811, aliases: [], historicalNames: [] },
  { id: "rabat-ma", displayName: "Rabat", country: "Morocco", countryCode: "MA", lat: 34.0209, lng: -6.8416, aliases: [], historicalNames: [] },
  { id: "oran-dz", displayName: "Oran", country: "Algeria", countryCode: "DZ", lat: 35.6969, lng: -0.6331, aliases: [], historicalNames: [] },
  { id: "constantine-dz", displayName: "Constantine", country: "Algeria", countryCode: "DZ", lat: 36.3650, lng: 6.6147, aliases: [], historicalNames: [] },
  { id: "benghazi-ly", displayName: "Benghazi", country: "Libya", countryCode: "LY", lat: 32.1167, lng: 20.0667, aliases: [], historicalNames: [] },
  { id: "timbuktu-ml", displayName: "Timbuktu", country: "Mali", countryCode: "ML", lat: 16.7735, lng: -3.0074, aliases: [], historicalNames: [] },
  { id: "ouagadougou-bf", displayName: "Ouagadougou", country: "Burkina Faso", countryCode: "BF", lat: 12.3714, lng: -1.5197, aliases: [], historicalNames: [] },
  { id: "niamey-ne", displayName: "Niamey", country: "Niger", countryCode: "NE", lat: 13.5137, lng: 2.1098, aliases: [], historicalNames: [] },
  { id: "ndjamena-td", displayName: "N'Djamena", country: "Chad", countryCode: "TD", lat: 12.1348, lng: 15.0557, aliases: [], historicalNames: ["Fort-Lamy"] },
  { id: "kinshasa-cd", displayName: "Kinshasa", country: "DR Congo", countryCode: "CD", lat: -4.3224, lng: 15.3075, aliases: [], historicalNames: ["Leopoldville"] },
  { id: "brazzaville-cg", displayName: "Brazzaville", country: "Republic of the Congo", countryCode: "CG", lat: -4.2634, lng: 15.2429, aliases: [], historicalNames: [] },
  { id: "libreville-ga", displayName: "Libreville", country: "Gabon", countryCode: "GA", lat: 0.4162, lng: 9.4673, aliases: [], historicalNames: [] },
  { id: "yaounde-cm", displayName: "Yaounde", country: "Cameroon", countryCode: "CM", lat: 3.8480, lng: 11.5021, aliases: [], historicalNames: [] },
  { id: "douala-cm", displayName: "Douala", country: "Cameroon", countryCode: "CM", lat: 4.0483, lng: 9.7043, aliases: [], historicalNames: [] },
  { id: "luanda-ao", displayName: "Luanda", country: "Angola", countryCode: "AO", lat: -8.8390, lng: 13.2894, aliases: [], historicalNames: [] },
  // North America
  { id: "philadelphia-us", displayName: "Philadelphia", country: "United States", countryCode: "US", lat: 39.9526, lng: -75.1652, aliases: [], historicalNames: [] },
  { id: "new-york-us", displayName: "New York", country: "United States", countryCode: "US", lat: 40.7128, lng: -74.0060, aliases: [], historicalNames: [] },
  { id: "charleston-us", displayName: "Charleston", country: "United States", countryCode: "US", lat: 32.7765, lng: -79.9311, aliases: [], historicalNames: [] },
  { id: "savannah-us", displayName: "Savannah", country: "United States", countryCode: "US", lat: 32.0809, lng: -81.0912, aliases: [], historicalNames: [] },
  { id: "st-louis-us", displayName: "St Louis", country: "United States", countryCode: "US", lat: 38.6270, lng: -90.1994, aliases: [], historicalNames: [] },
  { id: "cincinnati-us", displayName: "Cincinnati", country: "United States", countryCode: "US", lat: 39.1031, lng: -84.5120, aliases: [], historicalNames: [] },
  { id: "buffalo-us", displayName: "Buffalo", country: "United States", countryCode: "US", lat: 42.8864, lng: -78.8784, aliases: [], historicalNames: [] },
  { id: "guadalajara-mx", displayName: "Guadalajara", country: "Mexico", countryCode: "MX", lat: 20.6597, lng: -103.3496, aliases: [], historicalNames: [] },
  { id: "monterrey-mx", displayName: "Monterrey", country: "Mexico", countryCode: "MX", lat: 25.6866, lng: -100.3161, aliases: [], historicalNames: [] },
  { id: "veracruz-mx", displayName: "Veracruz", country: "Mexico", countryCode: "MX", lat: 19.1738, lng: -96.1342, aliases: [], historicalNames: [] },
  { id: "merida-mx", displayName: "Merida", country: "Mexico", countryCode: "MX", lat: 20.9674, lng: -89.5926, aliases: [], historicalNames: [] },
  { id: "san-salvador-sv", displayName: "San Salvador", country: "El Salvador", countryCode: "SV", lat: 13.6929, lng: -89.2182, aliases: [], historicalNames: [] },
  // South America
  { id: "medellin-co", displayName: "Medellin", country: "Colombia", countryCode: "CO", lat: 6.2442, lng: -75.5812, aliases: [], historicalNames: [] },
  { id: "cusco-pe", displayName: "Cusco", country: "Peru", countryCode: "PE", lat: -13.5320, lng: -71.9675, aliases: [], historicalNames: [] },
  { id: "arequipa-pe", displayName: "Arequipa", country: "Peru", countryCode: "PE", lat: -16.4090, lng: -71.5375, aliases: [], historicalNames: [] },
  { id: "sucre-bo", displayName: "Sucre", country: "Bolivia", countryCode: "BO", lat: -19.0333, lng: -65.2627, aliases: [], historicalNames: [] },
  { id: "asuncion-py", displayName: "Asuncion", country: "Paraguay", countryCode: "PY", lat: -25.2637, lng: -57.5759, aliases: [], historicalNames: [] },
  { id: "cordoba-ar", displayName: "Cordoba", country: "Argentina", countryCode: "AR", lat: -31.4201, lng: -64.1888, aliases: [], historicalNames: [] },
  { id: "rosario-ar", displayName: "Rosario", country: "Argentina", countryCode: "AR", lat: -32.9468, lng: -60.6393, aliases: [], historicalNames: [] },
  { id: "porto-alegre-br", displayName: "Porto Alegre", country: "Brazil", countryCode: "BR", lat: -30.0346, lng: -51.2177, aliases: [], historicalNames: [] },
  { id: "salvador-br", displayName: "Salvador", country: "Brazil", countryCode: "BR", lat: -12.9777, lng: -38.5016, aliases: [], historicalNames: [] },
  { id: "belem-br", displayName: "Belem", country: "Brazil", countryCode: "BR", lat: -1.4558, lng: -48.4902, aliases: [], historicalNames: [] },
  { id: "manaus-br", displayName: "Manaus", country: "Brazil", countryCode: "BR", lat: -3.1190, lng: -60.0217, aliases: [], historicalNames: [] },
  { id: "fortaleza-br", displayName: "Fortaleza", country: "Brazil", countryCode: "BR", lat: -3.7172, lng: -38.5433, aliases: [], historicalNames: [] },
  { id: "curitiba-br", displayName: "Curitiba", country: "Brazil", countryCode: "BR", lat: -25.4284, lng: -49.2733, aliases: [], historicalNames: [] },
  { id: "belo-horizonte-br", displayName: "Belo Horizonte", country: "Brazil", countryCode: "BR", lat: -19.9167, lng: -43.9345, aliases: [], historicalNames: [] },
  { id: "sao-paulo-br", displayName: "Sao Paulo", country: "Brazil", countryCode: "BR", lat: -23.5505, lng: -46.6333, aliases: [], historicalNames: [] },
  { id: "guayaquil-ec", displayName: "Guayaquil", country: "Ecuador", countryCode: "EC", lat: -2.1894, lng: -79.8890, aliases: [], historicalNames: [] },
  // Oceania
  { id: "hobart-au", displayName: "Hobart", country: "Australia", countryCode: "AU", lat: -42.8821, lng: 147.3272, aliases: [], historicalNames: [] },
  { id: "apia-ws", displayName: "Apia", country: "Samoa", countryCode: "WS", lat: -13.8333, lng: -171.7667, aliases: [], historicalNames: [] },
  { id: "nukualofa-to", displayName: "Nuku'alofa", country: "Tonga", countryCode: "TO", lat: -21.1394, lng: -175.2049, aliases: [], historicalNames: [] },
  { id: "noumea-nc", displayName: "Noumea", country: "New Caledonia", countryCode: "NC", lat: -22.2758, lng: 166.4581, aliases: [], historicalNames: ["Port-de-France"] },
  { id: "papeete-pf", displayName: "Papeete", country: "French Polynesia", countryCode: "PF", lat: -17.5516, lng: -149.5585, aliases: [], historicalNames: [] },
  { id: "honolulu-us", displayName: "Honolulu", country: "United States", countryCode: "US", lat: 21.3069, lng: -157.8583, aliases: [], historicalNames: [] },
  // Retry + small Europe
  { id: "valparaiso-cl", displayName: "Valparaiso", country: "Chile", countryCode: "CL", lat: -33.0472, lng: -71.6127, aliases: [], historicalNames: [] },
  { id: "reykjavik-is", displayName: "Reykjavik", country: "Iceland", countryCode: "IS", lat: 64.1466, lng: -21.9426, aliases: [], historicalNames: [] },
  { id: "malmo-se", displayName: "Malmo", country: "Sweden", countryCode: "SE", lat: 55.6050, lng: 13.0038, aliases: [], historicalNames: [] },
  { id: "uppsala-se", displayName: "Uppsala", country: "Sweden", countryCode: "SE", lat: 59.8586, lng: 17.6389, aliases: [], historicalNames: [] },
  { id: "trondheim-no", displayName: "Trondheim", country: "Norway", countryCode: "NO", lat: 63.4305, lng: 10.3951, aliases: [], historicalNames: [] },
  { id: "stavanger-no", displayName: "Stavanger", country: "Norway", countryCode: "NO", lat: 58.9700, lng: 5.7331, aliases: [], historicalNames: [] },
  { id: "tampere-fi", displayName: "Tampere", country: "Finland", countryCode: "FI", lat: 61.4978, lng: 23.7610, aliases: [], historicalNames: [] },
  { id: "luxembourg-city-lu", displayName: "Luxembourg City", country: "Luxembourg", countryCode: "LU", lat: 49.6116, lng: 6.1319, aliases: [], historicalNames: [] },
  { id: "valletta-mt", displayName: "Valletta", country: "Malta", countryCode: "MT", lat: 35.8989, lng: 14.5146, aliases: [], historicalNames: [] },
  { id: "nicosia-cy", displayName: "Nicosia", country: "Cyprus", countryCode: "CY", lat: 35.1856, lng: 33.3823, aliases: [], historicalNames: [] },
];

const gaz = JSON.parse(fs.readFileSync(gazetteerPath, "utf8"));
const existingIds = new Set(gaz.map((g) => g.id));
let added = 0;
for (const entry of additions) {
  if (existingIds.has(entry.id)) {
    console.log(`skip (already present): ${entry.id}`);
    continue;
  }
  gaz.push(entry);
  added++;
}
fs.writeFileSync(gazetteerPath, JSON.stringify(gaz, null, 2) + "\n");
console.log(`\n${added} entries added; ${gaz.length} total in gazetteer.json`);
