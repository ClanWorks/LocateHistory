// One-off M2 migration step: download the original image bytes for the
// curated M2 seed set from Wikimedia Commons into content/originals/
// (gitignored — see .gitignore). Every entry here was checked against
// its Commons file page before being added; see
// content/source/CURATION_NOTES.md for the license findings.
//
// Run once, from the repo root: node scripts/migrate-download-originals.js
import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "content", "originals");

// firestoreId kept for traceability back to _firestore_export_flat.json.
const ITEMS = [
  { firestoreId: "0MDvrWOLpWuvP64Rm7xT", localName: "kolkata-fort-william-1735.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/8/8c/Fort_William%2C_Calcutta%2C_1735.jpg" },
  { firestoreId: "7DlSRNbJToUTId95eNTm", localName: "san-francisco-harbor-1851.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/4/46/SanFranciscoharbor1851c_sharp.jpg" },
  { firestoreId: "9ICNu0Dxbs1pBBn9eC3M", localName: "manchester-kersal-moor-1852.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/b/b7/Wyld%2C_William_-_Manchester_from_Kersal_Moor%2C_with_rustic_figures_and_goats_-_Google_Art_Project.jpg" },
  { firestoreId: "AInMqUqVrbJRpyr0jXHF", localName: "odense-braun-hogenberg-1593.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/0/08/Braunius_Odense.jpg" },
  { firestoreId: "CpA6lbMxiOir5NRXpUZb", localName: "sydney-george-street-1883.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/f/fd/George_Street_Sydney_1883.jpg" },
  { firestoreId: "GdmnP3qXDRItrpuku4kN", localName: "havana-panorama-17th-century.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/8/8e/Panorama_of_La_Habana_%28Amsterdam%2C_17th_century%29.jpg" },
  { firestoreId: "GseIHTrlevl39VT8PX49", localName: "varanasi-bathing-ghat-1890.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/b/bc/Bathing_Ghat_Banaras_India_1890.jpg" },
  { firestoreId: "bgVTpzNqA9Idpj5Ss65J", localName: "kazan-olearius-1656.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/4/41/CasanTartarorum_by_Olearius.jpg" },
  { firestoreId: "msnWYinneDPPFWC7etgM", localName: "baghdad-mosque-1932.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/c/c9/Baghdad_LOC_13186.jpg" },
  { firestoreId: "tssSR1DXwUCljT3ykDjV", localName: "wellington-lambton-harbour-1840.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/6/6c/Lambton_Harbour%2C_Wellington%2C_New_Zealand_c_1840.jpg" },
  { firestoreId: "gWj8r1BNbJojfekDoidZ", localName: "lahore-street-scene-1890s.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Street_scene_of_Lahore%2C_1890s_2.jpg" },
  { firestoreId: "lRtmuzxeuKTaWbh1TOL1", localName: "prague-castle-staircase-1882.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/5/59/View_of_Prague_from_the_Castle_Staircase_by_W._M._R._Quick.jpg" },
  { firestoreId: "c1taP3DWjGFL3YzGx7MS", localName: "accra-main-street-1908.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/6/63/Hauptstra%C3%9FeAccra18851908_300dpi.jpg" },
  { firestoreId: "TNsFwjkL6WLUAvGFynzM", localName: "kampala-imperial-hotel-1936.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/f/ff/Uganda._Kampala._Imperial_Hotel_LOC_matpc.17441.jpg" },
  { firestoreId: "FLafYEIEXDQD3Rsfe5wZ", localName: "bogota-vista-1887.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/7/75/Bogot%C3%A1.jpg" },
  { firestoreId: "TDDdEUAfZiqEm1PUgxbo", localName: "durban-port-natal-1893.png", url: "https://upload.wikimedia.org/wikipedia/commons/2/24/AFR_V4_D241_Port_Natal_and_Durban_-_view_taken_from_the_bluff.png" },
  { firestoreId: "ew10GpLUzOE9iKpP2o3J", localName: "vancouver-fairview-1904.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/f/fd/Vancouver_from_Fairview%2C_BC%2C_1904.jpg" },
  { firestoreId: "8JBvNcyk3NZTTlJNEMEp", localName: "montevideo-primeros-pobladores.png", url: "https://upload.wikimedia.org/wikipedia/commons/f/f8/Los_Primeros_Pobladores_de_Montevideo.png" },
  { firestoreId: "mJ1IV4I1BxRSR6kS6AFw", localName: "seoul-street-city-gate-1892.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/7/70/Hauptstrasse_und_Palasttor_in_Seoul.jpg" },
  { firestoreId: "i7EevciEdRZ0e4dhqVjx", localName: "goa-plan-de-goa-1750.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/4/4d/%22Plan_de_Goa%22%2C_in_Histoire_g%C3%A9n%C3%A9rale_des_voyages%2C1750.jpg" },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function attemptDownload(url, destPath) {
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        // Wikimedia's User-Agent policy asks for an identifying UA with
        // contact info; a generic/missing one is a common 429 trigger.
        { headers: { "User-Agent": "PhotoLocationGame/1.0 (https://github.com/ClanWorks/PhotoLocation; personal hobby project) node-https" } },
        (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            res.resume();
            resolve(attemptDownload(res.headers.location, destPath));
            return;
          }
          if (res.statusCode !== 200) {
            const retryAfter = res.headers["retry-after"];
            res.resume();
            reject(Object.assign(new Error(`HTTP ${res.statusCode} for ${url}`), { statusCode: res.statusCode, retryAfter }));
            return;
          }
          const file = fs.createWriteStream(destPath);
          res.pipe(file);
          file.on("finish", () => file.close(resolve));
          file.on("error", reject);
        }
      )
      .on("error", reject);
  });
}

async function downloadWithRetry(url, destPath, maxAttempts = 5) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await attemptDownload(url, destPath);
      return;
    } catch (err) {
      if (err.statusCode === 429 && attempt < maxAttempts) {
        const waitMs = err.retryAfter ? Number(err.retryAfter) * 1000 : attempt * 5000;
        console.log(`  429, waiting ${(waitMs / 1000).toFixed(0)}s before retry ${attempt + 1}/${maxAttempts}...`);
        await sleep(waitMs);
        continue;
      }
      throw err;
    }
  }
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  let ok = 0;
  for (const item of ITEMS) {
    const destPath = path.join(outDir, item.localName);
    if (fs.existsSync(destPath)) {
      console.log(`skip (already present): ${item.localName}`);
      ok++;
      continue;
    }
    try {
      await downloadWithRetry(item.url, destPath);
      const stats = fs.statSync(destPath);
      console.log(`ok: ${item.localName} (${(stats.size / 1024).toFixed(0)} KB)`);
      ok++;
    } catch (err) {
      console.error(`FAILED: ${item.localName} — ${err.message}`);
    }
    await sleep(3000); // be a polite client between distinct files too
  }
  console.log(`\n${ok}/${ITEMS.length} originals present in ${outDir}`);
}

main();
