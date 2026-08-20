// Tier 2: new sourcing beyond the original Firestore export (which was
// fully exhausted by Tier 1 — see CURATION_NOTES.md). Every entry here
// was checked against its actual Commons file page for license status
// before being added. Run once, from the repo root:
//   node scripts/migrate-download-originals-tier2.js
import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "content", "originals");

const ITEMS = [
  { localName: "tokyo-kyobashi-bridge-1890.png", url: "https://upload.wikimedia.org/wikipedia/commons/e/e1/Kyobashi_Capital_Bridge_Tokyo_c1890.png" },
  { localName: "rome-piazza-venezia-1895.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/e/e8/Flickr_-_%E2%80%A6trialsanderrors_-_Piazza_Venezia%2C_Rome%2C_Italy%2C_ca._1895.jpg" },
  { localName: "cairo-vue-du-caire.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/3/38/Charles-Th%C3%A9odore_Fr%C3%A8re_-_Vue_du_Caire_01.jpg" },
  { localName: "bangkok-wat-arun-panorama-1865.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/3/3d/Bangkok_Panorama_from_Wat_Arun_by_John_Thomson_1865.jpg" },
  { localName: "buenos-aires-panoramica-1890.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/b/bc/Archivo_General_de_la_Naci%C3%B3n_Argentina_1890_aprox_Buenos_Aires%2C_Vista_panor%C3%A1mica_hacia_el_este.jpg" },
  { localName: "shanghai-the-bund-1890.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/6/67/The_Bund%2C_Shanghai%2C_c1890s.jpg" },
  { localName: "stockholm-drottninggatan-1880.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/f/f1/341._Stockholm._Parti_av_Drottninggatan_%28retouched%29.jpg" },
  { localName: "istanbul-galata-bridge-1890.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/b/b6/Bridge_and_Galata_Area%2C_Istanbul%2C_Turkey_by_Abdullah_Fr%C3%A8res%2C_ca._1880-1893_%28LOC%29.jpg" },
  { localName: "cape-town-adderley-street-1897.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/f/f4/Adderley_Street%2C_Cape_Town%2C_looking_NE_-_ca._1897.jpg" },
  { localName: "rio-guanabara-bay-1895.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/8/87/Vista_da_ba%C3%ADa_de_Guanabara%2C_a_partir_de_Niter%C3%B3i_%28001GU001035%29.jpg" },
  { localName: "vienna-naschmarkt-1898.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/3/32/Naschmarkt_um_1898.jpg" },
  { localName: "moscow-vshivaya-gorka-1884.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/b/ba/Vshivaya_Gorka%2C_View_across_the_River_Moscow.jpg" },
  { localName: "manila-view-1826.png", url: "https://upload.wikimedia.org/wikipedia/commons/7/78/View_of_Manila%2C_Capital_of_Luzon_Island%2C_Philippine_Islands%2C_1826-1829.png" },
  { localName: "batavia-kali-besar-1875.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/3/37/Collectie_NMvWereldculturen%2C_RV-A131-32%2C_Foto%2C_%27De_rede_van_Batavia%2C_de_Kali_Besar_en_de_Kleine_Boom_met_de_Hoenderpasarbrug_en_pakhuizen%27%2C_fotograaf_Woodbury_%26_Page%2C_ca._1875.jpg" },
  { localName: "algiers-bay-1899.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/3/3c/Algiers_bay_1899.jpg" },
  { localName: "melbourne-1880.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Melbourne_1880_by_Samuel_Calvert.jpg" },
  { localName: "lima-plaza-mayor-1870.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/9/9c/Plaza_mayor_de_Lima%2C_a%C3%B1o_1870.jpg" },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function attemptDownload(url, destPath) {
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
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
    await sleep(3000);
  }
  console.log(`\n${ok}/${ITEMS.length} originals present in ${outDir}`);
}

main();
