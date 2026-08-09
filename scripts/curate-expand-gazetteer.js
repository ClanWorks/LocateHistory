// One-off curation step: expand the gazetteer from 20 entries (exactly
// the 20 answer cities) to a broad guess pool. Review finding: with only
// the answers present, every one of the 17 single-city countries turned
// the "country" clue into a full answer reveal, and the searchable
// selector exposed the complete answer set. Fix is twofold — add several
// more well-known cities in each already-used country, and add broad
// global coverage so the selector reads as a real "world of cities"
// list rather than "answers plus their obvious siblings".
//
// Run once, from the repo root: node scripts/curate-expand-gazetteer.js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const gazetteerPath = path.join(__dirname, "..", "content", "source", "gazetteer.json");
const existing = JSON.parse(fs.readFileSync(gazetteerPath, "utf8"));

function entry(id, displayName, country, countryCode, lat, lng, aliases = [], historicalNames = []) {
  return { id, displayName, country, countryCode, lat, lng, aliases, historicalNames };
}

const additions = [
  // --- Siblings for the 18 countries already used as answers ---
  // India (already: Kolkata, Varanasi, Old Goa)
  entry("mumbai-in", "Mumbai", "India", "IN", 19.076, 72.8777, ["Bombay"], ["Bombay"]),
  entry("delhi-in", "Delhi", "India", "IN", 28.7041, 77.1025, ["New Delhi"]),
  entry("chennai-in", "Chennai", "India", "IN", 13.0827, 80.2707, ["Madras"], ["Madras"]),
  entry("jaipur-in", "Jaipur", "India", "IN", 26.9124, 75.7873),
  // United States (already: San Francisco)
  entry("new-york-us", "New York City", "United States", "US", 40.7128, -74.006, ["NYC", "New York"]),
  entry("chicago-us", "Chicago", "United States", "US", 41.8781, -87.6298),
  entry("boston-us", "Boston", "United States", "US", 42.3601, -71.0589),
  entry("new-orleans-us", "New Orleans", "United States", "US", 29.9511, -90.0715),
  // United Kingdom (already: Manchester)
  entry("london-gb", "London", "United Kingdom", "GB", 51.5074, -0.1278),
  entry("birmingham-gb", "Birmingham", "United Kingdom", "GB", 52.4862, -1.8904),
  entry("edinburgh-gb", "Edinburgh", "United Kingdom", "GB", 55.9533, -3.1883),
  entry("liverpool-gb", "Liverpool", "United Kingdom", "GB", 53.4084, -2.9916),
  // Denmark (already: Odense)
  entry("copenhagen-dk", "Copenhagen", "Denmark", "DK", 55.6761, 12.5683),
  entry("aarhus-dk", "Aarhus", "Denmark", "DK", 56.1629, 10.2039),
  entry("aalborg-dk", "Aalborg", "Denmark", "DK", 57.0488, 9.9217),
  // Australia (already: Sydney)
  entry("melbourne-au", "Melbourne", "Australia", "AU", -37.8136, 144.9631),
  entry("brisbane-au", "Brisbane", "Australia", "AU", -27.4698, 153.0251),
  entry("perth-au", "Perth", "Australia", "AU", -31.9505, 115.8605),
  entry("adelaide-au", "Adelaide", "Australia", "AU", -34.9285, 138.6007),
  // Cuba (already: Havana)
  entry("santiago-de-cuba-cu", "Santiago de Cuba", "Cuba", "CU", 20.0247, -75.8219),
  entry("camaguey-cu", "Camagüey", "Cuba", "CU", 21.3809, -77.9169),
  // Russia (already: Kazan)
  entry("moscow-ru", "Moscow", "Russia", "RU", 55.7558, 37.6173),
  entry("saint-petersburg-ru", "Saint Petersburg", "Russia", "RU", 59.9311, 30.3609, ["St Petersburg"], ["Leningrad", "Petrograd"]),
  entry("novosibirsk-ru", "Novosibirsk", "Russia", "RU", 55.0084, 82.9357),
  entry("yekaterinburg-ru", "Yekaterinburg", "Russia", "RU", 56.8389, 60.6057),
  // Iraq (already: Baghdad)
  entry("basra-iq", "Basra", "Iraq", "IQ", 30.5081, 47.7835),
  entry("mosul-iq", "Mosul", "Iraq", "IQ", 36.335, 43.1189),
  entry("erbil-iq", "Erbil", "Iraq", "IQ", 36.1911, 44.0092),
  // New Zealand (already: Wellington)
  entry("auckland-nz", "Auckland", "New Zealand", "NZ", -36.8485, 174.7633),
  entry("christchurch-nz", "Christchurch", "New Zealand", "NZ", -43.5321, 172.6362),
  entry("dunedin-nz", "Dunedin", "New Zealand", "NZ", -45.8788, 170.5028),
  // Pakistan (already: Lahore)
  entry("karachi-pk", "Karachi", "Pakistan", "PK", 24.8607, 67.0011),
  entry("islamabad-pk", "Islamabad", "Pakistan", "PK", 33.6844, 73.0479),
  entry("peshawar-pk", "Peshawar", "Pakistan", "PK", 34.0151, 71.5249),
  entry("multan-pk", "Multan", "Pakistan", "PK", 30.1575, 71.5249),
  // Czechia (already: Prague)
  entry("brno-cz", "Brno", "Czechia", "CZ", 49.1951, 16.6068),
  entry("ostrava-cz", "Ostrava", "Czechia", "CZ", 49.8209, 18.2625),
  entry("plzen-cz", "Plzeň", "Czechia", "CZ", 49.7384, 13.3736, ["Pilsen"]),
  // Ghana (already: Accra)
  entry("kumasi-gh", "Kumasi", "Ghana", "GH", 6.6885, -1.6244),
  entry("tamale-gh", "Tamale", "Ghana", "GH", 9.4008, -0.8393),
  // Uganda (already: Kampala)
  entry("entebbe-ug", "Entebbe", "Uganda", "UG", 0.0512, 32.4637),
  entry("jinja-ug", "Jinja", "Uganda", "UG", 0.4244, 33.2042),
  entry("gulu-ug", "Gulu", "Uganda", "UG", 2.7724, 32.2881),
  // Colombia (already: Bogotá)
  entry("medellin-co", "Medellín", "Colombia", "CO", 6.2442, -75.5812),
  entry("cali-co", "Cali", "Colombia", "CO", 3.4516, -76.532),
  entry("cartagena-co", "Cartagena", "Colombia", "CO", 10.391, -75.4794),
  entry("barranquilla-co", "Barranquilla", "Colombia", "CO", 10.9639, -74.7964),
  // South Africa (already: Durban)
  entry("cape-town-za", "Cape Town", "South Africa", "ZA", -33.9249, 18.4241),
  entry("johannesburg-za", "Johannesburg", "South Africa", "ZA", -26.2041, 28.0473),
  entry("pretoria-za", "Pretoria", "South Africa", "ZA", -25.7479, 28.2293),
  entry("port-elizabeth-za", "Gqeberha", "South Africa", "ZA", -33.9608, 25.6022, ["Port Elizabeth"], ["Port Elizabeth"]),
  // Canada (already: Vancouver)
  entry("toronto-ca", "Toronto", "Canada", "CA", 43.6532, -79.3832),
  entry("montreal-ca", "Montreal", "Canada", "CA", 45.5019, -73.5674),
  entry("calgary-ca", "Calgary", "Canada", "CA", 51.0447, -114.0719),
  entry("ottawa-ca", "Ottawa", "Canada", "CA", 45.4215, -75.6972),
  // Uruguay (already: Montevideo)
  entry("salto-uy", "Salto", "Uruguay", "UY", -31.3833, -57.9667),
  entry("paysandu-uy", "Paysandú", "Uruguay", "UY", -32.3214, -58.0756),
  // South Korea (already: Seoul)
  entry("busan-kr", "Busan", "South Korea", "KR", 35.1796, 129.0756),
  entry("incheon-kr", "Incheon", "South Korea", "KR", 37.4563, 126.7052),
  entry("daegu-kr", "Daegu", "South Korea", "KR", 35.8714, 128.6014),

  // --- Broad global coverage: countries not otherwise represented ---
  // Western Europe
  entry("paris-fr", "Paris", "France", "FR", 48.8566, 2.3522),
  entry("berlin-de", "Berlin", "Germany", "DE", 52.52, 13.405),
  entry("madrid-es", "Madrid", "Spain", "ES", 40.4168, -3.7038),
  entry("rome-it", "Rome", "Italy", "IT", 41.9028, 12.4964),
  entry("amsterdam-nl", "Amsterdam", "Netherlands", "NL", 52.3676, 4.9041),
  entry("brussels-be", "Brussels", "Belgium", "BE", 50.8503, 4.3517),
  entry("vienna-at", "Vienna", "Austria", "AT", 48.2082, 16.3738),
  entry("zurich-ch", "Zurich", "Switzerland", "CH", 47.3769, 8.5417),
  entry("lisbon-pt", "Lisbon", "Portugal", "PT", 38.7223, -9.1393),
  entry("dublin-ie", "Dublin", "Ireland", "IE", 53.3498, -6.2603),
  // Northern Europe
  entry("stockholm-se", "Stockholm", "Sweden", "SE", 59.3293, 18.0686),
  entry("oslo-no", "Oslo", "Norway", "NO", 59.9139, 10.7522, [], ["Christiania", "Kristiania"]),
  entry("helsinki-fi", "Helsinki", "Finland", "FI", 60.1699, 24.9384),
  entry("reykjavik-is", "Reykjavík", "Iceland", "IS", 64.1466, -21.9426),
  // Eastern Europe
  entry("warsaw-pl", "Warsaw", "Poland", "PL", 52.2297, 21.0122),
  entry("budapest-hu", "Budapest", "Hungary", "HU", 47.4979, 19.0402),
  entry("bucharest-ro", "Bucharest", "Romania", "RO", 44.4268, 26.1025),
  entry("kyiv-ua", "Kyiv", "Ukraine", "UA", 50.4501, 30.5234, ["Kiev"]),
  entry("minsk-by", "Minsk", "Belarus", "BY", 53.9006, 27.559),
  // Central Europe
  entry("bratislava-sk", "Bratislava", "Slovakia", "SK", 48.1486, 17.1077),
  entry("ljubljana-si", "Ljubljana", "Slovenia", "SI", 46.0569, 14.5058),
  entry("zagreb-hr", "Zagreb", "Croatia", "HR", 45.815, 15.9819),
  // Middle East / North Africa
  entry("cairo-eg", "Cairo", "Egypt", "EG", 30.0444, 31.2357),
  entry("alexandria-eg", "Alexandria", "Egypt", "EG", 31.2001, 29.9187),
  entry("tehran-ir", "Tehran", "Iran", "IR", 35.6892, 51.389),
  entry("riyadh-sa", "Riyadh", "Saudi Arabia", "SA", 24.7136, 46.6753),
  entry("dubai-ae", "Dubai", "United Arab Emirates", "AE", 25.2048, 55.2708),
  entry("amman-jo", "Amman", "Jordan", "JO", 31.9454, 35.9284),
  entry("beirut-lb", "Beirut", "Lebanon", "LB", 33.8938, 35.5018),
  entry("jerusalem-il", "Jerusalem", "Israel", "IL", 31.7683, 35.2137),
  entry("istanbul-tr", "Istanbul", "Turkey", "TR", 41.0082, 28.9784, [], ["Constantinople", "Byzantium"]),
  entry("ankara-tr", "Ankara", "Turkey", "TR", 39.9334, 32.8597),
  entry("damascus-sy", "Damascus", "Syria", "SY", 33.5138, 36.2765),
  entry("tunis-tn", "Tunis", "Tunisia", "TN", 36.8065, 10.1815),
  entry("algiers-dz", "Algiers", "Algeria", "DZ", 36.7538, 3.0588),
  entry("casablanca-ma", "Casablanca", "Morocco", "MA", 33.5731, -7.5898),
  entry("tripoli-ly", "Tripoli", "Libya", "LY", 32.8872, 13.1913),
  // South Asia (more)
  entry("dhaka-bd", "Dhaka", "Bangladesh", "BD", 23.8103, 90.4125),
  entry("colombo-lk", "Colombo", "Sri Lanka", "LK", 6.9271, 79.8612),
  entry("kathmandu-np", "Kathmandu", "Nepal", "NP", 27.7172, 85.324),
  // East Asia (more)
  entry("tokyo-jp", "Tokyo", "Japan", "JP", 35.6762, 139.6503),
  entry("osaka-jp", "Osaka", "Japan", "JP", 34.6937, 135.5023),
  entry("beijing-cn", "Beijing", "China", "CN", 39.9042, 116.4074),
  entry("shanghai-cn", "Shanghai", "China", "CN", 31.2304, 121.4737),
  entry("hong-kong-hk", "Hong Kong", "Hong Kong", "HK", 22.3193, 114.1694),
  entry("taipei-tw", "Taipei", "Taiwan", "TW", 25.033, 121.5654),
  entry("pyongyang-kp", "Pyongyang", "North Korea", "KP", 39.0392, 125.7625),
  entry("ulaanbaatar-mn", "Ulaanbaatar", "Mongolia", "MN", 47.8864, 106.9057),
  // Southeast Asia
  entry("bangkok-th", "Bangkok", "Thailand", "TH", 13.7563, 100.5018),
  entry("singapore-sg", "Singapore", "Singapore", "SG", 1.3521, 103.8198),
  entry("jakarta-id", "Jakarta", "Indonesia", "ID", -6.2088, 106.8456),
  entry("manila-ph", "Manila", "Philippines", "PH", 14.5995, 120.9842),
  entry("hanoi-vn", "Hanoi", "Vietnam", "VN", 21.0285, 105.8542),
  entry("kuala-lumpur-my", "Kuala Lumpur", "Malaysia", "MY", 3.139, 101.6869),
  entry("yangon-mm", "Yangon", "Myanmar", "MM", 16.8661, 96.1951, [], ["Rangoon"]),
  entry("phnom-penh-kh", "Phnom Penh", "Cambodia", "KH", 11.5564, 104.9282),
  // North America (more)
  entry("mexico-city-mx", "Mexico City", "Mexico", "MX", 19.4326, -99.1332),
  // South America (more)
  entry("buenos-aires-ar", "Buenos Aires", "Argentina", "AR", -34.6037, -58.3816),
  entry("santiago-cl", "Santiago", "Chile", "CL", -33.4489, -70.6693),
  entry("lima-pe", "Lima", "Peru", "PE", -12.0464, -77.0428),
  entry("quito-ec", "Quito", "Ecuador", "EC", -0.1807, -78.4678),
  entry("caracas-ve", "Caracas", "Venezuela", "VE", 10.4806, -66.9036),
  entry("la-paz-bo", "La Paz", "Bolivia", "BO", -16.5, -68.15),
  entry("asuncion-py", "Asunción", "Paraguay", "PY", -25.2637, -57.5759),
  entry("rio-de-janeiro-br", "Rio de Janeiro", "Brazil", "BR", -22.9068, -43.1729),
  entry("sao-paulo-br", "São Paulo", "Brazil", "BR", -23.5505, -46.6333),
  entry("brasilia-br", "Brasília", "Brazil", "BR", -15.8267, -47.9218),
  // Caribbean (more)
  entry("kingston-jm", "Kingston", "Jamaica", "JM", 17.9712, -76.7936),
  entry("santo-domingo-do", "Santo Domingo", "Dominican Republic", "DO", 18.4861, -69.9312),
  entry("port-au-prince-ht", "Port-au-Prince", "Haiti", "HT", 18.5944, -72.3074),
  entry("nassau-bs", "Nassau", "Bahamas", "BS", 25.0343, -77.3963),
  entry("san-juan-pr", "San Juan", "Puerto Rico", "PR", 18.4655, -66.1057),
  // West Africa (more)
  entry("lagos-ng", "Lagos", "Nigeria", "NG", 6.5244, 3.3792),
  entry("abuja-ng", "Abuja", "Nigeria", "NG", 9.0765, 7.3986),
  entry("dakar-sn", "Dakar", "Senegal", "SN", 14.7167, -17.4677),
  entry("abidjan-ci", "Abidjan", "Ivory Coast", "CI", 5.36, -4.0083),
  entry("bamako-ml", "Bamako", "Mali", "ML", 12.6392, -8.0029),
  entry("freetown-sl", "Freetown", "Sierra Leone", "SL", 8.4657, -13.2317),
  entry("monrovia-lr", "Monrovia", "Liberia", "LR", 6.2907, -10.7605),
  entry("conakry-gn", "Conakry", "Guinea", "GN", 9.6412, -13.5784),
  // East Africa (more)
  entry("nairobi-ke", "Nairobi", "Kenya", "KE", -1.2864, 36.8172),
  entry("addis-ababa-et", "Addis Ababa", "Ethiopia", "ET", 9.032, 38.7469),
  entry("dar-es-salaam-tz", "Dar es Salaam", "Tanzania", "TZ", -6.7924, 39.2083),
  entry("mogadishu-so", "Mogadishu", "Somalia", "SO", 2.0469, 45.3182),
  entry("kigali-rw", "Kigali", "Rwanda", "RW", -1.9403, 30.0586),
  entry("khartoum-sd", "Khartoum", "Sudan", "SD", 15.5007, 32.5599),
  // Southern Africa (more)
  entry("windhoek-na", "Windhoek", "Namibia", "NA", -22.5609, 17.0658),
  entry("gaborone-bw", "Gaborone", "Botswana", "BW", -24.6282, 25.9231),
  entry("harare-zw", "Harare", "Zimbabwe", "ZW", -17.8252, 31.0335),
  entry("maputo-mz", "Maputo", "Mozambique", "MZ", -25.9692, 32.5732),
  entry("lusaka-zm", "Lusaka", "Zambia", "ZM", -15.3875, 28.3228),
  // Oceania (more)
  entry("suva-fj", "Suva", "Fiji", "FJ", -18.1416, 178.4419),
  entry("port-moresby-pg", "Port Moresby", "Papua New Guinea", "PG", -9.4438, 147.1803),
];

const combined = [...existing, ...additions];

const seenIds = new Set();
for (const e of combined) {
  if (seenIds.has(e.id)) throw new Error(`duplicate gazetteer id in curation data: ${e.id}`);
  seenIds.add(e.id);
}

fs.writeFileSync(gazetteerPath, JSON.stringify(combined, null, 2) + "\n");
console.log(`gazetteer.json: ${existing.length} existing + ${additions.length} added = ${combined.length} total entries`);

const byCountry = {};
for (const e of combined) byCountry[e.country] = (byCountry[e.country] || 0) + 1;
const singleCityCountries = Object.entries(byCountry).filter(([, n]) => n === 1);
console.log(`countries with only one gazetteer entry: ${singleCityCountries.length} of ${Object.keys(byCountry).length}`);
if (singleCityCountries.length) console.log(singleCityCountries.map(([c]) => c).join(", "));
