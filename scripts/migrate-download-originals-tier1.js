// Tier 1 follow-up: download originals for the 41 license-cleared
// candidates from content/source/_firestore_export_flat.json that were
// not part of the M2 seed batch. Every entry here was checked against
// its actual Commons file page before being added here — see the task
// history for per-item license findings. One item (Victoria Terminus,
// Bombay in 1950, firestoreId wquUYnM6bBs31jPB7JxR) is deliberately
// excluded: its Commons page carries only a PD-India tag with an
// explicit "requires a US public domain tag as well" warning and an
// ambiguous date, so it isn't cleared.
//
// Run once, from the repo root: node scripts/migrate-download-originals-tier1.js
import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "content", "originals");

const ITEMS = [
  { firestoreId: "10hln5GGn1qrDGvUhViB", localName: "mumbai-fort-1672.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/a/a6/AMH-6748-NA_Two_views_of_the_English_fort_in_Bombay.jpg" },
  { firestoreId: "1gAhSDxCCw2nye4Ngn1x", localName: "kolkata-chowringhee-1945.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/4/47/Chowringhee_Square%2C_Calcutta_in_1945.jpg" },
  { firestoreId: "4m1HHCBADHwokpXkIfzK", localName: "lucknow-palace-gates-1801.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/9/9d/Gates_of_Palace_at_Lucknow_William_Daniell_1801.jpg" },
  { firestoreId: "5rFjhtH1bzwwkHMiuXR3", localName: "goa-codice-casanatense-1540.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/c/c1/Codice_Casanatense_Portuguese_Nobleman_and_Christian_Indian.jpg" },
  { firestoreId: "8Bmxec8WmnNZYAsKEtw2", localName: "kathmandu-market-1920.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/7/77/Kathmandu_Market_1920.jpg" },
  { firestoreId: "AB2kSzel4Ac2OmyPLq8U", localName: "kabul-capitale-1885.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/a/ac/Kabul%2C_capitale_dell%E2%80%99Afganistan_a.jpg" },
  { firestoreId: "AasRZ9MHfWX3avrFwMGT", localName: "lagos-1892.png", url: "https://upload.wikimedia.org/wikipedia/commons/a/ae/Lagos%2C_from_1892_book_The_Story_of_Africa_and_its_Explorers.png" },
  { firestoreId: "BW303kWXn1vXuRM2nJdt", localName: "copenhagen-shellhuset-1945.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/3/37/Shellhuset_210345.jpg" },
  { firestoreId: "CWogM3KStTE6br1WgpkQ", localName: "new-orleans-canal-st-1857.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/a/a1/CanalSt1857BallouKilburn.jpg" },
  { firestoreId: "Fzv5KJh5vUGSY3DO3cu3", localName: "dhaka-city-1861.png", url: "https://upload.wikimedia.org/wikipedia/commons/1/1f/DhakaCity1861.png" },
  { firestoreId: "HDiiMk65zAhGuM0v80HY", localName: "dhaka-lalbagh-fort-1787.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/6/6e/Zoffany-Lalbagh_Fort.jpg" },
  { firestoreId: "JC8McKIsmJ03OinZDZ0X", localName: "karachi-04c-1930.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/a/af/Karachi04c.jpg" },
  { firestoreId: "JOZfAagjgY3OxWBlkT29", localName: "karachi-st-joseph-1910.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/b/bd/St_Joseph_Convent_School_Karachi_in_1910.jpg" },
  { firestoreId: "JT2nlgqrTJYOGQrgCdOa", localName: "odense-staden-1865.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/d/df/Staden_Odense_p%C3%A5_Fyen%2C_sedd_fr%C3%A5n_Allerups_Maskinfabrik_-_Nordiska_taflor_-_no-nb_digibok_2014031426011-61.jpg" },
  { firestoreId: "LRpBClPm11iDsyl1UaoX", localName: "jaffna-birds-eye-1658.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/8/8a/AMH-4491-NA_Bird%27s_eye_view_of_the_city_of_Jaffnapatnam.jpg" },
  { firestoreId: "RvTVuAyb3QVTWrHFrojy", localName: "colombo-after-kip-1775.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/b/b5/Colombo%2C_after_Kip.jpg" },
  { firestoreId: "Uhmo2ZDUV9x0eBjldrT7", localName: "antananarivo-tombs-1885.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/2/2a/Tombs_of_Radama_and_Rasoherina_at_Rova_of_Antananarivo_Madagascar.jpg" },
  { firestoreId: "Z9y0zpzfN9uHf7ga3f19", localName: "lahore-duleep-singh-1893.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/4/4d/Maharajah_Duleep_Singh_%281838-1893%29%2C_entering_his_palace_in_Lahore%2C_escorted_by_British_troops.jpg" },
  { firestoreId: "ZMb8nuDjxetB9GWUcmyJ", localName: "basra-mss-eur-1908.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/0/09/Mss_Eur_F111_33_1492.jpg" },
  { firestoreId: "ZvZrFNxjwvNjBaHNwPOA", localName: "kabul-shuja-shah-1839.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/2/24/Shuja_Shah_Durrani_of_Afghanistan_in_1839.jpg" },
  { firestoreId: "aRlEuAY3A9pPEVJXrX0P", localName: "basra-wwi-1915.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/1/19/Ministry_of_Information_First_World_War_Official_Collection_Q25671.jpg" },
  { firestoreId: "bHcyrFVmWcPME1NCvu47", localName: "santiago-canada-1821.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/0/0a/Schmidtmeyer%2C_Peter_%26_Scharf%2C_G_-_The_Ca%C3%B1ada%2C_Santiago_-JCB_Library_f1_%28cropped%29.jpg" },
  { firestoreId: "eat6HUc6dqO4JKOqVZgR", localName: "kazan-university-1834.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Kazan_University%2C_1832.jpg" },
  { firestoreId: "egVxoK9oTJLIjoUaKOAE", localName: "mexico-city-paseo-viga-1642.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/6/62/5829_Paseo_de_la_Viga_con_la_iglesia_de_Iztacalco.jpg" },
  { firestoreId: "fOPIEbgzkEHP3s3iFCGy", localName: "oslo-christiania-theater-1860.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/d/d4/Christiania_Theater_OB.F02178D.jpg" },
  { firestoreId: "hAy14a5ev3CBNy2TyOl1", localName: "london-panorama-1751.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/d/dc/Panoramic_view_of_London_in_1751_by_T._Bowles.JPG" },
  { firestoreId: "leqJEeWAjkBDBcGaeJjG", localName: "pondicherry-waterfront-1900.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/9/91/Pondicherry_waterfront_1900.jpg" },
  { firestoreId: "p9pT9fAk0dRWOuveOFOb", localName: "kazan-capture-1894.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/e/e9/Capture_of_Kazan_%28Shamshin%2C_1894%29.jpeg" },
  { firestoreId: "pYQoiaNZ0gULY8qbm1bl", localName: "oslo-lamotte-1813.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/6/63/LAMOTTE%281813%29_p161_CHRISTIANIA_%28OSLO%29.jpg" },
  { firestoreId: "q1nR5B9ORAjBxkpcOlqp", localName: "karachi-old-1830.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/3/33/Oldkarachi.jpg" },
  { firestoreId: "qMZ1OqbCAJwazqGtIH22", localName: "oslo-tekniske-skole-1900.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/5/5f/Christiania_tekniske_skole_OB.F14680ai.jpg" },
  { firestoreId: "t48IPli0dPBC8zmdR1Xx", localName: "odense-aa-1893.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/a/ab/Odense_Aa_Johs_Boesen.jpg" },
  { firestoreId: "tVNfXvCEn2icSUsnfk2w", localName: "kathmandu-seto-machindranath-1915.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/0/01/Kathmandu_Seto_Machindranath_19th_century.jpg" },
  { firestoreId: "upZfAnObzXhbOpsR0PDy", localName: "varanasi-brahmin-garland-1832.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/e/ec/Benares_A_Brahmin_placing_a_garland_on_the_holiest_spot_in_the_sacred_city_by_James_Prinsep_1832.jpg" },
  { firestoreId: "vOOl9eCHBsA3cKqefe9X", localName: "singapore-victoria-dock-1890.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/6/67/Victoria_Dock%2C_Tanjong_Pagar%2C_in_the_1890s.jpg" },
  { firestoreId: "x2K3Z1YgyWWaiJPr0Lnd", localName: "copenhagen-kbh-1900.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/c/c1/KBH_1890-1900.jpg" },
  { firestoreId: "x6P9j4zyq06ZouFWdeQX", localName: "varanasi-river-1883.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/3/3e/On_The_River_Benares_ca_1883.jpg" },
  { firestoreId: "xHvEOEHRRBtSYTAlH9Cg", localName: "colombo-independence-1947.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/6/63/SL_Independence.jpg" },
  { firestoreId: "xwZeM3ZIJmLSHjX0bA0o", localName: "baghdad-parsons-1808.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/1/16/PARSONS%281808%29_p008_View_of_Bagdad_on_the_Persian_side_of_the_Tigris.jpg" },
  { firestoreId: "zeups1I28b6Bkf8uMQVa", localName: "copenhagen-soldiers-return-1849.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/b/b0/Otto_Bache_-_Soldaternes_hjemkomst_til_K%C3%B8benhavn_i_1849.jpg" },
  { firestoreId: "zmLNzgXDv5HfLO3lj4db", localName: "hong-kong-city-of-victoria-1865.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/1/1f/City_of_Victoria.jpg" },
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
